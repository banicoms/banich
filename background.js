importScripts('content.js');

let animationInterval = null;
let activeAnimatedTabId = null;
let frame = 0;
const FRAMES = 12;
const ICON_PATHS = {
  16: 'icon16.png',
  48: 'icon48.png',
  128: 'icon128.png'
};
const managedTabs = new Map();

function drawRocketFrame(ctx, size, currentFrame) {
  const s = size;
  const cx = s / 2;
  const pulse = Math.sin((currentFrame / FRAMES) * Math.PI * 2);
  const flicker = Math.sin((currentFrame / FRAMES) * Math.PI * 4);

  ctx.clearRect(0, 0, s, s);

  const bg = ctx.createLinearGradient(0, 0, 0, s);
  bg.addColorStop(0, '#0a0a18');
  bg.addColorStop(1, '#12123a');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(0, 0, s, s, s * 0.12);
  ctx.fill();

  const stars = [[0.20, 0.10], [0.70, 0.08], [0.85, 0.22], [0.12, 0.30], [0.90, 0.15]];
  for (const [sx, sy] of stars) {
    ctx.fillStyle = `rgba(255,255,255,${0.4 + pulse * 0.25})`;
    ctx.beginPath();
    ctx.arc(sx * s, sy * s, s * 0.02, 0, Math.PI * 2);
    ctx.fill();
  }

  const flameLen = 0.26 + flicker * 0.05;

  ctx.beginPath();
  ctx.moveTo(cx, s * (0.70 + flameLen));
  ctx.lineTo(cx - s * 0.08, s * 0.70);
  ctx.lineTo(cx + s * 0.08, s * 0.70);
  ctx.closePath();
  const outerFlame = ctx.createLinearGradient(cx, s * 0.70, cx, s * (0.70 + flameLen));
  outerFlame.addColorStop(0, `rgba(255,${120 + Math.floor(flicker * 40)},20,0.95)`);
  outerFlame.addColorStop(1, 'rgba(255,60,0,0)');
  ctx.fillStyle = outerFlame;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx, s * (0.70 + flameLen * 0.72));
  ctx.lineTo(cx - s * 0.04, s * 0.70);
  ctx.lineTo(cx + s * 0.04, s * 0.70);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,220,50,0.95)';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx, s * (0.70 + flameLen * 0.42));
  ctx.lineTo(cx - s * 0.015, s * 0.70);
  ctx.lineTo(cx + s * 0.015, s * 0.70);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,220,1)';
  ctx.fill();

  for (let i = 0; i < 3; i += 1) {
    const t = ((currentFrame / FRAMES) + i / 3) % 1;
    const alpha = 0.15 * (1 - t);
    const smokeY = s * (0.70 + flameLen) + t * s * 0.25;
    const smokeR = s * 0.04 * (1 + t * 2);
    const smokeX = cx + Math.sin(t * Math.PI * 3 + i) * s * 0.06;
    ctx.beginPath();
    ctx.arc(smokeX, smokeY, smokeR, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(180,180,200,${alpha})`;
    ctx.fill();
  }

  ctx.beginPath();
  ctx.moveTo(cx - s * 0.10, s * 0.56);
  ctx.lineTo(cx - s * 0.26, s * 0.72);
  ctx.lineTo(cx - s * 0.22, s * 0.76);
  ctx.lineTo(cx - s * 0.10, s * 0.70);
  ctx.closePath();
  ctx.fillStyle = '#dc3232';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx + s * 0.10, s * 0.56);
  ctx.lineTo(cx + s * 0.26, s * 0.72);
  ctx.lineTo(cx + s * 0.22, s * 0.76);
  ctx.lineTo(cx + s * 0.10, s * 0.70);
  ctx.closePath();
  ctx.fillStyle = '#dc3232';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx, s * 0.10);
  ctx.lineTo(cx + s * 0.145, s * 0.46);
  ctx.lineTo(cx + s * 0.10, s * 0.70);
  ctx.lineTo(cx - s * 0.10, s * 0.70);
  ctx.lineTo(cx - s * 0.145, s * 0.46);
  ctx.closePath();
  const bodyGradient = ctx.createLinearGradient(cx - s * 0.15, 0, cx + s * 0.15, 0);
  bodyGradient.addColorStop(0, '#bdc5dc');
  bodyGradient.addColorStop(0.4, '#e8ecf5');
  bodyGradient.addColorStop(1, '#c8cfdf');
  ctx.fillStyle = bodyGradient;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx, s * 0.10);
  ctx.lineTo(cx + s * 0.06, s * 0.24);
  ctx.lineTo(cx, s * 0.22);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - s * 0.07, s * 0.70);
  ctx.lineTo(cx + s * 0.07, s * 0.70);
  ctx.lineTo(cx + s * 0.05, s * 0.76);
  ctx.lineTo(cx - s * 0.05, s * 0.76);
  ctx.closePath();
  ctx.fillStyle = '#606070';
  ctx.fill();

  const windowRadius = s * 0.10;
  const windowY = s * 0.36;
  ctx.beginPath();
  ctx.arc(cx, windowY, windowRadius + s * 0.025, 0, Math.PI * 2);
  ctx.fillStyle = '#D4AF37';
  ctx.fill();

  const glassGradient = ctx.createRadialGradient(cx - windowRadius * 0.3, windowY - windowRadius * 0.3, 0, cx, windowY, windowRadius);
  glassGradient.addColorStop(0, '#a0e8ff');
  glassGradient.addColorStop(1, '#1080c0');
  ctx.beginPath();
  ctx.arc(cx, windowY, windowRadius, 0, Math.PI * 2);
  ctx.fillStyle = glassGradient;
  ctx.fill();
}

async function setStaticIcon(tabId) {
  if (!tabId) {
    return;
  }

  try {
    await chrome.action.setIcon({ tabId, path: ICON_PATHS });
  } catch {
    // Tab may no longer exist.
  }
}

async function startAnimation(tabId) {
  if (!tabId) {
    return;
  }

  if (activeAnimatedTabId && activeAnimatedTabId !== tabId) {
    await setStaticIcon(activeAnimatedTabId);
  }

  activeAnimatedTabId = tabId;

  if (animationInterval) {
    return;
  }

  frame = 0;
  animationInterval = setInterval(async () => {
    if (!activeAnimatedTabId) {
      return;
    }

    try {
      const canvas = new OffscreenCanvas(19, 19);
      const ctx = canvas.getContext('2d');
      drawRocketFrame(ctx, 19, frame);
      const imageData = ctx.getImageData(0, 0, 19, 19);
      await chrome.action.setIcon({ tabId: activeAnimatedTabId, imageData });
      frame = (frame + 1) % FRAMES;
    } catch {
      // Ignore transient rendering issues.
    }
  }, 100);
}

async function stopAnimation() {
  const previousTabId = activeAnimatedTabId;
  activeAnimatedTabId = null;

  if (animationInterval) {
    clearInterval(animationInterval);
    animationInterval = null;
  }

  if (previousTabId) {
    await setStaticIcon(previousTabId);
  }
}

async function setTabTitle(tabId, effectiveState, tabUrl) {
  let title = 'Banich برای این سایت غیرفعال است';

  if (!effectiveState.supported) {
    title = 'Banich روی این صفحه قابل اجرا نیست';
  } else if (effectiveState.blocked) {
    title = 'Banich برای این سایت در فهرست استثنا قرار دارد';
  } else if (effectiveState.enabled) {
    title = 'Banich برای این سایت فعال است';
  }

  try {
    await chrome.action.setTitle({ tabId, title });
  } catch {
    // Tab may have been closed.
  }
}

async function syncAnimationForTab(tabId, enabled) {
  const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (activeTab?.id !== tabId) {
    return;
  }

  if (enabled) {
    await startAnimation(tabId);
  } else {
    await stopAnimation();
  }
}

async function disableManagedTab(tabId, tabUrl, state) {
  if (managedTabs.has(tabId)) {
    try {
      await BanichShared.applyStateToTab(tabId, false, BanichShared.DEFAULT_SETTINGS);
    } catch {
      // Ignore tabs that navigated away.
    }
    managedTabs.delete(tabId);
  }

  await setTabTitle(tabId, state, tabUrl);
  await syncAnimationForTab(tabId, false);
}

async function syncTab(tabId, tabUrl) {
  if (!tabId) {
    return;
  }

  const effectiveState = await BanichShared.getEffectiveConfig(tabUrl);

  if (!effectiveState.enabled) {
    await disableManagedTab(tabId, tabUrl, effectiveState);
    return;
  }

  await BanichShared.applyStateToTab(tabId, true, {
    fontEnabled: effectiveState.fontEnabled,
    rtlEnabled: effectiveState.rtlEnabled
  });

  managedTabs.set(tabId, {
    pattern: effectiveState.matchedRule?.pattern || null,
    url: tabUrl
  });

  await setTabTitle(tabId, effectiveState, tabUrl);
  await syncAnimationForTab(tabId, true);
}

async function refreshActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab?.id) {
    await stopAnimation();
    return;
  }

  await syncTab(tab.id, tab.url || '');
}

async function syncTabsByPattern(pattern) {
  const normalizedPattern = BanichShared.normalizePattern(pattern);
  if (!normalizedPattern) {
    await refreshActiveTab();
    return;
  }

  let tabs = [];
  try {
    tabs = await chrome.tabs.query({ url: [normalizedPattern] });
  } catch {
    await refreshActiveTab();
    return;
  }

  await Promise.all(tabs.filter((tab) => tab.id).map((tab) => syncTab(tab.id, tab.url || '')));
}

async function refreshManagedTabs() {
  const tabs = await chrome.tabs.query({});
  const managedIds = new Set(managedTabs.keys());
  const activeTab = (await chrome.tabs.query({ active: true, lastFocusedWindow: true }))[0];
  if (activeTab?.id) {
    managedIds.add(activeTab.id);
  }

  await Promise.all(
    tabs
      .filter((tab) => tab.id && managedIds.has(tab.id))
      .map((tab) => syncTab(tab.id, tab.url || ''))
  );
}

chrome.runtime.onInstalled.addListener(async (details) => {
  await BanichShared.ensureMigrated();

  if (details.reason === 'install') {
    await chrome.storage.local.set({ [BanichShared.AD_SEEN_KEY]: false });
  }

  await stopAnimation();
  await refreshActiveTab();
});

chrome.tabs.onActivated.addListener(async () => {
  await refreshActiveTab();
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' && !changeInfo.url) {
    return;
  }

  await syncTab(tabId, tab.url || changeInfo.url || '');
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  managedTabs.delete(tabId);
  if (tabId === activeAnimatedTabId) {
    await stopAnimation();
  }
});

chrome.windows.onFocusChanged.addListener(async () => {
  await refreshActiveTab();
});

chrome.permissions.onAdded.addListener(async (permissions) => {
  const origins = permissions?.origins || [];
  if (!origins.length) {
    await refreshManagedTabs();
    return;
  }

  await Promise.all(origins.map((pattern) => syncTabsByPattern(pattern)));
});

chrome.permissions.onRemoved.addListener(async (permissions) => {
  const origins = permissions?.origins || [];
  if (!origins.length) {
    await refreshManagedTabs();
    return;
  }

  await Promise.all(origins.map((pattern) => syncTabsByPattern(pattern)));
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'BANICH_REFRESH_ACTIVE_TAB') {
    refreshActiveTab();
  } else if (message?.type === 'BANICH_REFRESH_TAB' && message.tabId) {
    chrome.tabs.get(message.tabId)
      .then((tab) => syncTab(tab.id, tab.url || ''))
      .catch(() => {});
  } else if (message?.type === 'BANICH_REFRESH_PATTERN' && message.pattern) {
    syncTabsByPattern(message.pattern);
  } else if (message?.type === 'BANICH_REFRESH_MANAGED_TABS') {
    refreshManagedTabs();
  }
});
