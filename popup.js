// ── Popup JS ────────────────────────────────────────────────────
const fontRow = document.getElementById('fontRow');
const fontSwitch = document.getElementById('fontSwitch');
const fontDot = document.getElementById('fontDot');
const fontMain = document.getElementById('fontMain');

const rtlRow = document.getElementById('rtlRow');
const rtlSwitch = document.getElementById('rtlSwitch');
const rtlDot = document.getElementById('rtlDot');
const rtlMain = document.getElementById('rtlMain');

const themeBtn = document.getElementById('themeBtn');
const versionBadge = document.getElementById('versionBadge');

const rocketCanvas = document.getElementById('rocketCanvas');
const ctx = rocketCanvas.getContext('2d');

let fActive = false, rActive = false;
let frame = 0, anim = null;
const FRAMES = 30, S = 52;

// ── Version ────────────────────────────────────────────────────
const VERSION = '5.6';
versionBadge.textContent = 'v' + VERSION;

// ── Theme system ───────────────────────────────────────────────
const THEMES = [
  { id: 'neo',    name: 'Neomorphism' },
  { id: 'glass',  name: 'Glass Morphism' },
  { id: 'clay',   name: 'Claymorphism' },
  { id: 'liquid', name: 'Liquid Glass' }
];
let curTheme = 'neo';

function applyTheme(id) {
  const t = THEMES.find(x => x.id === id) || THEMES[0];
  curTheme = t.id;
  document.documentElement.dataset.theme = t.id === 'neo' ? '' : t.id;
  drawLogo(frame, fActive || rActive);
}
function saveTheme(id) { try { chrome.storage.local.set({ banich_theme: id }); } catch {} }
function loadTheme() {
  try { chrome.storage.local.get(['banich_theme'], r => applyTheme(r.banich_theme || 'neo')); }
  catch { applyTheme('neo'); }
}
function nextTheme() {
  const i = THEMES.findIndex(x => x.id === curTheme);
  const next = THEMES[(i + 1) % THEMES.length].id;
  applyTheme(next);
  saveTheme(next);
}

// ── Helpers ────────────────────────────────────────────────────
function setRowOn(row, on) { row.classList.toggle('active', on); }
function setSwitch(sw, on) { sw.checked = on; }
function setDot(dot, on) { dot.classList.toggle('on', on); }
function setMain(el, on, label) {
  if (on) { el.textContent = label + ': فعال'; el.classList.add('on'); }
  else { el.textContent = label + ': غیرفعال'; el.classList.remove('on'); }
}

