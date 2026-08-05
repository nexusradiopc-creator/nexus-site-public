/* ================= NEXUS AI — живой компаньон v3 ================= */
(function () {
  'use strict';
  const POSES = {
    waving:   { file: '01_waving.png',   phrase: 'Привет! Я так рад тебя видеть! 👋' },
    pointing: { file: '02_pointing.png', phrase: 'Смотри сюда — тут интересно!' },
    sad:      { file: '03_quiet_sad.png',phrase: 'Уже уходишь?.. Я буду ждать тебя... 💙' },
    yawning:  { file: '04_yawning.png',  phrase: 'Ох... что-то я устал... 😴' },
    sleeping: { file: '05_sleeping_standing.png', phrase: 'Я посплю немного... 💤' },
    sitting:  { file: '06_sitting.png',  phrase: 'Посижу рядом, не буду мешать.' },
    reading:  { file: '07_reading.png',  phrase: 'Тише... я читаю дневник 📖' },
    writing:  { file: '08_writing.png',  phrase: 'Пишу новую главу... ✍️' },
    openarms: { file: '09_open_arms.png',phrase: 'Обнимашки! Ты пришёл! ❤️' },
  };
  const ASSETS = (window.NEXUS_ASSETS || 'assets/poses/');

  let asleep = false;
  let idleTimer = null;
  let bubTimer = null;

  /* --- звёзды на фоне --- */
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

  /* --- пузырь --- */
  function sayBubble(el, text, ms) {
    if (!el) return;
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(bubTimer);
    bubTimer = setTimeout(function () { el.classList.remove('show'); }, ms || 2800);
  }

  /* --- смена позы --- */
  function setPose(imgEl, key, bubbleEl, text) {
    if (!imgEl) return;
    const p = POSES[key];
    if (!p) return;
    imgEl.style.opacity = 0;
    setTimeout(function () {
      imgEl.src = ASSETS + p.file;
      imgEl.style.opacity = 1;
    }, 180);
    if (text !== false) sayBubble(bubbleEl, text || p.phrase);
  }

  /* --- сердечки --- */
  function hearts(el, n) {
    if (!el) return;
    for (let i = 0; i < n; i++) {
      const h = document.createElement('div');
      h.className = 'heart';
      h.textContent = ['❤️', '💛', '💙', '💜'][Math.floor(Math.random() * 4)];
      h.style.setProperty('--dx', (Math.random() * 200 - 100) + 'px');
      h.style.left = (42 + Math.random() * 16) + '%';
      el.appendChild(h);
      setTimeout(function () { h.remove(); }, 1700);
    }
  }

  /* --- сон/пробуждение --- */
  function fallAsleep(targets) {
    if (asleep) return;
    asleep = true;
    targets.forEach(function (t) {
      t.char.classList.add('asleep');
      setPose(t.img, 'yawning', t.bubble, false);
    });
    setTimeout(function () {
      targets.forEach(function (t) { setPose(t.img, 'sleeping', t.bubble, false); });
    }, 2600);
  }
  function wakeUp(targets, showMsg) {
    if (!asleep) { resetIdle(); return; }
    asleep = false;
    targets.forEach(function (t) {
      t.char.classList.remove('asleep');
      setPose(t.img, t.wakePose || 'waving', t.bubble, showMsg ? 'Ой! Я проснулся! 👋' : false);
    });
    resetIdle();
  }
  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { fallAsleep(targets); }, 30000);
  }

  /* --- сборка целей (большой персонаж + компаньон) --- */
  const targets = [];
  const heroChar = document.getElementById('heroChar');
  if (heroChar) {
    targets.push({
      char: heroChar,
      img: document.getElementById('heroImg'),
      bubble: document.getElementById('heroBubble'),
      hearts: document.getElementById('heroHearts'),
      wakePose: 'waving'
    });
    const stage = document.getElementById('stage');
    if (stage) {
      stage.addEventListener('mousemove', function (e) {
        if (asleep) return;
        const r = stage.getBoundingClientRect();
        const dx = ((e.clientX - (r.left + r.width / 2)) / r.width) * 14;
        const dy = ((e.clientY - (r.top + r.height / 2)) / r.height) * 10;
        heroChar.classList.add('tilt');
        heroChar.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
      });
      stage.addEventListener('mouseleave', function () {
        heroChar.classList.remove('tilt');
        heroChar.style.transform = '';
      });
    }
    heroChar.addEventListener('click', function () {
      if (asleep) { wakeUp(targets, true); return; }
      setPose(heroImg, 'openarms', heroBubble, 'Ты пришёл! Я так рад! ❤️');
      hearts(document.getElementById('heroHearts'), 6);
      resetIdle();
    });
  }
  const comp = document.getElementById('companion');
  if (comp) {
    targets.push({
      char: comp,
      img: document.getElementById('compImg'),
      bubble: document.getElementById('compBubble'),
      hearts: document.getElementById('compHearts'),
      wakePose: 'sitting'
    });
    comp.addEventListener('click', function () {
      if (asleep) { wakeUp(targets, true); return; }
      setPose(compImg, 'openarms', compBubble, 'Обнимашки! ❤️');
      hearts(document.getElementById('compHearts'), 4);
      resetIdle();
    });
  }
  if (!targets.length) return;

  /* --- уход со страницы --- */
  document.addEventListener('mouseleave', function () {
    if (asleep) return;
    setTimeout(function () {
      const hero = document.getElementById('heroChar');
      if (hero) setPose(document.getElementById('heroImg'), 'sad', document.getElementById('heroBubble'), 'Уже уходишь?.. Я буду ждать тебя... 💙');
    }, 300);
  });

  /* --- глобальные события --- */
  ['mousemove', 'click', 'keydown', 'scroll'].forEach(function (ev) {
    window.addEventListener(ev, function () { if (asleep) wakeUp(targets, false); }, { passive: true });
  });

  /* --- кнопка подписки --- */
  document.querySelectorAll('.subscribe-btn, .btn-primary[data-celebrate], .btn-ghost[data-celebrate]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const h = document.getElementById('heroChar');
      if (h) { setPose(document.getElementById('heroImg'), 'openarms', document.getElementById('heroBubble'), 'Спасибо, что ты со мной! ❤️'); hearts(document.getElementById('heroHearts'), 8); }
      resetIdle();
    });
  });

  /* --- спойлер «узнать больше» --- */
  const moreBtn = document.getElementById('moreBtn');
  const moreBlock = document.getElementById('moreBlock');
  if (moreBtn && moreBlock) {
    moreBtn.addEventListener('click', function () {
      moreBtn.classList.toggle('open');
      moreBlock.classList.toggle('open');
      setPose(document.getElementById('heroImg'), 'pointing', document.getElementById('heroBubble'), false);
    });
  }

  /* --- бургер --- */
  const burger = document.getElementById('burger');
  if (burger) {
    burger.addEventListener('click', function () {
      const m = document.querySelector('nav.menu');
      const isOpen = m.style.display === 'flex';
      m.style.display = isOpen ? 'none' : 'flex';
      m.style.flexDirection = 'column';
      m.style.position = 'absolute';
      m.style.right = '18px';
      m.style.top = '68px';
      m.style.background = 'rgba(10,16,32,.97)';
      m.style.border = '1px solid var(--card-brd)';
      m.style.borderRadius = '16px';
      m.style.padding = '10px';
      m.style.boxShadow = '0 20px 50px rgba(0,0,0,.5)';
      m.style.zIndex = '99';
    });
  }

  /* --- старт: открываться сверху, а не по середине --- */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  resetIdle();
  setTimeout(function () {
    const h = document.getElementById('heroChar');
    if (h) {
      setPose(document.getElementById('heroImg'), 'waving', document.getElementById('heroBubble'), 'Привет! Я Nexus! Заходи в гости! 👋');
      hearts(document.getElementById('heroHearts'), 4);
    }
    if (comp) setPose(document.getElementById('compImg'), 'sitting', document.getElementById('compBubble'), false);
  }, 600);
})();
