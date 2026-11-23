// Background service worker - animates toolbar icon with neomorphism style
let animInterval = null;
let frame = 0;
const FRAMES = 20;

const ICON_SIZES = [16, 32, 48, 128];

function getThemeColors() {
  const isDark = false;
  return {
    base: '#e0e5ec',
    baseLight: '#ffffff',
    baseDark: '#a3b1c6',
    accent: '#6c7ae0',
    accentLight: '#8a9aff',
    accentDark: '#4a5ab8',
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
}

function drawNeoIcon(ctx, size, f, active) {
  const s = size;
  const cx = s / 2;
  const c = getThemeColors();
  const radius = Math.max(3, s * 0.18);

  ctx.clearRect(0, 0, s, s);

  // Neomorphism base
  ctx.fillStyle = c.base;
  ctx.beginPath();
  ctx.roundRect(0, 0, s, s, radius);
  ctx.fill();

  // Concave inner shadow
  const inset = Math.max(1, s * 0.06);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(inset, inset, s - inset * 2, s - inset * 2, radius - inset);
  ctx.clip();
  const innerGrad = ctx.createLinearGradient(0, 0, 0, s);
  innerGrad.addColorStop(0, c.shadowLight + '60');
  innerGrad.addColorStop(1, c.shadowDark + '60');
  ctx.fillStyle = innerGrad;
  ctx.fillRect(inset, inset, s - inset * 2, s - inset * 2);
  ctx.restore();

  if (!active) {
    // Static logo: Banich "ب" letter or rocket silhouette
    drawStaticLogo(ctx, s, cx, c);
    return;
  }

  // Animated rocket
  const flicker = Math.sin(f / FRAMES * Math.PI * 4);
  const flameLen = (s < 32 ? 0.28 : 0.32) + flicker * 0.05;
  const liftY = (s < 32 ? 1.5 : 2) * Math.sin(f / FRAMES * Math.PI * 2) - (s < 32 ? 1 : 1.5);

  ctx.save();
  ctx.translate(0, liftY);

  // Flame layers
  drawFlame(ctx, s, cx, flameLen, flicker, c, 0.08, c.flame1, c.flame2, 0.95);
  drawFlame(ctx, s, cx, flameLen * 0.7, flicker, c, 0.04, c.flame2, c.flame3, 0.9);
  drawFlame(ctx, s, cx, flameLen * 0.4, flicker, c, 0.015, c.flame3, c.flame3, 1);

  // Smoke
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

  // Fins
  const finY1 = s * 0.54;
  const finY2 = s * 0.68;
  const finTipX = s * 0.25;
  ctx.fillStyle = c.fin;
  drawFin(ctx, cx, s, finY1, finY2, finTipX, -1);
  drawFin(ctx, cx, s, finY1, finY2, finTipX, 1);

  // Nozzle
  const nozzleY = s * 0.68;
  const nozzleW = s * 0.07;
  ctx.fillStyle = c.nozzle;
  ctx.beginPath();
  ctx.moveTo(cx - nozzleW, nozzleY);
  ctx.lineTo(cx + nozzleW, nozzleY);
  ctx.lineTo(cx + nozzleW * 0.8, s * 0.74);
  ctx.lineTo(cx - nozzleW * 0.8, s * 0.74);
  ctx.closePath();
  ctx.fill();

  // Body
  const noseY = s * 0.12;
  const bodyW = s * 0.15;
  const bodyBaseY = s * 0.68;
  ctx.beginPath();
  ctx.moveTo(cx, noseY);
  ctx.lineTo(cx + bodyW, s * 0.46);
  ctx.lineTo(cx + bodyW * 0.7, bodyBaseY);
  ctx.lineTo(cx - bodyW * 0.7, bodyBaseY);
  ctx.lineTo(cx - bodyW, s * 0.46);
  ctx.closePath();
  const bodyGrad = ctx.createLinearGradient(cx - bodyW, 0, cx + bodyW, 0);
  bodyGrad.addColorStop(0, c.body1);
  bodyGrad.addColorStop(0.3, c.body2);
  bodyGrad.addColorStop(0.6, c.body3);
  bodyGrad.addColorStop(1, c.body1);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // Nose highlight
  ctx.beginPath();
  ctx.moveTo(cx, noseY);
  ctx.lineTo(cx + bodyW * 0.4, s * 0.24);
  ctx.lineTo(cx, s * 0.22);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fill();

  // Window
  const wr = s * 0.1; const wy = s * 0.35;
  ctx.beginPath();
  ctx.arc(cx, wy, wr + Math.max(1, s * 0.02), 0, Math.PI*2);
  ctx.fillStyle = c.gold;
  ctx.fill();

  const wGrad = ctx.createRadialGradient(cx - wr*0.3, wy - wr*0.3, 0, cx, wy, wr);
  wGrad.addColorStop(0, c.glass1);
  wGrad.addColorStop(0.6, c.glass2);
  wGrad.addColorStop(1, c.glass3);
  ctx.beginPath();
  ctx.arc(cx, wy, wr, 0, Math.PI*2);
  ctx.fillStyle = wGrad;
  ctx.fill();

  ctx.restore();
}

function drawFlame(ctx, s, cx, len, flicker, c, width, color1, color2, opacity) {
  const baseY = s * 0.68;
  ctx.beginPath();
  ctx.moveTo(cx - s * width, baseY);
  ctx.lineTo(cx, baseY + s * len);
  ctx.lineTo(cx + s * width, baseY);
  ctx.closePath();
  const grad = ctx.createLinearGradient(cx, baseY, cx, baseY + s * len);
  grad.addColorStop(0, color1.replace(')', `,${opacity})`).replace('rgb', 'rgba'));
  grad.addColorStop(1, color2.replace(')', ',0)').replace('rgb', 'rgba'));
  ctx.fillStyle = grad;
  ctx.fill();
}

function drawFin(ctx, cx, s, y1, y2, tipX, dir) {
  ctx.beginPath();
  ctx.moveTo(cx + dir * s * 0.11, y1);
  ctx.lineTo(cx + dir * tipX, y2);
  ctx.lineTo(cx + dir * tipX * 0.9, s * 0.74);
  ctx.lineTo(cx + dir * s * 0.11, s * 0.69);
  ctx.closePath();
  ctx.fill();
}

function drawStaticLogo(ctx, s, cx, c) {
  // Draw a stylized "ب" (Banich) or rocket silhouette
  ctx.save();
  const scale = s / 52;
  ctx.translate(cx, s * 0.52);
  ctx.scale(scale, scale);

  // Rocket silhouette for static icon
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

  // Window
  ctx.beginPath();
  ctx.arc(0, -6, 5, 0, Math.PI*2);
  ctx.fillStyle = c.gold;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -6, 4, 0, Math.PI*2);
  const wGrad = ctx.createRadialGradient(-1.5, -7.5, 0, 0, -6, 4);
  wGrad.addColorStop(0, c.glass1);
  wGrad.addColorStop(1, c.glass3);
  ctx.fillStyle = wGrad;
  ctx.fill();

  ctx.restore();
}