// ── Logo: works on ALL themes (light & dark) ──────────────────
function drawLogo(f, active) {
  const cx = S / 2;
  ctx.clearRect(0, 0, S, S);

  // Detect effective theme for proper contrast
  const theme = document.documentElement.dataset.theme;
  const isDark = theme === 'glass' || (theme === '' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Colors that work on both light/dark
  const C = {
    bg: isDark ? '#0f172a' : '#e5ebf1',
    card: isDark ? '#1e293b' : '#e5ebf1',
    accent: '#6b79e4', accentH: '#5a67d8', accentL: '#8b9cff',
    ok: '#10b981', okH: '#059669',
    fin: '#dc3030', nozzle: '#555566',
    gold: '#D4AF37', glass1: '#c0f0ff', glass2: '#2090d0', glass3: '#0050a0',
    shD: isDark ? '#0a0f1a' : '#c6ced7',
    shL: isDark ? '#161f33' : '#ffffff',
    body1: '#c8d0e0', body2: '#e8edf5', body3: '#f0f3f8',
  };

  // Background
  ctx.fillStyle = C.bg;
  ctx.beginPath(); ctx.roundRect(0, 0, S, S, 14); ctx.fill();

  // Inner concave shadow
  ctx.save();
  ctx.beginPath(); ctx.roundRect(2, 2, S - 4, S - 4, 12); ctx.clip();
  const g = ctx.createLinearGradient(0, 0, 0, S);
  g.addColorStop(0, C.shL + '60'); g.addColorStop(1, C.shD + '60');
  ctx.fillStyle = g; ctx.fillRect(2, 2, S - 4, S - 4);
  ctx.restore();

  if (!active) { drawStatic(cx, C); return; }

  // Stars
  const stars = [[0.18,0.15],[0.72,0.08],[0.85,0.25],[0.12,0.32],[0.9,0.4]];
  const pulse = Math.sin(f / FRAMES * Math.PI * 2);
  stars.forEach(([sx,sy]) => {
    ctx.fillStyle = `rgba(255,255,255,${0.4 + pulse*0.3})`;
    ctx.beginPath(); ctx.arc(sx*S, sy*S, S*0.02, 0, Math.PI*2); ctx.fill();
  });

  // Smoke
  for (let i = 0; i < 3; i++) {
    const t = ((f / FRAMES) + i / 3) % 1;
    const a = 0.12 * (1 - t);
    const sy = S * (0.72 + t * 0.25);
    const sr = S * 0.03 * (1 + t * 2);
    const sx = cx + Math.sin(t * Math.PI * 4 + i * 1.5) * S * 0.05;
    const gr = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    gr.addColorStop(0, `rgba(180,185,210,${a})`); gr.addColorStop(1, 'rgba(120,130,160,0)');
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI*2); ctx.fillStyle = gr; ctx.fill();
  }

  const lift = Math.sin(f / FRAMES * Math.PI * 2) * 1.5 - 2;
  ctx.save(); ctx.translate(0, lift);

  const flicker = Math.sin(f / FRAMES * Math.PI * 4);
  const flen = 0.28 + flicker * 0.06;

  // Flame layers
  drawFlame(cx, S, flen, flicker, 0.07, C);
  drawFlame(cx, S, flen * 0.7, flicker, 0.035, {flame1: C.ok, flame2: '#fffcdc', flame3: '#fffcdc'});
  drawFlame(cx, S, flen * 0.4, flicker, 0.012, {flame1: '#fffcdc', flame2: '#fffcdc', flame3: '#fffcdc'});

  // Fins
  ctx.fillStyle = C.fin;
  drawFin(ctx, cx, S, S*0.54, S*0.68, S*0.22, -1);
  drawFin(ctx, cx, S, S*0.54, S*0.68, S*0.22, 1);

  // Nozzle
  ctx.fillStyle = C.nozzle;
  ctx.beginPath();
  ctx.moveTo(cx - S*0.06, S*0.7);
  ctx.lineTo(cx + S*0.06, S*0.7);
  ctx.lineTo(cx + S*0.05, S*0.75);
  ctx.lineTo(cx - S*0.05, S*0.75);
  ctx.closePath(); ctx.fill();

  // Body
  ctx.beginPath();
  ctx.moveTo(cx, S*0.1);
  ctx.lineTo(cx + S*0.13, S*0.45);
  ctx.lineTo(cx + S*0.09, S*0.7);
  ctx.lineTo(cx - S*0.09, S*0.7);
  ctx.lineTo(cx - S*0.13, S*0.45);
  ctx.closePath();
  const bg = ctx.createLinearGradient(cx - S*0.15, 0, cx + S*0.15, 0);
  bg.addColorStop(0, C.body1); bg.addColorStop(0.3, C.body2);
  bg.addColorStop(0.7, C.body3); bg.addColorStop(1, C.body1);
  ctx.fillStyle = bg; ctx.fill();

  // Nose highlight
  ctx.beginPath();
  ctx.moveTo(cx, S*0.1);
  ctx.lineTo(cx + S*0.05, S*0.22);
  ctx.lineTo(cx, S*0.2);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();

  // Stripes
  const hy = S*0.48, hw = S*0.11;
  ctx.fillStyle = 'rgba(220,50,50,0.85)';
  ctx.beginPath(); ctx.roundRect(cx - hw, hy, hw*2, S*0.02, 1); ctx.fill();
  ctx.fillStyle = 'rgba(107,121,228,0.8)';
  ctx.beginPath(); ctx.roundRect(cx - hw, hy + S*0.025, hw*2, S*0.018, 1); ctx.fill();

  // Window
  const wr = S*0.09, wy = S*0.34;
  ctx.beginPath(); ctx.arc(cx, wy, wr + S*0.02, 0, Math.PI*2);
  ctx.fillStyle = '#D4AF37'; ctx.fill();
  const wg = ctx.createRadialGradient(cx - wr*0.3, wy - wr*0.3, 0, cx, wy, wr);
  wg.addColorStop(0, '#c0f0ff'); wg.addColorStop(0.6, '#2090d0'); wg.addColorStop(1, '#0050a0');
  ctx.beginPath(); ctx.arc(cx, wy, wr, 0, Math.PI*2); ctx.fillStyle = wg; ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx - wr*0.3, wy - wr*0.3, wr*0.33, wr*0.2, -0.5, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fill();

  ctx.restore();
}

