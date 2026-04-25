// ── Popup JS ────────────────────────────────────────────────────
const toggleArea  = document.getElementById('toggleArea');
const toggleLabel = document.getElementById('toggleLabel');
const toggleIcon  = document.getElementById('toggleIcon');
const dot         = document.getElementById('dot');
const statusText  = document.getElementById('statusText');
const adBanner    = document.getElementById('adBanner');
const adClose     = document.getElementById('adClose');
const rocketCanvas= document.getElementById('rocketCanvas');
const ctx         = rocketCanvas.getContext('2d');

let isActive = false;
let rocketFrame = 0;
let rocketAnim = null;
const FRAMES = 20;

// ── Rocket draw ─────────────────────────────────────────────────
function drawRocket(f, active) {
  const s = 44;
  const cx = s / 2;
  ctx.clearRect(0, 0, s, s);

  // BG
  const bg = ctx.createLinearGradient(0, 0, 0, s);
  bg.addColorStop(0, '#0d1120');
  bg.addColorStop(1, '#080c18');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(0, 0, s, s, 10);
  ctx.fill();

  // Stars
  const stars = [[0.2,0.12],[0.7,0.08],[0.88,0.22],[0.12,0.3],[0.92,0.4]];
  const pulse = Math.sin(f / FRAMES * Math.PI * 2);
  stars.forEach(([sx,sy]) => {
    ctx.fillStyle = `rgba(255,255,255,${0.3 + pulse*0.25})`;
    ctx.beginPath();
    ctx.arc(sx*s, sy*s, s*0.018, 0, Math.PI*2);
    ctx.fill();
  });

  // Smoke (only when active)
  if (active) {
    for (let i = 0; i < 4; i++) {
      const t = ((f / FRAMES) + i / 4) % 1;
      const alpha = 0.18 * (1 - t);
      const sy2 = s * (0.82 + t * 0.30);
      const sr = s * 0.035 * (1 + t * 2.5);
      const sx2 = cx + Math.sin(t * Math.PI * 4 + i * 1.5) * s * 0.07;
      const grad = ctx.createRadialGradient(sx2, sy2, 0, sx2, sy2, sr);
      grad.addColorStop(0, `rgba(180,185,210,${alpha})`);
      grad.addColorStop(1, 'rgba(120,130,160,0)');
      ctx.beginPath();
      ctx.arc(sx2, sy2, sr, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  // Flame offset - rocket shifts up slightly when active
  const liftY = active ? Math.sin(f / FRAMES * Math.PI * 2) * 1.5 - 2 : 0;

  ctx.save();
  ctx.translate(0, liftY);

  if (active) {
    const flicker = Math.sin(f / FRAMES * Math.PI * 4);
    const flameLen = 0.28 + flicker * 0.06;

    // Outer flame
    ctx.beginPath();
    ctx.moveTo(cx - s*0.075, s*0.72);
    ctx.lineTo(cx, s * (0.72 + flameLen));
    ctx.lineTo(cx + s*0.075, s*0.72);
    ctx.closePath();
    const fg1 = ctx.createLinearGradient(cx, s*0.72, cx, s*(0.72+flameLen));
    fg1.addColorStop(0, `rgba(255,${100+Math.floor(flicker*50)},20,1)`);
    fg1.addColorStop(1, 'rgba(255,50,0,0)');
    ctx.fillStyle = fg1;
    ctx.fill();

    // Mid flame
    ctx.beginPath();
    ctx.moveTo(cx - s*0.04, s*0.72);
    ctx.lineTo(cx, s*(0.72 + flameLen*0.72));
    ctx.lineTo(cx + s*0.04, s*0.72);
    ctx.closePath();
    ctx.fillStyle = `rgba(255,215,50,0.95)`;
    ctx.fill();

    // Core
    ctx.beginPath();
    ctx.moveTo(cx - s*0.015, s*0.72);
    ctx.lineTo(cx, s*(0.72 + flameLen*0.44));
    ctx.lineTo(cx + s*0.015, s*0.72);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,220,1)';
    ctx.fill();
  }

  // Fins
  ctx.beginPath();
  ctx.moveTo(cx - s*0.10, s*0.57);
  ctx.lineTo(cx - s*0.26, s*0.73);
  ctx.lineTo(cx - s*0.22, s*0.77);
  ctx.lineTo(cx - s*0.10, s*0.72);
  ctx.closePath();
  ctx.fillStyle = '#dc3030';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx + s*0.10, s*0.57);
  ctx.lineTo(cx + s*0.26, s*0.73);
  ctx.lineTo(cx + s*0.22, s*0.77);
  ctx.lineTo(cx + s*0.10, s*0.72);
  ctx.closePath();
  ctx.fillStyle = '#dc3030';
  ctx.fill();

  // Nozzle
  ctx.beginPath();
  ctx.moveTo(cx - s*0.065, s*0.72);
  ctx.lineTo(cx + s*0.065, s*0.72);
  ctx.lineTo(cx + s*0.05, s*0.78);
  ctx.lineTo(cx - s*0.05, s*0.78);
  ctx.closePath();
  ctx.fillStyle = '#555566';
  ctx.fill();

  // Body
  ctx.beginPath();
  ctx.moveTo(cx, s*0.10);
  ctx.lineTo(cx + s*0.145, s*0.47);
  ctx.lineTo(cx + s*0.10, s*0.72);
  ctx.lineTo(cx - s*0.10, s*0.72);
  ctx.lineTo(cx - s*0.145, s*0.47);
  ctx.closePath();
  const bodyG = ctx.createLinearGradient(cx - s*0.16, 0, cx + s*0.16, 0);
  bodyG.addColorStop(0, '#b8c2d8');
  bodyG.addColorStop(0.35, '#e8edf8');
  bodyG.addColorStop(1, '#c0c8da');
  ctx.fillStyle = bodyG;
  ctx.fill();

  // Nose shine
  ctx.beginPath();
  ctx.moveTo(cx, s*0.10);
  ctx.lineTo(cx + s*0.055, s*0.23);
  ctx.lineTo(cx, s*0.21);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fill();

  // Stripe red
  const stripeY = s*0.52;
  const hw1 = s*0.13;
  ctx.fillStyle = 'rgba(220,50,50,0.85)';
  ctx.beginPath();
  ctx.rect(cx - hw1, stripeY, hw1*2, s*0.025);
  ctx.fill();

  // Stripe blue
  ctx.fillStyle = 'rgba(60,80,220,0.75)';
  ctx.beginPath();
  ctx.rect(cx - hw1, stripeY + s*0.03, hw1*2, s*0.022);
  ctx.fill();

  // Window ring gold
  const wr = s*0.095; const wy = s*0.37;
  ctx.beginPath();
  ctx.arc(cx, wy, wr + s*0.025, 0, Math.PI*2);
  ctx.fillStyle = '#D4AF37';
  ctx.fill();

  // Window glass
  const wG = ctx.createRadialGradient(cx - wr*0.35, wy - wr*0.35, 0, cx, wy, wr);
  wG.addColorStop(0, '#c0f0ff');
  wG.addColorStop(0.6, '#2090d0');
  wG.addColorStop(1, '#0050a0');
  ctx.beginPath();
  ctx.arc(cx, wy, wr, 0, Math.PI*2);
  ctx.fillStyle = wG;
  ctx.fill();

  // Window glare
  ctx.beginPath();
  ctx.ellipse(cx - wr*0.3, wy - wr*0.3, wr*0.35, wr*0.22, -0.5, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fill();

  ctx.restore();
}

// ── Start/stop rocket animation ──────────────────────────────────
function startRocketAnim() {
  if (rocketAnim) return;
  rocketAnim = setInterval(() => {
    rocketFrame = (rocketFrame + 1) % FRAMES;
    drawRocket(rocketFrame, true);
  }, 60);
}

function stopRocketAnim() {
  if (rocketAnim) { clearInterval(rocketAnim); rocketAnim = null; }
  drawRocket(0, false);
}

// ── Update UI ────────────────────────────────────────────────────
function updateUI(active) {
  isActive = active;
  if (active) {
    toggleArea.classList.add('active');
    toggleLabel.textContent = 'غیرفعال‌سازی فارسی‌ساز';
    dot.classList.add('on');
    statusText.classList.add('on');
    statusText.textContent = 'فعال';
    startRocketAnim();
  } else {
    toggleArea.classList.remove('active');
    toggleLabel.textContent = 'فعال‌سازی فارسی‌ساز';
    dot.classList.remove('on');
    statusText.classList.remove('on');
    statusText.textContent = 'غیرفعال';
    stopRocketAnim();
  }
}

// ── Get tab ──────────────────────────────────────────────────────
async function getTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// ── Check state ──────────────────────────────────────────────────
async function checkState() {
  try {
    const tab = await getTab();
    const res = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.documentElement.getAttribute('data-banich') === '1'
    });
    updateUI(res[0]?.result || false);
  } catch { updateUI(false); }
}

