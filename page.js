(() => {
  if (globalThis.PagelioPage) return;
  let capture;
  function source() { return document.querySelector('article') || document.querySelector('main') || document.body; }
  function restore() {
    if (!capture) return;
    clearTimeout(capture.timer);
    capture.style.remove();
    for (const [element, value, priority] of capture.fixed) {
      if (value) element.style.setProperty('visibility', value, priority); else element.style.removeProperty('visibility');
    }
    window.scrollTo(capture.x, capture.y);
    capture = null;
  }
  globalThis.PagelioPage = {
    info() { return {title: document.title, url: location.href, selection: window.getSelection()?.toString() || ''}; },
    extract() {
      const root = source();
      const links = [...new Map([...root.querySelectorAll('a[href]')].filter(a => /^https?:/.test(a.href)).map(a => [a.href, {text: a.innerText.trim() || a.href, url: a.href}])).values()];
      return {title: document.title, url: location.href, text: root.innerText, selection: window.getSelection()?.toString() || '', links};
    },
    images() {
      const items = new Map();
      function add(url, width, height, alt = '') {
        if (!/^(https?:\/\/|data:image\/)/i.test(url)) return;
        const old = items.get(url);
        if (!old || width * height > old.width * old.height) items.set(url, {url, width: Math.round(width), height: Math.round(height), alt});
      }
      for (const image of document.images) add(image.currentSrc || image.src, image.naturalWidth || image.width, image.naturalHeight || image.height, image.alt);
      for (const element of [...document.querySelectorAll('*')].slice(0, 5000)) {
        const value = getComputedStyle(element).backgroundImage;
        for (const match of value.matchAll(/url\(["']?(.*?)["']?\)/g)) {
          const rect = element.getBoundingClientRect();
          add(match[1], rect.width, rect.height, element.getAttribute('aria-label') || 'Imagem de fundo');
        }
      }
      return {title: document.title, url: location.href, items: [...items.values()]};
    },
    print(clean) {
      if (!clean) { window.print(); return; }
      const reader = document.createElement('section');
      reader.id = `pagelio-reader-${Date.now()}`;
      const title = document.createElement('h1'); title.textContent = document.title; reader.append(title);
      const origin = document.createElement('p'); origin.textContent = `${location.href} • ${new Date().toLocaleDateString('pt-BR')}`; reader.append(origin);
      const root = source();
      const blocks = [...root.querySelectorAll('h1,h2,h3,h4,p,li,blockquote,pre')].filter(el => !el.closest('nav,header,footer,aside,form') && !el.parentElement?.closest('li,blockquote,pre'));
      for (const block of blocks) {
        if (!block.innerText.trim()) continue;
        const node = document.createElement(block.tagName === 'LI' ? 'p' : block.tagName);
        node.textContent = (block.tagName === 'LI' ? '• ' : '') + block.innerText; reader.append(node);
      }
      if (!blocks.length) { const p = document.createElement('p'); p.textContent = root.innerText; reader.append(p); }
      const style = document.createElement('style');
      style.textContent = `#${reader.id}{display:none}@media print{body>*:not(#${reader.id}){display:none!important}body{margin:0!important;background:white!important;color:#111!important}#${reader.id}{display:block!important;font:12pt/1.6 Georgia,serif!important;max-width:175mm;margin:auto}#${reader.id} h1{font-size:25pt}#${reader.id} p{white-space:pre-wrap}#${reader.id} pre{white-space:pre-wrap;overflow-wrap:anywhere}#${reader.id} h1,#${reader.id} h2,#${reader.id} h3{break-after:avoid}}`;
      document.head.append(style); document.body.append(reader);
      const cleanup = () => { style.remove(); reader.remove(); window.removeEventListener('afterprint', cleanup); };
      window.addEventListener('afterprint', cleanup, {once:true});
      setTimeout(cleanup, 300000);
      window.print();
    },
    prepareCapture() {
      restore();
      const style = document.createElement('style');
      style.textContent = 'html{scroll-behavior:auto!important;scroll-snap-type:none!important}*{animation-play-state:paused!important;transition:none!important;caret-color:transparent!important}';
      capture = {x: scrollX, y: scrollY, style, fixed: []};
      for (const el of document.querySelectorAll('*')) {
        if (['fixed', 'sticky'].includes(getComputedStyle(el).position)) capture.fixed.push([el, el.style.getPropertyValue('visibility'), el.style.getPropertyPriority('visibility')]);
      }
      document.head.append(style);
      capture.timer = setTimeout(restore, 120000);
      window.scrollTo(0, 0);
      return {width: innerWidth, height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight), viewport: innerHeight, dpr: devicePixelRatio};
    },
    scrollCapture(y, hideFixed) {
      if (!capture) throw new Error('A captura expirou. Tente novamente.');
      if (hideFixed) for (const [el] of capture.fixed) el.style.setProperty('visibility', 'hidden', 'important');
      window.scrollTo(0, y);
      return {x: scrollX, y: scrollY, width: innerWidth, viewport: innerHeight};
    },
    restoreCapture: restore
  };
})();