function drawFlame(cx, S, len, flicker, w, C) {
  const by = S * 0.7;
  ctx.beginPath();
  ctx.moveTo(cx - S*w, by);
  ctx.lineTo(cx, by + S*len);
  ctx.lineTo(cx + S*w, by);
  ctx.closePath();
  const gr = ctx.createLinearGradient(cx, by, cx, by + S*len);
  gr.addColorStop(0, `rgba(255,${100+Math.floor(flicker*50)},20,0.95)`);
  gr.addColorStop(1, 'rgba(255,50,0,0)');
  ctx.fillStyle = gr; ctx.fill();
}

function drawFin(ctx, cx, S, y1, y2, tx, dir) {
  ctx.beginPath();
  ctx.moveTo(cx + dir * S*0.09, y1);
  ctx.lineTo(cx + dir * tx, y2);
  ctx.lineTo(cx + dir * tx*0.8, S*0.72);
  ctx.lineTo(cx + dir * S*0.09, S*0.69);
  ctx.closePath(); ctx.fill();
}

function drawStatic(cx, C) {
  ctx.save();

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.beginPath(); ctx.ellipse(cx, 45, 12, 3.2, 0, 0, Math.PI*2); ctx.fill();

  // Fins
  ctx.fillStyle = C.fin;
  ctx.beginPath(); ctx.moveTo(cx-6.5, 25); ctx.lineTo(cx-14, 37); ctx.lineTo(cx-10, 40); ctx.lineTo(cx-4, 29); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx+6.5, 25); ctx.lineTo(cx+14, 37); ctx.lineTo(cx+10, 40); ctx.lineTo(cx+4, 29); ctx.closePath(); ctx.fill();

  // Body - accent gradient so it reads on light AND dark themes
  const bg = ctx.createLinearGradient(cx-9, 0, cx+9, 0);
  bg.addColorStop(0, C.accentH); bg.addColorStop(0.45, C.accentL); bg.addColorStop(1, C.accentH);
  ctx.beginPath();
  ctx.moveTo(cx, 7);
  ctx.lineTo(cx+8.5, 22);
  ctx.lineTo(cx+6.5, 34);
  ctx.lineTo(cx-6.5, 34);
  ctx.lineTo(cx-8.5, 22);
  ctx.closePath();
  ctx.fillStyle = bg; ctx.fill();

  // Stripes
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath(); ctx.roundRect(cx-6.5, 25.5, 13, 2.2, 1); ctx.fill();
  ctx.fillStyle = 'rgba(220,48,48,0.9)';
  ctx.beginPath(); ctx.roundRect(cx-6.5, 28.2, 13, 2, 1); ctx.fill();

  // Window
  ctx.beginPath(); ctx.arc(cx, 18.5, 6, 0, Math.PI*2); ctx.fillStyle = C.gold; ctx.fill();
  const wg = ctx.createRadialGradient(cx-2, 16.5, 0, cx, 18.5, 5);
  wg.addColorStop(0, C.glass1); wg.addColorStop(0.6, C.glass2); wg.addColorStop(1, C.glass3);
  ctx.beginPath(); ctx.arc(cx, 18.5, 4.7, 0, Math.PI*2); ctx.fillStyle = wg; ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx-1.8, 16.8, 1.7, 1, -0.5, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();

  ctx.restore();
}

// ── Animation: smoke + flames, eases up to speed on activation ─
let speed = 1;
function targetSpeed() { return (fActive && rActive) ? 3.2 : 2.2; }
function tick() {
  speed += (targetSpeed() - speed) * 0.07;
  frame = (frame + speed) % FRAMES;
  drawLogo(frame, true);
}
function startAnim() { if (anim) return; speed = 1; anim = setInterval(tick, 50); }
function stopAnim() { if (anim) { clearInterval(anim); anim = null; } speed = 1; frame = 0; drawLogo(0, false); }
function updAnim() { (fActive || rActive) ? startAnim() : stopAnim(); }