// ── Toggle ───────────────────────────────────────────────────────
toggleArea.addEventListener('click', async () => {
  try {
    const tab = await getTab();
    const res = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const active = document.documentElement.getAttribute('data-banich') === '1';
        const nowActive = !active;
        const STYLE_ID = 'banich-rtl-style';
        let el = document.getElementById(STYLE_ID);

        if (nowActive) {
          document.documentElement.setAttribute('data-banich', '1');
          if (!el) { el = document.createElement('style'); el.id = STYLE_ID; document.head.appendChild(el); }
          el.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;700;900&display=swap');

            /* فونت وزیرمتن فقط برای متن‌ها */
            p, h1, h2, h3, h4, h5, h6, li, dt, dd, blockquote, td, th,
            label, legend, figcaption, cite, q, time,
            input, textarea, select, button,
            .text, [class*="text-"], [class*="-text"],
            [class*="content"], [class*="title"], [class*="desc"],
            [class*="caption"], [class*="label"], [class*="body"] {
              font-family: 'Vazirmatn', Tahoma, 'B Nazanin', sans-serif !important;
            }

            /* جهت RTL فقط برای متن - نه آیکون‌ها یا SVG */
            p, h1, h2, h3, h4, h5, h6, li, dt, dd, blockquote,
            td, th, label, legend, figcaption,
            [class*="content"]:not(svg):not(canvas),
            [class*="text"]:not(svg):not([class*="icon"]):not([class*="fa-"]) {
              direction: rtl !important;
              text-align: right !important;
              unicode-bidi: plaintext;
            }

            /* فیلدهای ورودی */
            input[type="text"], input[type="search"],
            input[type="email"], input[type="password"],
            input[type="url"], input[type="tel"],
            textarea {
              direction: rtl !important;
              text-align: right !important;
            }
          `;
        } else {
          document.documentElement.removeAttribute('data-banich');
          if (el) el.remove();
        }
        return nowActive;
      }
    });

    const nowActive = res[0]?.result;
    updateUI(nowActive);

    // Save state
    const url = new URL(tab.url);
    chrome.storage.local.set({ ['banich_' + url.origin]: nowActive });

    // Notify background for toolbar animation
    chrome.runtime.sendMessage({
      type: nowActive ? 'BANICH_ON' : 'BANICH_OFF',
      tabId: tab.id
    });

  } catch(e) { console.error('Banich toggle error:', e); }
});

// ── AD: show only first time ──────────────────────────────────────
chrome.storage.local.get(['banich_ad_seen'], (res) => {
  if (!res.banich_ad_seen) {
    adBanner.classList.add('show');
    chrome.storage.local.set({ banich_ad_seen: true });
  }
});
adClose.addEventListener('click', () => adBanner.classList.remove('show'));

// ── Init ──────────────────────────────────────────────────────────
drawRocket(0, false); // draw static rocket on load
checkState();
