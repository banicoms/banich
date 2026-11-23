// Banich v5 - Firefox background script (MV2, background page)
const firefoxApi = typeof browser !== 'undefined' ? browser : chrome;
let animInterval = null;
let frame = 0;
const FRAMES = 20;
const ICON_SIZES = [16, 32, 48, 128];

const COLORS = {
  base: '#e0e5ec',
  accentDark: '#4a5ab8',
  accent: '#6c7ae0',
  flame1: '#ff6b2e',
  flame2: '#ffd732',
  flame3: '#fffcdc',
  body1: '#c8d0e0',
  body2: '#e8edf5',
  body3: '#f0f3f8',
  fin: '#dc3030',
  nozzle: '#555566',
  gold: '#D4AF37',
  glass1: '#c0f0ff',
  glass2: '#2090d0',
  glass3: '#0050a0',
  shadowDark: '#a3b1c6',
  shadowLight: '#ffffff'
};

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function drawFlame(ctx, s, cx, len, flicker, width, c1, c2, op) {
  const baseY = s * 0.68;
  ctx.beginPath();
  ctx.moveTo(cx - s * width, baseY);
  ctx.lineTo(cx, baseY + s * len);
  ctx.lineTo(cx + s * width, baseY);
  ctx.closePath();
  const grad = ctx.createLinearGradient(cx, baseY, cx, baseY + s * len);
  grad.addColorStop(0, hexToRgba(c1, op));
  grad.addColorStop(1, hexToRgba(c2, 0));
  ctx.fillStyle = grad;
  ctx.fill();
}

function drawStaticLogo(ctx, s, cx) {
  const c = COLORS;
  ctx.save();
  const scale = s / 52;
  ctx.translate(cx, s * 0.52);
  ctx.scale(scale, scale);

  ctx.fillStyle = c.accentDark;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(7, -4);
  ctx.lineTo(7, 12);
  ctx.lineTo(3, 16);
  ctx.lineTo(-3, 16);
  ctx.lineTo(-7, 12);
  ctx.lineTo(-7, -4);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, -6, 5, 0, Math.PI * 2);
  ctx.fillStyle = c.gold;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -6, 4, 0, Math.PI * 2);
  const wGrad = ctx.createRadialGradient(-1.5, -7.5, 0, 0, -6, 4);
  wGrad.addColorStop(0, c.glass1);
  wGrad.addColorStop(1, c.glass3);
  ctx.fillStyle = wGrad;
  ctx.fill();

  ctx.restore();
}