// ── UI Updates ─────────────────────────────────────────────────
function updF(on) {
  fActive = on;
  fontRow.classList.toggle('active', on);
  fontSwitch.checked = on;
  fontDot.classList.toggle('on', on);
  if (on) { fontMain.textContent = 'فونت وزیرمتن: فعال'; fontMain.classList.add('on'); }
  else { fontMain.textContent = 'فونت وزیرمتن: غیرفعال'; fontMain.classList.remove('on'); }
}
function updR(on) {
  rActive = on;
  rtlRow.classList.toggle('active', on);
  rtlSwitch.checked = on;
  rtlDot.classList.toggle('on', on);
  if (on) { rtlMain.textContent = 'راست‌چین هوشمند: فعال'; rtlMain.classList.add('on'); }
  else { rtlMain.textContent = 'راست‌چین هوشمند: غیرفعال'; rtlMain.classList.remove('on'); }
}

// ── Tab & State ────────────────────────────────────────────────
async function getTab() { const [t] = await chrome.tabs.query({ active: true, currentWindow: true }); return t; }
async function check() {
  try {
    const t = await getTab();
    const r = await chrome.scripting.executeScript({ target: { tabId: t.id }, func: () => ({ font: document.documentElement.getAttribute('data-banich-font')==='1', rtl: document.documentElement.getAttribute('data-banich-rtl')==='1' }) });
    const o = r[0]?.result || { font:false, rtl:false };
    updF(o.font); updR(o.rtl); updAnim();
  } catch { updF(false); updR(false); updAnim(); }
}

// ── Toggle Handler ─────────────────────────────────────────────
function handler(type) { return async () => {
  try {
    const t = await getTab();
    const isF = type==='font', cur = isF ? fActive : rActive;
    const r = await chrome.scripting.executeScript({
      target: { tabId: t.id },
      func: (on, tp) => {
        const id = tp==='font' ? 'banich-font-style' : 'banich-rtl-style';
        const attr = tp==='font' ? 'data-banich-font' : 'data-banich-rtl';
        let el = document.getElementById(id);
        if (on) {
          document.documentElement.setAttribute(attr, '1');
          if (!el) { el = document.createElement('style'); el.id = id; document.head.appendChild(el); }
          el.textContent = tp==='font' ? `
            @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;700;900&display=swap');
            p,h1,h2,h3,h4,h5,h6,li,dt,dd,blockquote,td,th,label,legend,figcaption,cite,q,time,input,textarea,select,button,[class*="text"]:not([class*="icon"]):not([class*="fa-"]):not([class*="material"]),[class*="content"]:not(svg):not(canvas),[class*="title"],[class*="desc"],[class*="caption"],[class*="label"],[class*="body"],[class*="paragraph"]{font-family:'Vazirmatn',Tahoma,'B Nazanin',sans-serif!important}
          ` : `
            p,h1,h2,h3,h4,h5,h6,li,dt,dd,blockquote,td,th,label,legend,figcaption,cite,q,time,[class*="text"]:not([class*="icon"]):not([class*="fa-"]):not([class*="material"]):not(svg),[class*="content"]:not(svg):not(canvas),[class*="title"],[class*="desc"],[class*="caption"],[class*="label"],[class*="body"],[class*="paragraph"],[class*="article"],[class*="post"],[class*="comment"]{unicode-bidi:plaintext!important}
            input[type="text"],input[type="search"],input[type="email"],input[type="password"],input[type="url"],input[type="tel"],textarea{unicode-bidi:plaintext!important}
            input::placeholder,textarea::placeholder{unicode-bidi:plaintext!important}
            [dir="rtl"] > *,[dir="auto"] > *{unicode-bidi:isolate}
          `;
        } else { document.documentElement.removeAttribute(attr); if (el) el.remove(); }
        return on;
      },
      args: [!cur, type]
    });
    const on = r[0]?.result;
    isF ? updF(on) : updR(on);
    updAnim();

    const u = new URL(t.url), k = 'banich_' + u.origin;
    try {
      chrome.storage.local.get([k], s => { const o = s[k] || {font:false, rtl:false}; o[type] = on; chrome.storage.local.set({[k]:o}); });
    } catch {}
    chrome.runtime.sendMessage({ type:'BANICH_UPDATE', fontActive: isF ? on : fActive, rtlActive: isF ? rActive : on, tabId: t.id });
  } catch(e) { console.error('Banich toggle:', e); }
}; }

// ── Events ─────────────────────────────────────────────────────
fontRow.addEventListener('click', handler('font'));
rtlRow.addEventListener('click', handler('rtl'));
fontSwitch.addEventListener('click', e => e.stopPropagation());
rtlSwitch.addEventListener('click', e => e.stopPropagation());
themeBtn.addEventListener('click', nextTheme);

// ── Init ───────────────────────────────────────────────────────
drawLogo(0, false);
loadTheme();
check();