async function generateIconFrames(tabId, active) {
  const frames = [];
  for (let f = 0; f < FRAMES; f++) {
    const canvas = new OffscreenCanvas(128, 128);
    const ctx = canvas.getContext('2d');
    drawNeoIcon(ctx, 128, f, active);
    frames.push(await canvas.convertToBlob({ type: 'image/png' }));
  }
  return frames;
}

async function animateIcon(tabId) {
  if (animInterval) return;
  frame = 0;
  
  // Pre-generate frames at max size, then scale
  const maxSize = 128;
  const c = getThemeColors();
  
  animInterval = setInterval(async () => {
    frame = (frame + 1) % FRAMES;
    try {
      const imageData = {};
      for (const size of ICON_SIZES) {
        const canvas = new OffscreenCanvas(size, size);
        const ctx = canvas.getContext('2d');
        drawNeoIcon(ctx, size, frame, true);
        imageData[size] = ctx.getImageData(0, 0, size, size);
      }
      await chrome.action.setIcon({ imageData, tabId });
    } catch(e) {}
  }, 80);
}

function stopAnimation() {
  if (animInterval) {
    clearInterval(animInterval);
    animInterval = null;
  }
  // Generate static icons for all sizes
  const imageData = {};
  for (const size of ICON_SIZES) {
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d');
    drawNeoIcon(ctx, size, 0, false);
    imageData[size] = ctx.getImageData(0, 0, size, size);
  }
  chrome.action.setIcon({ imageData }).catch(()=>{});
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'BANICH_UPDATE') {
    if (msg.fontActive || msg.rtlActive) animateIcon(msg.tabId);
    else stopAnimation();
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab.url && tab.url.startsWith('http')) {
      const url = new URL(tab.url);
      const res = await chrome.storage.local.get(['banich_' + url.origin]);
      const settings = res['banich_' + url.origin];
      if (settings && (settings.font === true || settings.rtl === true)) animateIcon(tabId);
      else stopAnimation();
    } else stopAnimation();
  } catch(e) { stopAnimation(); }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    try {
      const url = new URL(tab.url);
      const res = await chrome.storage.local.get(['banich_' + url.origin]);
      const settings = res['banich_' + url.origin];
      const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTabs[0]?.id === tabId && settings && (settings.font === true || settings.rtl === true)) {
        animateIcon(tabId);
      }
    } catch(e) {}
  }
});

// Initialize with static icon
(async () => {
  const imageData = {};
  for (const size of ICON_SIZES) {
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d');
    drawNeoIcon(ctx, size, 0, false);
    imageData[size] = ctx.getImageData(0, 0, size, size);
  }
  await chrome.action.setIcon({ imageData }).catch(()=>{});
})();