// Banich v2 - content script
// Restores RTL+Vazirmatn on page load for saved sites

(function () {
  try {
    const origin = window.location.origin;
    chrome.storage.local.get(['banich_' + origin], (res) => {
      if (res['banich_' + origin] !== true) return;

      document.documentElement.setAttribute('data-banich', '1');
      const STYLE_ID = 'banich-rtl-style';
      if (document.getElementById(STYLE_ID)) return;

      const el = document.createElement('style');
      el.id = STYLE_ID;
      el.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;700;900&display=swap');

        p, h1, h2, h3, h4, h5, h6, li, dt, dd, blockquote, td, th,
        label, legend, figcaption, cite, q, time,
        input, textarea, select, button,
        .text, [class*="text-"], [class*="-text"],
        [class*="content"], [class*="title"], [class*="desc"],
        [class*="caption"], [class*="label"], [class*="body"] {
          font-family: 'Vazirmatn', Tahoma, 'B Nazanin', sans-serif !important;
        }

        p, h1, h2, h3, h4, h5, h6, li, dt, dd, blockquote,
        td, th, label, legend, figcaption,
        [class*="content"]:not(svg):not(canvas),
        [class*="text"]:not(svg):not([class*="icon"]):not([class*="fa-"]) {
          direction: rtl !important;
          text-align: right !important;
          unicode-bidi: plaintext;
        }

        input[type="text"], input[type="search"],
        input[type="email"], input[type="password"],
        input[type="url"], input[type="tel"],
        textarea {
          direction: rtl !important;
          text-align: right !important;
        }
      `;

      const inject = () => document.head.appendChild(el);
      document.head ? inject() : document.addEventListener('DOMContentLoaded', inject);
    });
  } catch (e) {}
})();
