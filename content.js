// Banich v5 - content script
// Restores Font and/or RTL on page load for saved sites

(function () {
  try {
    const origin = window.location.origin;
    chrome.storage.local.get(['banich_' + origin], (res) => {
      const settings = res['banich_' + origin];
      if (!settings) return;

      const fontActive = settings.font === true;
      const rtlActive  = settings.rtl === true;

      if (!fontActive && !rtlActive) return;

      // Apply font if enabled
      if (fontActive) {
        document.documentElement.setAttribute('data-banich-font', '1');
        const FONT_STYLE_ID = 'banich-font-style';
        if (!document.getElementById(FONT_STYLE_ID)) {
          const el = document.createElement('style');
          el.id = FONT_STYLE_ID;
          el.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;700;900&display=swap');

            /* فونت وزیرمتن فقط برای متن‌ها - نه آیکون‌ها */
            p, h1, h2, h3, h4, h5, h6, li, dt, dd, blockquote, td, th,
            label, legend, figcaption, cite, q, time,
            input, textarea, select, button,
            [class*="text"]:not([class*="icon"]):not([class*="fa-"]):not([class*="material"]),
            [class*="content"]:not(svg):not(canvas),
            [class*="title"], [class*="desc"], [class*="caption"],
            [class*="label"], [class*="body"], [class*="paragraph"] {
              font-family: 'Vazirmatn', Tahoma, 'B Nazanin', sans-serif !important;
            }
          `;
          const injectFont = () => document.head.appendChild(el);
          document.head ? injectFont() : document.addEventListener('DOMContentLoaded', injectFont);
        }
      }

      // Apply RTL if enabled
      if (rtlActive) {
        document.documentElement.setAttribute('data-banich-rtl', '1');
        const RTL_STYLE_ID = 'banich-rtl-style';
        if (!document.getElementById(RTL_STYLE_ID)) {
          const el = document.createElement('style');
          el.id = RTL_STYLE_ID;
          el.textContent = `
            /* راست‌چین هوشمند: فقط برای متون RTL (فارسی، عربی، کردی، اردو، ...) */
            /* از unicode-bidi: plaintext برای تشخیص خودکار زبان استفاده می‌کنیم */

            /* المان‌های متنی رایج - جهت خودکار بر اساس محتوای زبان */
            p, h1, h2, h3, h4, h5, h6, li, dt, dd, blockquote,
            td, th, label, legend, figcaption, cite, q, time,
            [class*="text"]:not([class*="icon"]):not([class*="fa-"]):not([class*="material"]):not(svg),
            [class*="content"]:not(svg):not(canvas),
            [class*="title"], [class*="desc"], [class*="caption"],
            [class*="label"], [class*="body"], [class*="paragraph"],
            [class*="article"], [class*="post"], [class*="comment"] {
              direction: rtl !important;
              text-align: right !important;
              unicode-bidi: plaintext !important;
            }

            /* فیلدهای ورودی - همیشه راست‌چین برای زبان‌های RTL */
            input[type="text"], input[type="search"],
            input[type="email"], input[type="password"],
            input[type="url"], input[type="tel"],
            textarea {
              direction: rtl !important;
              text-align: right !important;
              unicode-bidi: plaintext !important;
            }

            /* placeholder هم راست‌چین */
            input::placeholder, textarea::placeholder {
              direction: rtl !important;
              text-align: right !important;
            }

            /* جلوگیری از شکستن flex/grid لایه‌های چیدمان */
            /* فقط متن‌ها تحت تأثیر قرار می‌گیرند، نه containerها */
            [dir="rtl"] > *,
            [dir="auto"] > * {
              unicode-bidi: isolate;
            }
          `;
          const injectRTL = () => document.head.appendChild(el);
          document.head ? injectRTL() : document.addEventListener('DOMContentLoaded', injectRTL);
        }
      }
    });
  } catch (e) {}
})();