// Firefox background page has DOM, use regular canvas
function makeCanvas(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function drawNeoIcon(ctx, s, f, active) {
  const c = COLORS;
  const cx = s / 2;
  const radius = Math.max(3, s * 0.18);

  ctx.clearRect(0, 0, s, s);

  ctx.fillStyle = c.base;
  ctx.beginPath();
  ctx.roundRect(0, 0, s, s, radius);
  ctx.fill();

  const inset = Math.max(1, s * 0.06);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(inset, inset, s - inset * 2, s - inset * 2, radius - inset);
  ctx.clip();
  const innerGrad = ctx.createLinearGradient(0, 0, 0, s);
  innerGrad.addColorStop(0, hexToRgba(c.shadowLight, 0.4));
  innerGrad.addColorStop(1, hexToRgba(c.shadowDark, 0.4));
  ctx.fillStyle = innerGrad;
  ctx.fillRect(inset, inset, s - inset * 2, s - inset * 2);
  ctx.restore();

  if (!active) {
    drawStaticLogo(ctx, s, cx);
    return;
  }

  const flicker = Math.sin(f / FRAMES * Math.PI * 4);
  const flameLen = (s < 32 ? 0.28 : 0.32) + flicker * 0.05;
  const liftY = (s < 32 ? 1.5 : 2) * Math.sin(f / FRAMES * Math.PI * 2) - (s < 32 ? 1 : 1.5);

  ctx.save();
  ctx.translate(0, liftY);

  drawFlame(ctx, s, cx, flameLen, flicker, 0.08, c.flame1, c.flame2, 0.95);
  drawFlame(ctx, s, cx, flameLen * 0.7, flicker, 0.04, c.flame2, c.flame3, 0.9);
  drawFlame(ctx, s, cx, flameLen * 0.4, flicker, 0.015, c.flame3, c.flame3, 1);

  for (let i = 0; i < 2; i++) {
    const t = ((f / FRAMES) + i / 2) % 1;
    const alpha = 0.12 * (1 - t);
    const sy2 = s * (0.68 + flameLen) + t * s * 0.2;
    const sr = s * 0.035 * (1 + t * 1.8);
    const sx2 = cx + Math.sin(t * Math.PI * 3 + i) * s * 0.05;
    ctx.beginPath();
    ctx.arc(sx2, sy2, sr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(180,185,210,${alpha})`;
    ctx.fill();
  }

  ctx.fillStyle = c.fin;
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + dir * s * 0.11, s * 0.54);
    ctx.lineTo(cx + dir * s * 0.25, s * 0.68);
    ctx.lineTo(cx + dir * s * 0.225, s * 0.74);
    ctx.lineTo(cx + dir * s * 0.11, s * 0.69);
    ctx.closePath();
    ctx.fill();
  }

  const nozzleW = s * 0.07;
  ctx.fillStyle = c.nozzle;
  ctx.beginPath();
  ctx.moveTo(cx - nozzleW, s * 0.68);
  ctx.lineTo(cx + nozzleW, s * 0.68);
  ctx.lineTo(cx + nozzleW * 0.8, s * 0.74);
  ctx.lineTo(cx - nozzleW * 0.8, s * 0.74);
  ctx.closePath();
  ctx.fill();

  const bodyW = s * 0.15;
  ctx.beginPath();
  ctx.moveTo(cx, s * 0.12);
  ctx.lineTo(cx + bodyW, s * 0.46);
  ctx.lineTo(cx + bodyW * 0.7, s * 0.68);
  ctx.lineTo(cx - bodyW * 0.7, s * 0.68);
  ctx.lineTo(cx - bodyW, s * 0.46);
  ctx.closePath();
  const bodyGrad = ctx.createLinearGradient(cx - bodyW, 0, cx + bodyW, 0);
  bodyGrad.addColorStop(0, c.body1);
  bodyGrad.addColorStop(0.3, c.body2);
  bodyGrad.addColorStop(0.6, c.body3);
  bodyGrad.addColorStop(1, c.body1);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  const wr = s * 0.1; const wy = s * 0.35;
  ctx.beginPath();
  ctx.arc(cx, wy, wr + Math.max(1, s * 0.02), 0, Math.PI * 2);
  ctx.fillStyle = c.gold;
  ctx.fill();
  const wGrad = ctx.createRadialGradient(cx - wr * 0.3, wy - wr * 0.3, 0, cx, wy, wr);
  wGrad.addColorStop(0, c.glass1);
  wGrad.addColorStop(0.6, c.glass2);
  wGrad.addColorStop(1, c.glass3);
  ctx.beginPath();
  ctx.arc(cx, wy, wr, 0, Math.PI * 2);
  ctx.fillStyle = wGrad;
  ctx.fill();

  ctx.restore();
}

function getIconData(active) {
  const imageData = {};
  for (const size of ICON_SIZES) {
    const canvas = makeCanvas(size);
    const ctx = canvas.getContext('2d');
    drawNeoIcon(ctx, size, frame, active);
    imageData[size] = ctx.getImageData(0, 0, size, size);
  }
  return imageData;
}

const actionApi = firefoxApi.browserAction || firefoxApi.action;

function animateIcon(tabId) {
  if (animInterval) return;
  frame = 0;
  animInterval = setInterval(() => {
    frame = (frame + 1) % FRAMES;
    try {
      actionApi.setIcon({ imageData: getIconData(true), tabId });
    } catch (e) {}
  }, 80);
}

function stopAnimation() {
  if (animInterval) {
    clearInterval(animInterval);
    animInterval = null;
  }
  try {
    actionApi.setIcon({ imageData: getIconData(false) });
  } catch (e) {}
}

firefoxApi.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'BANICH_ORIGIN' && sender.tab?.url) {
    try { sendResponse({ origin: new URL(sender.tab.url).origin }); } catch (e) {}
    return;
  }
  if (msg.type === 'BANICH_UPDATE') {
    if (msg.fontActive || msg.rtlActive) animateIcon(msg.tabId);
    else stopAnimation();
    sendResponse({ ok: true });
  }
});

firefoxApi.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await firefoxApi.tabs.get(tabId);
    if (tab.url && tab.url.startsWith('http')) {
      const url = new URL(tab.url);
      const res = await firefoxApi.storage.local.get(['banich_' + url.origin]);
      const settings = res['banich_' + url.origin];
      if (settings && (settings.font === true || settings.rtl === true)) animateIcon(tabId);
      else stopAnimation();
    } else stopAnimation();
  } catch (e) { stopAnimation(); }
});

firefoxApi.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.active) return;
  try {
    const key = 'banich_' + new URL(tab.url).origin;
    const saved = await firefoxApi.storage.local.get([key]);
    const settings = saved[key];
    if (settings && (settings.font === true || settings.rtl === true)) animateIcon(tabId);
    else stopAnimation();
  } catch (e) { stopAnimation(); }
});

// Init static icon
try {
  actionApi.setIcon({ imageData: getIconData(false) });
} catch (e) {}
