// Background service worker - animates toolbar icon when RTL is active
let animInterval = null;
let frame = 0;

// We use offscreen canvas to draw animated frames
const FRAMES = 12;

function drawRocketFrame(ctx, size, f) {
  const s = size;
  const cx = s / 2;
  const total = FRAMES;

  ctx.clearRect(0, 0, s, s);

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, s);
  bg.addColorStop(0, '#0a0a18');
  bg.addColorStop(1, '#12123a');
  ctx.fillStyle = bg;
  ctx.beginPath();
  const r = s * 0.12;
  ctx.roundRect(0, 0, s, s, r);
  ctx.fill();

  // Stars
  const stars = [[0.2,0.1],[0.7,0.08],[0.85,0.22],[0.12,0.3],[0.9,0.15]];
  const pulse = Math.sin(f / total * Math.PI * 2);
  stars.forEach(([sx,sy]) => {
    ctx.fillStyle = `rgba(255,255,255,${0.4 + pulse*0.3})`;
    ctx.beginPath();
    ctx.arc(sx*s, sy*s, s*0.02, 0, Math.PI*2);
    ctx.fill();
  });

  const flicker = Math.sin(f / total * Math.PI * 2);
  const flameLen = 0.26 + flicker * 0.05;

  // Outer flame
  ctx.beginPath();
  ctx.moveTo(cx, s * (0.70 + flameLen));
  ctx.lineTo(cx - s*0.08, s*0.70);
  ctx.lineTo(cx + s*0.08, s*0.70);
  ctx.closePath();
  const fg1 = ctx.createLinearGradient(cx, s*0.70, cx, s*(0.70+flameLen));
  fg1.addColorStop(0, `rgba(255,${120+Math.floor(flicker*40)},20,0.95)`);
  fg1.addColorStop(1, 'rgba(255,60,0,0)');
  ctx.fillStyle = fg1;
  ctx.fill();

  // Mid flame
  ctx.beginPath();
  ctx.moveTo(cx, s * (0.70 + flameLen * 0.75));
  ctx.lineTo(cx - s*0.04, s*0.70);
  ctx.lineTo(cx + s*0.04, s*0.70);
  ctx.closePath();
  ctx.fillStyle = `rgba(255,220,50,0.95)`;
  ctx.fill();

  // Inner flame
  ctx.beginPath();
  ctx.moveTo(cx, s * (0.70 + flameLen * 0.45));
  ctx.lineTo(cx - s*0.015, s*0.70);
  ctx.lineTo(cx + s*0.015, s*0.70);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,220,1)';
  ctx.fill();

  // Smoke puffs (only when active/animating)
  for (let i = 0; i < 3; i++) {
    const t = ((f / total) + i / 3) % 1;
    const alpha = 0.15 * (1 - t);
    const sy2 = s * (0.70 + flameLen) + t * s * 0.25;
    const sr = s * 0.04 * (1 + t * 2);
    const sx2 = cx + Math.sin(t * Math.PI * 3 + i) * s * 0.06;
    ctx.beginPath();
    ctx.arc(sx2, sy2, sr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(180,180,200,${alpha})`;
    ctx.fill();
  }

  // Left fin
  ctx.beginPath();
  ctx.moveTo(cx - s*0.10, s*0.56);
  ctx.lineTo(cx - s*0.26, s*0.72);
  ctx.lineTo(cx - s*0.22, s*0.76);
  ctx.lineTo(cx - s*0.10, s*0.70);
  ctx.closePath();
  ctx.fillStyle = '#dc3232';
  ctx.fill();

  // Right fin
  ctx.beginPath();
  ctx.moveTo(cx + s*0.10, s*0.56);
  ctx.lineTo(cx + s*0.26, s*0.72);
  ctx.lineTo(cx + s*0.22, s*0.76);
  ctx.lineTo(cx + s*0.10, s*0.70);
  ctx.closePath();
  ctx.fillStyle = '#dc3232';
  ctx.fill();

  // Body
  ctx.beginPath();
  ctx.moveTo(cx, s*0.10);
  ctx.lineTo(cx + s*0.145, s*0.46);
  ctx.lineTo(cx + s*0.10, s*0.70);
  ctx.lineTo(cx - s*0.10, s*0.70);
  ctx.lineTo(cx - s*0.145, s*0.46);
  ctx.closePath();
  const bodyGrad = ctx.createLinearGradient(cx - s*0.15, 0, cx + s*0.15, 0);
  bodyGrad.addColorStop(0, '#bdc5dc');
  bodyGrad.addColorStop(0.4, '#e8ecf5');
  bodyGrad.addColorStop(1, '#c8cfdf');
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // Nose highlight
  ctx.beginPath();
  ctx.moveTo(cx, s*0.10);
  ctx.lineTo(cx + s*0.06, s*0.24);
  ctx.lineTo(cx, s*0.22);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fill();

  // Nozzle
  ctx.beginPath();
  ctx.moveTo(cx - s*0.07, s*0.70);
  ctx.lineTo(cx + s*0.07, s*0.70);
  ctx.lineTo(cx + s*0.05, s*0.76);
  ctx.lineTo(cx - s*0.05, s*0.76);
  ctx.closePath();
  ctx.fillStyle = '#606070';
  ctx.fill();

  // Window ring (gold)
  const wr = s*0.10; const wy = s*0.36;
  ctx.beginPath();
  ctx.arc(cx, wy, wr + s*0.025, 0, Math.PI*2);
  ctx.fillStyle = '#D4AF37';
  ctx.fill();

  // Window glass (cyan)
  const wGrad = ctx.createRadialGradient(cx - wr*0.3, wy - wr*0.3, 0, cx, wy, wr);
  wGrad.addColorStop(0, '#a0e8ff');
  wGrad.addColorStop(1, '#1080c0');
  ctx.beginPath();
  ctx.arc(cx, wy, wr, 0, Math.PI*2);
  ctx.fillStyle = wGrad;
  ctx.fill();
}

async function startAnimation(tabId) {
  if (animInterval) return;
  frame = 0;
  animInterval = setInterval(async () => {
    frame = (frame + 1) % FRAMES;
    try {
      const canvas = new OffscreenCanvas(19, 19);
      const ctx = canvas.getContext('2d');
      drawRocketFrame(ctx, 19, frame);
      const bitmap = canvas.transferToImageBitmap();
      await chrome.action.setIcon({ imageData: bitmap, tabId });
    } catch(e) {}
  }, 100);
}

function stopAnimation() {
  if (animInterval) {
    clearInterval(animInterval);
    animInterval = null;
  }
  // Reset to static icon
  chrome.action.setIcon({
    path: { '16': 'icon16.png', '48': 'icon48.png', '128': 'icon128.png' }
  }).catch(()=>{});
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'BANICH_ON') {
    startAnimation(msg.tabId);
  } else if (msg.type === 'BANICH_OFF') {
    stopAnimation();
  }
});

// On tab switch, check state
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const res = await chrome.storage.local.get(['banich_active_tab_' + tabId]);
    if (res['banich_active_tab_' + tabId]) {
      startAnimation(tabId);
    } else {
      stopAnimation();
    }
  } catch(e) {}
});
