/* Однострочные подписи: сокращаем только отображение и только между словами.
   Полный текст остаётся в DOM для чтения с экрана, наведения и фокуса карточки.
   Без JS подписи остаются полностью видимыми. */
(() => {
  'use strict';
  const captions = [...document.querySelectorAll('.card-caption')];
  if (!captions.length || !('ResizeObserver' in window)) return;

  const entries = captions.map(caption => {
    const full = document.createElement('span');
    full.className = 'card-caption-full';
    while (caption.firstChild) full.appendChild(caption.firstChild);
    const short = document.createElement('span');
    short.className = 'card-caption-short';
    short.setAttribute('aria-hidden', 'true');
    caption.append(full, short);
    caption.classList.add('is-enhanced');
    return { caption, full, short, text: full.textContent.trim() };
  });

  function fit({ caption, short, text }) {
    short.textContent = text;
    const width = caption.clientWidth;
    if (!width || short.scrollWidth <= width) return;
    const words = text.split(/\s+/u);
    let low = 0, high = words.length;
    while (low < high) {
      const count = Math.ceil((low + high) / 2);
      short.textContent = words.slice(0, count).join(' ') + '…';
      if (short.scrollWidth <= width) low = count;
      else high = count - 1;
    }
    short.textContent = words.slice(0, low).join(' ') + '…';
  }

  const byElement = new Map(entries.map(entry => [entry.caption, entry]));
  const observer = new ResizeObserver(changes => changes.forEach(change => fit(byElement.get(change.target))));
  entries.forEach(entry => { fit(entry); observer.observe(entry.caption); });
  document.fonts?.ready.then(() => entries.forEach(fit));
})();
