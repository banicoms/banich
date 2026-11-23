// Banich 6.0: paragraph-level Arabic-script detection. No text wrappers, no layout changes.
(function () {
  try {
    if (globalThis.banichContentReady) return;
    globalThis.banichContentReady = true;
    let key = 'banich_' + location.origin;
    let revision = 0, settings = { font: false, rtl: false }, timer = null, legacyCleaned = false;
    const arabic = /\p{Script_Extensions=Arabic}/u;
    const letter = /\p{Letter}/u;
    const excluded = 'script,style,noscript,svg,canvas,pre,code,kbd,samp,select,option,textarea,input,[contenteditable]:not([contenteditable="false"]),[class*="icon" i],[class*="fa-"],.fa,.fas,.far,.fab,[class*="material-"],[class*="material_"]';
    const blocks = 'p,h1,h2,h3,h4,h5,h6,li,dt,dd,blockquote,td,th,figcaption,legend,caption,summary,label';
    const layout = 'div,section,article,ul,ol,table,form,button,input,textarea,select,header,footer,nav,main,aside,dialog,[role="dialog"],[role="menu"],[role="toolbar"]';
    const candidates = blocks + ',div,span,a';
    const style = document.createElement('style');
    style.id = 'banich-text-style';
    style.textContent = `
      @font-face {
        font-family: 'BanichArabic';
        src: url('${chrome.runtime.getURL('fonts/Vazirmatn.woff2')}') format('woff2');
        font-weight: 100 900;
        font-style: normal;
        font-display: swap;
        unicode-range: U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF;
      }
      [data-banich-rtl] {
        direction: rtl !important;
        text-align: right !important;
        unicode-bidi: plaintext !important;
      }
      li[data-banich-list-ltr] { direction: ltr !important; text-align: left !important; }
      [data-banich-font-src] {
        font-family: 'BanichArabic', 'Vazirmatn', Tahoma, 'B Nazanin', sans-serif !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);

    // First strong letter decides paragraph language (cap scan so huge blocks stay cheap).
    function firstStrong(text) {
      let n = 0;
      for (const c of text) {
        if (letter.test(c)) return c;
        if (++n > 1000) break;
      }
      return '';
    }
    function hasArabic(text) {
      let n = 0;
      for (const c of text) {
        if (arabic.test(c)) return true;
        if (++n > 20000) break;
      }
      return false;
    }
    function observe() {
      observer.observe(document.documentElement, {
        subtree: true, childList: true, characterData: true,
        attributes: true, attributeFilter: ['value', 'placeholder', 'class', 'contenteditable']
      });
    }
    function cleanLegacy() {
      if (legacyCleaned) return;
      legacyCleaned = true;
      for (const el of document.querySelectorAll('[data-banich-text]')) el.replaceWith(...el.childNodes);
      document.getElementById('banich-font-style')?.remove();
      document.getElementById('banich-rtl-style')?.remove();
      document.documentElement.removeAttribute('data-banich-font');
      document.documentElement.removeAttribute('data-banich-rtl');
    }
    function restore() {
      for (const el of document.querySelectorAll('[data-banich-list-ltr]')) el.removeAttribute('data-banich-list-ltr');
      for (const el of document.querySelectorAll('[data-banich-rtl]')) el.removeAttribute('data-banich-rtl');
      for (const el of document.querySelectorAll('[data-banich-font-src]')) el.removeAttribute('data-banich-font-src');
      for (const el of document.querySelectorAll('[data-banich-paragraph]')) el.removeAttribute('data-banich-paragraph');
    }
    function refresh() {
      timer = null;
      observer.disconnect();
      try {
        cleanLegacy();
        restore();
        if (!settings.font && !settings.rtl) return;
        for (const el of document.querySelectorAll(candidates)) {
          if (el.closest(excluded)) continue;
          if (el.parentElement?.closest('[data-banich-paragraph]')) continue;
          const generic = !el.matches(blocks);
          if (el.querySelector(blocks + (generic ? ',' + layout : ''))) continue; // containers keep their layout
          const text = el.textContent || '';
          if (!hasArabic(text)) continue;
          const css = getComputedStyle(el);
          if (css.display.includes('flex') || css.display.includes('grid')) continue;
          el.setAttribute('data-banich-paragraph', '1');
          if (settings.font && arabic.test(firstStrong(text))) el.setAttribute('data-banich-font-src', '1');
          if (settings.rtl && arabic.test(firstStrong(text))) el.setAttribute('data-banich-rtl', '1');
        }
        // A paragraph inside <li> controls its text, but the marker belongs to <li>.
        // Inspect each item's own text, excluding nested lists, so mixed lists keep per-item direction.
        if (settings.rtl) {
          for (const item of document.querySelectorAll('li')) {
            if (item.closest(excluded) || getComputedStyle(item).display !== 'list-item') continue;
            const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT, {
              acceptNode(node) {
                return node.parentElement.closest('li') === item && !node.parentElement.closest(excluded)
                  ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
              }
            });
            let first = '';
            while (!first && walker.nextNode()) first = firstStrong(walker.currentNode.data);
            if (arabic.test(first)) item.setAttribute('data-banich-rtl', '1');
            else if (first && item.parentElement.closest('li[data-banich-rtl]')) item.setAttribute('data-banich-list-ltr', '1');
          }
        }
        for (const el of document.querySelectorAll('textarea,input:not([type]),input[type="text"],input[type="search"]')) {
          if (el.closest('[class*="icon" i],[class*="fa-"]')) continue;
          const text = el.value || el.placeholder || '';
          if (!hasArabic(text)) continue;
          if (settings.font && arabic.test(firstStrong(text))) el.setAttribute('data-banich-font-src', '1');
          if (settings.rtl && arabic.test(firstStrong(text))) el.setAttribute('data-banich-rtl', '1');
        }
      } finally { observe(); }
    }
    function schedule() {
      if (timer !== null) return;
      // Full-page scan runs after a 200ms quiet period.
      timer = setTimeout(refresh, 200);
    }
    const observer = new MutationObserver(schedule);
    document.addEventListener('input', schedule, true);
    observe();
    function applySettings(value) {
      settings = { font: value?.font === true, rtl: value?.rtl === true };
      refresh();
    }
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type !== 'BANICH_APPLY') return;
      key = 'banich_' + message.origin;
      revision++;
      applySettings(message.settings);
      sendResponse({ ok: true });
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || !Object.prototype.hasOwnProperty.call(changes, key)) return;
      revision++;
      applySettings(changes[key].newValue);
    });
    chrome.runtime.sendMessage({ type: 'BANICH_ORIGIN' }, response => {
      const error = chrome.runtime.lastError;
      if (revision) return;
      if (!error && response?.origin) key = 'banich_' + response.origin;
      chrome.storage.local.get([key], result => {
        if (chrome.runtime.lastError || revision) return;
        applySettings(result[key]);
      });
    });
  } catch (error) { console.error('Banich content:', error); }
})();
