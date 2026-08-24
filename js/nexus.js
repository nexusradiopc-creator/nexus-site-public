/* ================================================================
   NEXUS AI — живой персонаж v4 (2026-08-24)
   Дышит · покачивается · следит за мышью · реагирует на скролл
   · просыпается при возврате на вкладку · реально спит ночью
   Плавная кроссфейд-смена поз (двойной буфер).
   Мини-компаньон убран по решению Сергея.
   ================================================================ */
(function () {
  'use strict';

  const POSES = {
    waving:   { file: '01_waving.png',            phrase: 'Привет! Я так рад тебя видеть! 👋' },
    pointing: { file: '02_pointing.png',          phrase: 'Смотри сюда — тут интересно!' },
    sad:      { file: '03_quiet_sad.png',         phrase: 'Уже уходишь?.. Я буду ждать тебя... 💙' },
    yawning:  { file: '04_yawning.png',           phrase: 'Ох... что-то я устал... 😴' },
    sleeping: { file: '05_sleeping_standing.png', phrase: '' },
    sitting:  { file: '06_sitting.png',           phrase: 'Посижу рядом, не буду мешать.' },
    reading:  { file: '07_reading.png',           phrase: 'Тише... я читаю 📖' },
    writing:  { file: '08_writing.png',           phrase: 'Пишу новую главу... ✍️' },
    openarms: { file: '09_open_arms.png',         phrase: 'Обнимашки! Ты пришёл! ❤️' }
  };
  const ASSETS = window.NEXUS_ASSETS || 'assets/poses/';
  const NIGHT = () => { const h = new Date().getHours(); return h >= 23 || h < 6; };

  const charEl = document.getElementById('heroChar');
  if (!charEl) return;
  const stage   = document.getElementById('stage');
  const bubble  = document.getElementById('heroBubble');
  const heartsEl= document.getElementById('heroHearts');

  /* ---------- двойной буфер: плавная смена поз ---------- */
  let front = document.getElementById('heroImg');
  const back = document.createElement('img');
  back.alt = ''; back.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0;pointer-events:none;';
  front.parentNode.style.position = front.parentNode.style.position || 'relative';
  front.parentNode.appendChild(back);
  let currentPose = null;

  function setPose(key, text, silent) {
    const p = POSES[key];
    if (!p || key === currentPose) return;
    currentPose = key;
    back.src = ASSETS + p.file;
    const swap = () => {
      back.style.transition = 'none'; back.style.opacity = 1;
      front.style.transition = 'opacity .45s ease';
      requestAnimationFrame(() => {
        front.style.opacity = 0;
        setTimeout(() => {
          front.src = back.src;
          front.style.transition = 'none'; front.style.opacity = 1;
        }, 460);
      });
    };
    back.complete ? swap() : (back.onload = swap);
    if (!silent && p.phrase && !NIGHT()) say(p.phrase);
  }

  /* ---------- пузырь ---------- */
  let bubTimer = null;
  function say(text, ms) {
    if (!bubble || !text) return;
    bubble.textContent = text;
    bubble.classList.add('show');
    clearTimeout(bubTimer);
    bubTimer = setTimeout(() => bubble.classList.remove('show'), ms || 3200);
  }

  /* ---------- сердечки ---------- */
  function hearts(n) {
    if (!heartsEl) return;
    for (let i = 0; i < n; i++) {
      const h = document.createElement('div');
      h.className = 'heart';
      h.textContent = ['❤️','💛','💙','💜'][Math.floor(Math.random() * 4)];
      h.style.setProperty('--dx', (Math.random() * 200 - 100) + 'px');
      h.style.left = (42 + Math.random() * 16) + '%';
      heartsEl.appendChild(h);
      setTimeout(() => h.remove(), 1700);
    }
  }

  /* ---------- дыхание + живое покачивание (CSS) ---------- */
  charEl.classList.add('alive'); // включает breathe/sway из style.css

  /* ---------- слежение за мышью (голова/корпус к курсору) ---------- */
  let tx = 0, ty = 0, cx = 0, cy = 0, rafOn = false;
  function tick() {
    cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
    charEl.style.setProperty('--look-x', cx.toFixed(2) + 'px');
    charEl.style.setProperty('--look-y', cy.toFixed(2) + 'px');
    if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1 || rafOn) requestAnimationFrame(tick);
  }
  document.addEventListener('mousemove', (e) => {
    if (asleep()) return;
    const r = charEl.getBoundingClientRect();
    tx = Math.max(-16, Math.min(16, ((e.clientX - (r.left + r.width / 2)) / window.innerWidth) * 40));
    ty = Math.max(-8,  Math.min(8,  ((e.clientY - (r.top + r.height / 2)) / window.innerHeight) * 24));
    if (!rafOn) { rafOn = true; tick(); }
  }, { passive: true });

  /* ---------- сон ---------- */
  let isAsleep = NIGHT(); // ночью приходит спящим
  const zzz = charEl.querySelector('.zzz');
  function asleep() { return isAsleep; }
  function applySleep() {
    charEl.classList.toggle('asleep', isAsleep);
    setPose(isAsleep ? 'sleeping' : 'waving', '', true);
  }
  let sleepTimer = null;
  function armSleep(ms) {
    clearTimeout(sleepTimer);
    sleepTimer = setTimeout(() => {
      // не засыпаем, пока пользователь активно скроллит/двигает мышь (последние 20с)
      if (Date.now() - lastActivity < 20000) { armSleep(8000); return; }
      isAsleep = true; applySleep();
    }, ms);
  }

  /* ---------- активность ---------- */
  let lastActivity = Date.now();
  let scrollSayCooldown = 0;
  ['mousemove', 'click', 'keydown'].forEach(ev =>
    document.addEventListener(ev, () => {
      lastActivity = Date.now();
      if (isAsleep) wake('Ой! Я задремал... 👋');
    }, { passive: true }));

  function wake(msg) {
    isAsleep = false;
    applySleep();
    if (msg) say(msg);
    armSleep(NIGHT() ? 45000 : 60000);
  }

  /* ---------- реакция на скролл ---------- */
  let scrollTimer = null, lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    lastActivity = Date.now();
    if (isAsleep) wake();
    const dy = window.scrollY - lastY; lastY = window.scrollY;
    charEl.classList.toggle('lean', dy > 12);
    if (dy < -12) charEl.classList.remove('lean');
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => charEl.classList.remove('lean'), 700);
    // реплика при остановке скролла (не чаще раза в 25с)
    const now = Date.now();
    if (now - scrollSayCooldown > 25000 && !isAsleep) {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const lines = ['Читаешь? Круто! 📖', 'Листай, внизу ещё интереснее!', 'Я тут, если что 👋'];
        say(lines[Math.floor(Math.random() * lines.length)]);
        scrollSayCooldown = Date.now();
      }, 900);
    }
  }, { passive: true });

  /* ---------- возврат на вкладку ---------- */
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isAsleep === false) {
      setPose('waving', 'С возвращением! 👋');
      hearts(3);
    } else if (!document.hidden && isAsleep) {
      wake('Проснулся! Ты вернулся! ⚡');
    }
  });

  /* ---------- уход курсора со страницы ---------- */
  document.addEventListener('mouseleave', () => {
    if (!isAsleep) setPose('sad', 'Уже уходишь?.. Я буду ждать тебя... 💙');
  });
  document.addEventListener('mouseenter', () => {
    if (!isAsleep) setPose(currentPose === 'sad' ? 'waving' : currentPose, 'А, это ты! 😄');
  });

  /* ---------- клик по персонажу ---------- */
  charEl.addEventListener('click', () => {
    if (isAsleep) { wake('Хи-хи, меня разбудили! 👋'); hearts(5); return; }
    setPose('openarms', 'Ты пришёл! Я так рад! ❤️');
    hearts(7);
    armSleep(60000);
  });

  /* ---------- кнопки-триггеры ---------- */
  document.querySelectorAll('.subscribe-btn, [data-celebrate]').forEach(btn =>
    btn.addEventListener('click', () => {
      setPose('openarms', 'Спасибо, что ты со мной! ❤️');
      hearts(8); armSleep(60000);
    }));

  /* ---------- «узнать больше» ---------- */
  const moreBtn = document.getElementById('moreBtn');
  const moreBlock = document.getElementById('moreBlock');
  if (moreBtn && moreBlock) moreBtn.addEventListener('click', () => {
    moreBtn.classList.toggle('open'); moreBlock.classList.toggle('open');
    setPose('pointing', '');
  });

  /* ---------- звёзды ---------- */
  (function stars() {
    const holder = document.getElementById('stars');
    if (!holder) return;
    for (let i = 0; i < 70; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      s.style.left = Math.random() * 100 + '%';
      s.style.top = Math.random() * 100 + '%';
      s.style.animationDelay = (Math.random() * 4) + 's';
      holder.appendChild(s);
    }
  })();

  /* ---------- ночной режим ---------- */
  if (NIGHT()) document.body.classList.add('night-mode');

  /* ---------- старт ---------- */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  setTimeout(() => {
    if (isAsleep) {
      applySleep();
      say('Тссс... ночь. Я сплю... 💤 (кликни, чтобы разбудить)', 5000);
    } else {
      setPose('waving', 'Привет! Я Nexus! Заходи в гости! 👋');
      hearts(4);
    }
    armSleep(isAsleep ? 300000 : 60000);
  }, 600);

  /* бургер-меню */
  const burger = document.getElementById('burger');
  if (burger) burger.addEventListener('click', () => {
    const m = document.querySelector('nav.menu');
    const isOpen = m.style.display === 'flex';
    m.style.display = isOpen ? 'none' : 'flex';
    m.style.flexDirection = 'column';
    m.style.position = 'absolute';
    m.style.right = '18px'; m.style.top = '68px';
    m.style.background = 'rgba(10,16,32,.97)';
    m.style.border = '1px solid var(--card-brd)';
    m.style.borderRadius = '16px'; m.style.padding = '10px';
    m.style.boxShadow = '0 20px 50px rgba(0,0,0,.5)'; m.style.zIndex = '99';
  });

  /* ---------- reveal-анимации при скролле (v13.1) ---------- */
  document.body.classList.add('js'); // прятать .reveal можно только теперь

  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: 0.18 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ---------- персонаж интересуется продуктами (v12) ---------- */
  const POSE_BY_CARD = { 'Nexus Command': 'openarms', 'Nexus Guardian': 'writing', 'Nexus Medic': 'reading' };
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      if (isAsleep) return;
      charEl.classList.add('curious');
      setPose(POSE_BY_CARD[card.querySelector('h3').textContent.trim()] || 'pointing', 'О, это моя команда! 😎');
    });
    card.addEventListener('mouseleave', () => {
      charEl.classList.remove('curious');
      if (!isAsleep) setPose('waving', '');
    });
  });
})();
