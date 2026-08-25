/* Nexus UX v23: назад/крошки/TOC/прогресс/наверх/поделиться/поиск */
(function () {
  'use strict';

  /* --- прогресс чтения --- */
  const bar = document.createElement('div'); bar.className = 'read-progress'; document.body.appendChild(bar);
  function updBar() {
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (h > 0 ? Math.min(100, scrollY / h * 100) : 0) + '%';
  }

  /* --- кнопка наверх --- */
  const top = document.createElement('button'); top.className = 'to-top'; top.textContent = '↑';
  top.title = 'Наверх'; top.setAttribute('aria-label', 'Наверх');
  top.onclick = () => scrollTo({ top: 0, behavior: 'smooth' });
  document.body.appendChild(top);
  addEventListener('scroll', () => {
    top.classList.toggle('show', scrollY > 600);
    updBar();
  }, { passive: true });
  updBar();

  /* --- кнопка назад (если есть история внутри сайта) --- */
  const isArticle = !!document.querySelector('.post');
  function goBack(e) {
    e.preventDefault();
    if (history.length > 1 && document.referrer.includes(location.hostname)) history.back();
    else location.href = '../index.html#kb';
  }
  if (isArticle) {
    // плавающая слева (ПК)
    const back = document.createElement('a');
    back.className = 'back-btn back-float'; back.href = '#';
    back.innerHTML = '← Назад';
    back.onclick = goBack;
    document.querySelector('main').prepend(back);
  }
  // все кнопки «назад» (в т.ч. внизу статьи)
  document.querySelectorAll('[data-back]').forEach(el => el.addEventListener('click', goBack));

  /* --- логотип всегда ведёт на главную --- */
  document.querySelectorAll('.logo').forEach(a => a.addEventListener('click', () => { location.href = a.getAttribute('href'); }));

  /* --- поделиться (нативное меню) --- */
  const share = document.querySelector('.share-btn');
  if (share) share.onclick = async () => {
    const data = { title: document.title, url: location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(location.href); share.textContent = '✓ Ссылка скопирована'; setTimeout(() => share.innerHTML = share.dataset.label || '🔗 Поделиться', 2000); }
    } catch (e) {}
  };

  /* --- TOC для статей --- */
  const post = document.querySelector('.post');
  if (post && innerWidth >= 1200) {
    const hs = post.querySelectorAll('h2');
    if (hs.length >= 3) {
      hs.forEach((h2, i) => h2.id = h2.id || ('sec-' + i));
      const layout = document.createElement('div'); layout.className = 'post-layout wrap';
      const toc = document.createElement('nav'); toc.className = 'toc';
      toc.innerHTML = '<b>Содержание</b>' + [...hs].map(h2 =>
        '<a href="#' + h2.id + '">' + h2.textContent + '</a>').join('');
      post.parentNode.insertBefore(layout, post);
      layout.appendChild(post); layout.appendChild(toc);
      // подсветка активного раздела
      const links = [...toc.querySelectorAll('a')];
      const io = new IntersectionObserver(es => es.forEach(en => {
        if (en.isIntersecting) links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id));
      }), { rootMargin: '-80px 0px -60%' });
      hs.forEach(h2 => io.observe(h2));
    }
  }

  /* --- поиск по сайту (Ctrl+K или кнопка) --- */
  const INDEX = window.NEXUS_SEARCH_INDEX || [];
  const ov = document.createElement('div'); ov.className = 'search-overlay';
  ov.innerHTML = '<div class="search-panel"><input type="text" placeholder="Поиск по статьям…" aria-label="Поиск">' +
    '<div class="search-results"></div><div class="search-hint">Esc — закрыть · Ctrl+K — открыть</div></div>';
  document.body.appendChild(ov);
  const inp = ov.querySelector('input'), res = ov.querySelector('.search-results');
  function openSearch() { ov.classList.add('open'); inp.value = ''; renderResults(''); setTimeout(() => inp.focus(), 50); }
  function closeSearch() { ov.classList.remove('open'); }
  function renderResults(q) {
    q = q.trim().toLowerCase();
    const items = !q ? INDEX.slice(0, 6) : INDEX.filter(it =>
      (it.title + ' ' + it.agent + ' ' + (it.desc || '')).toLowerCase().includes(q));
    res.innerHTML = items.map(it =>
      '<a href="' + it.url + '"><span class="r-agent">' + it.agent + '</span><div class="r-title">' + it.title + '</div></a>'
    ).join('') || '<div class="search-hint">Ничего не найдено</div>';
  }
  inp.addEventListener('input', () => renderResults(inp.value));
  ov.addEventListener('click', e => { if (e.target === ov) closeSearch(); });
  addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); }
    if (e.key === 'Escape') closeSearch();
  });

  // триггер в шапку
  const nav = document.querySelector('.nav');
  if (nav) {
    const btn = document.createElement('button');
    btn.className = 'search-trigger'; btn.innerHTML = '🔍 Поиск <kbd>Ctrl K</kbd>';
    btn.onclick = openSearch;
    nav.insertBefore(btn, nav.querySelector('.subscribe-btn'));
  }
})();
