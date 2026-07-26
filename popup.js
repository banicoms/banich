const rocketCanvas = document.getElementById('rocketCanvas');
const rocketCtx = rocketCanvas.getContext('2d');
const siteHost = document.getElementById('siteHost');
const siteHint = document.getElementById('siteHint');
const statusPill = document.getElementById('statusPill');
const mainToggle = document.getElementById('mainToggle');
const mainToggleTitle = document.getElementById('mainToggleTitle');
const mainToggleDesc = document.getElementById('mainToggleDesc');
const excludeToggle = document.getElementById('excludeToggle');
const openOptionsButton = document.getElementById('openOptions');
const fontToggle = document.getElementById('fontToggle');
const rtlToggle = document.getElementById('rtlToggle');
const messageBar = document.getElementById('messageBar');
const adBanner = document.getElementById('adBanner');
const adClose = document.getElementById('adClose');

let currentTab = null;
let currentPattern = null;
let currentAllowRule = null;
let currentExcludeRule = null;
let effectiveState = null;
let settings = { ...BanichShared.DEFAULT_SETTINGS };
let busy = false;
let rocketFrame = 0;
let rocketInterval = null;
const ROCKET_FRAMES = 20;

function drawRocket(frame, active) {
  const s = 52;
  const cx = s / 2;
  rocketCtx.clearRect(0, 0, s, s);

  const bg = rocketCtx.createLinearGradient(0, 0, 0, s);
  bg.addColorStop(0, '#0e1527');
  bg.addColorStop(1, '#080d18');
  rocketCtx.fillStyle = bg;
  rocketCtx.beginPath();
  rocketCtx.roundRect(0, 0, s, s, 14);
  rocketCtx.fill();

  const stars = [[0.20, 0.12], [0.70, 0.10], [0.86, 0.24], [0.14, 0.34], [0.90, 0.44]];
  const pulse = Math.sin((frame / ROCKET_FRAMES) * Math.PI * 2);
  for (const [sx, sy] of stars) {
    rocketCtx.fillStyle = `rgba(255,255,255,${0.28 + pulse * 0.24})`;
    rocketCtx.beginPath();
    rocketCtx.arc(sx * s, sy * s, s * 0.018, 0, Math.PI * 2);
    rocketCtx.fill();
  }

  if (active) {
    for (let i = 0; i < 4; i += 1) {
      const t = ((frame / ROCKET_FRAMES) + i / 4) % 1;
      const alpha = 0.18 * (1 - t);
      const smokeY = s * (0.82 + t * 0.30);
      const smokeR = s * 0.035 * (1 + t * 2.5);
      const smokeX = cx + Math.sin(t * Math.PI * 4 + i * 1.5) * s * 0.07;
      const smokeGradient = rocketCtx.createRadialGradient(smokeX, smokeY, 0, smokeX, smokeY, smokeR);
      smokeGradient.addColorStop(0, `rgba(180,185,210,${alpha})`);
      smokeGradient.addColorStop(1, 'rgba(120,130,160,0)');
      rocketCtx.beginPath();
      rocketCtx.arc(smokeX, smokeY, smokeR, 0, Math.PI * 2);
      rocketCtx.fillStyle = smokeGradient;
      rocketCtx.fill();
    }
  }

  const liftY = active ? Math.sin((frame / ROCKET_FRAMES) * Math.PI * 2) * 1.5 - 2 : 0;
  rocketCtx.save();
  rocketCtx.translate(0, liftY);

  if (active) {
    const flicker = Math.sin((frame / ROCKET_FRAMES) * Math.PI * 4);
    const flameLen = 0.28 + flicker * 0.06;

    rocketCtx.beginPath();
    rocketCtx.moveTo(cx - s * 0.075, s * 0.72);
    rocketCtx.lineTo(cx, s * (0.72 + flameLen));
    rocketCtx.lineTo(cx + s * 0.075, s * 0.72);
    rocketCtx.closePath();
    const outerFlame = rocketCtx.createLinearGradient(cx, s * 0.72, cx, s * (0.72 + flameLen));
    outerFlame.addColorStop(0, `rgba(255,${100 + Math.floor(flicker * 50)},20,1)`);
    outerFlame.addColorStop(1, 'rgba(255,50,0,0)');
    rocketCtx.fillStyle = outerFlame;
    rocketCtx.fill();

    rocketCtx.beginPath();
    rocketCtx.moveTo(cx - s * 0.04, s * 0.72);
    rocketCtx.lineTo(cx, s * (0.72 + flameLen * 0.72));
    rocketCtx.lineTo(cx + s * 0.04, s * 0.72);
    rocketCtx.closePath();
    rocketCtx.fillStyle = 'rgba(255,215,50,0.95)';
    rocketCtx.fill();

    rocketCtx.beginPath();
    rocketCtx.moveTo(cx - s * 0.015, s * 0.72);
    rocketCtx.lineTo(cx, s * (0.72 + flameLen * 0.44));
    rocketCtx.lineTo(cx + s * 0.015, s * 0.72);
    rocketCtx.closePath();
    rocketCtx.fillStyle = 'rgba(255,255,220,1)';
    rocketCtx.fill();
  }

  rocketCtx.beginPath();
  rocketCtx.moveTo(cx - s * 0.10, s * 0.57);
  rocketCtx.lineTo(cx - s * 0.26, s * 0.73);
  rocketCtx.lineTo(cx - s * 0.22, s * 0.77);
  rocketCtx.lineTo(cx - s * 0.10, s * 0.72);
  rocketCtx.closePath();
  rocketCtx.fillStyle = '#dc3030';
  rocketCtx.fill();

  rocketCtx.beginPath();
  rocketCtx.moveTo(cx + s * 0.10, s * 0.57);
  rocketCtx.lineTo(cx + s * 0.26, s * 0.73);
  rocketCtx.lineTo(cx + s * 0.22, s * 0.77);
  rocketCtx.lineTo(cx + s * 0.10, s * 0.72);
  rocketCtx.closePath();
  rocketCtx.fillStyle = '#dc3030';
  rocketCtx.fill();

  rocketCtx.beginPath();
  rocketCtx.moveTo(cx - s * 0.065, s * 0.72);
  rocketCtx.lineTo(cx + s * 0.065, s * 0.72);
  rocketCtx.lineTo(cx + s * 0.05, s * 0.78);
  rocketCtx.lineTo(cx - s * 0.05, s * 0.78);
  rocketCtx.closePath();
  rocketCtx.fillStyle = '#555566';
  rocketCtx.fill();

  rocketCtx.beginPath();
  rocketCtx.moveTo(cx, s * 0.10);
  rocketCtx.lineTo(cx + s * 0.145, s * 0.47);
  rocketCtx.lineTo(cx + s * 0.10, s * 0.72);
  rocketCtx.lineTo(cx - s * 0.10, s * 0.72);
  rocketCtx.lineTo(cx - s * 0.145, s * 0.47);
  rocketCtx.closePath();
  const bodyGradient = rocketCtx.createLinearGradient(cx - s * 0.16, 0, cx + s * 0.16, 0);
  bodyGradient.addColorStop(0, '#b8c2d8');
  bodyGradient.addColorStop(0.35, '#e8edf8');
  bodyGradient.addColorStop(1, '#c0c8da');
  rocketCtx.fillStyle = bodyGradient;
  rocketCtx.fill();

  rocketCtx.beginPath();
  rocketCtx.moveTo(cx, s * 0.10);
  rocketCtx.lineTo(cx + s * 0.055, s * 0.23);
  rocketCtx.lineTo(cx, s * 0.21);
  rocketCtx.closePath();
  rocketCtx.fillStyle = 'rgba(255,255,255,0.55)';
  rocketCtx.fill();

  rocketCtx.fillStyle = 'rgba(220,50,50,0.85)';
  rocketCtx.fillRect(cx - s * 0.13, s * 0.52, s * 0.26, s * 0.025);
  rocketCtx.fillStyle = 'rgba(60,80,220,0.75)';
  rocketCtx.fillRect(cx - s * 0.13, s * 0.55, s * 0.26, s * 0.022);

  const windowRadius = s * 0.095;
  const windowY = s * 0.37;
  rocketCtx.beginPath();
  rocketCtx.arc(cx, windowY, windowRadius + s * 0.025, 0, Math.PI * 2);
  rocketCtx.fillStyle = '#D4AF37';
  rocketCtx.fill();

  const glassGradient = rocketCtx.createRadialGradient(cx - windowRadius * 0.35, windowY - windowRadius * 0.35, 0, cx, windowY, windowRadius);
  glassGradient.addColorStop(0, '#c0f0ff');
  glassGradient.addColorStop(0.6, '#2090d0');
  glassGradient.addColorStop(1, '#0050a0');
  rocketCtx.beginPath();
  rocketCtx.arc(cx, windowY, windowRadius, 0, Math.PI * 2);
  rocketCtx.fillStyle = glassGradient;
  rocketCtx.fill();

  rocketCtx.beginPath();
  rocketCtx.ellipse(cx - windowRadius * 0.3, windowY - windowRadius * 0.3, windowRadius * 0.35, windowRadius * 0.22, -0.5, 0, Math.PI * 2);
  rocketCtx.fillStyle = 'rgba(255,255,255,0.5)';
  rocketCtx.fill();
  rocketCtx.restore();
}

function startRocketAnimation() {
  if (rocketInterval) {
    return;
  }

  rocketInterval = setInterval(() => {
    rocketFrame = (rocketFrame + 1) % ROCKET_FRAMES;
    drawRocket(rocketFrame, true);
  }, 60);
}

function stopRocketAnimation() {
  if (rocketInterval) {
    clearInterval(rocketInterval);
    rocketInterval = null;
  }
  rocketFrame = 0;
  drawRocket(0, false);
}

function setMessage(text, tone = 'info') {
  messageBar.textContent = text;
  messageBar.className = `message ${tone}`;
}

function syncGlobalButtons() {
  fontToggle.classList.toggle('is-on', settings.fontEnabled);
  rtlToggle.classList.toggle('is-on', settings.rtlEnabled);
}

function render() {
  const hostLabel = currentTab?.url ? BanichShared.getDisplayHost(currentTab.url) : 'تب فعالی پیدا نشد';
  siteHost.textContent = hostLabel;
  syncGlobalButtons();

  if (!currentTab) {
    siteHint.textContent = 'مرورگر هیچ تب فعالی برای این پنجره پیدا نکرد.';
    statusPill.textContent = 'نامشخص';
    statusPill.className = 'status-pill warn';
    mainToggle.disabled = true;
    excludeToggle.disabled = true;
    mainToggle.classList.remove('is-on');
    mainToggleTitle.textContent = 'تب فعالی در دسترس نیست';
    mainToggleDesc.textContent = 'یک سایت وب را باز کنید و دوباره امتحان کنید.';
    stopRocketAnimation();
    return;
  }

  if (!effectiveState?.supported) {
    siteHint.textContent = BanichShared.getRestrictionReason(currentTab.url);
    statusPill.textContent = 'پشتیبانی نمی‌شود';
    statusPill.className = 'status-pill warn';
    mainToggle.disabled = true;
    excludeToggle.disabled = true;
    mainToggle.classList.remove('is-on');
    mainToggleTitle.textContent = 'این صفحه قابل پشتیبانی نیست';
    mainToggleDesc.textContent = 'Banich فقط روی سایت‌های عادی HTTP/HTTPS اجرا می‌شود.';
    stopRocketAnimation();
    return;
  }

  mainToggle.disabled = busy;
  excludeToggle.disabled = busy;

  if (currentExcludeRule) {
    statusPill.textContent = 'در استثنا';
    statusPill.className = 'status-pill danger';
    siteHint.textContent = 'برای این سایت یک قانون استثنا ثبت شده است.';
    mainToggle.classList.remove('is-on');
    mainToggleTitle.textContent = 'خروج از لیست استثنا';
    mainToggleDesc.textContent = 'با این کار قانون استثنا حذف می‌شود.';
    excludeToggle.textContent = 'حذف از استثنا';
    excludeToggle.classList.add('warn');
    stopRocketAnimation();
    return;
  }

  if (effectiveState.enabled) {
    statusPill.textContent = 'فعال';
    statusPill.className = 'status-pill on';
    mainToggle.classList.add('is-on');
    excludeToggle.textContent = 'افزودن به استثنا';
    excludeToggle.classList.remove('warn');
    startRocketAnimation();

    if (currentAllowRule) {
      siteHint.textContent = 'این سایت با قانون دقیق خودش فعال شده است.';
      mainToggleTitle.textContent = 'غیرفعال‌سازی برای این سایت';
      mainToggleDesc.textContent = 'فقط قانون دقیق همین دامنه حذف می‌شود.';
    } else {
      siteHint.textContent = `این سایت با قانون «${effectiveState.matchedRule?.pattern || 'کلی'}» فعال شده است.`;
      mainToggleTitle.textContent = 'غیرفعال‌سازی فقط برای این سایت';
      mainToggleDesc.textContent = 'برای این دامنه یک استثنای دقیق ساخته می‌شود.';
    }
    return;
  }

  statusPill.textContent = 'غیرفعال';
  statusPill.className = 'status-pill off';
  mainToggle.classList.remove('is-on');
  mainToggleTitle.textContent = 'فعال‌سازی برای این سایت';
  mainToggleDesc.textContent = 'برای همین دامنه قانون دقیق ثبت می‌شود.';
  excludeToggle.textContent = 'افزودن به استثنا';
  excludeToggle.classList.remove('warn');
  siteHint.textContent = effectiveState.reason || 'برای این سایت هنوز قانونی ثبت نشده است.';
  stopRocketAnimation();
}

async function notifyBackground(payload = {}) {
  try {
    await chrome.runtime.sendMessage(payload);
  } catch {
    // Background worker may be sleeping.
  }
}

async function loadState() {
  await BanichShared.ensureMigrated();
  currentTab = await BanichShared.getCurrentTab();
  settings = await BanichShared.getSettings();

  if (!currentTab?.url) {
    effectiveState = null;
    currentPattern = null;
    currentAllowRule = null;
    currentExcludeRule = null;
    render();
    setMessage('هیچ تب فعالی برای این پنجره پیدا نشد.', 'warning');
    return;
  }

  effectiveState = await BanichShared.getEffectiveConfig(currentTab.url);
  currentPattern = BanichShared.getExactPatternForUrl(currentTab.url);
  currentAllowRule = currentPattern ? await BanichShared.findRuleByPattern(currentPattern, 'allow') : null;
  currentExcludeRule = currentPattern ? await BanichShared.findRuleByPattern(currentPattern, 'exclude') : null;

  render();

  if (!effectiveState.supported) {
    setMessage(BanichShared.getRestrictionReason(currentTab.url), 'warning');
  }
}

async function refreshUi(message, tone = 'info') {
  await loadState();
  if (message) {
    setMessage(message, tone);
  }
}

async function handleMainToggle() {
  if (busy || !currentTab?.url || !effectiveState?.supported || !currentPattern) {
    return;
  }

  busy = true;
  render();

  try {
    if (currentExcludeRule) {
      await BanichShared.removeRule(currentExcludeRule.id);
      await notifyBackground({ type: 'BANICH_REFRESH_PATTERN', pattern: currentPattern });
      await refreshUi('این سایت از فهرست استثنا خارج شد.', 'success');
      return;
    }

    if (effectiveState.enabled && currentAllowRule) {
      await BanichShared.removeRule(currentAllowRule.id);
      if (!await BanichShared.isPermissionPatternStillUsed(currentPattern, currentAllowRule.id)) {
        await BanichShared.removePatternPermission(currentPattern);
      }
      await notifyBackground({ type: 'BANICH_REFRESH_PATTERN', pattern: currentPattern });
      await refreshUi('قانون دقیق این سایت حذف شد.', 'info');
      return;
    }

    if (effectiveState.enabled && !currentAllowRule) {
      await BanichShared.upsertRule({
        type: 'exclude',
        pattern: currentPattern
      });
      await notifyBackground({ type: 'BANICH_REFRESH_PATTERN', pattern: currentPattern });
      await refreshUi('برای این سایت یک استثنای دقیق ساخته شد.', 'success');
      return;
    }

    const granted = await BanichShared.requestPatternPermission(currentPattern);
    if (!granted) {
      setMessage('مجوز این دامنه تأیید نشد؛ بنابراین Banich فعال نشد.', 'warning');
      return;
    }

    await BanichShared.upsertRule({
      type: 'allow',
      pattern: currentPattern,
      fontEnabled: 'inherit',
      rtlEnabled: 'inherit'
    });
    await notifyBackground({ type: 'BANICH_REFRESH_PATTERN', pattern: currentPattern });
    await refreshUi('Banich برای این سایت فعال شد.', 'success');
  } catch (error) {
    console.error('Banich popup toggle error:', error);
    setMessage('تغییر وضعیت انجام نشد. لطفاً یک‌بار دیگر تلاش کنید.', 'error');
  } finally {
    busy = false;
    render();
  }
}

async function handleExcludeToggle() {
  if (busy || !currentTab?.url || !effectiveState?.supported || !currentPattern) {
    return;
  }

  busy = true;
  render();

  try {
    if (currentExcludeRule) {
      await BanichShared.removeRule(currentExcludeRule.id);
      await notifyBackground({ type: 'BANICH_REFRESH_PATTERN', pattern: currentPattern });
      await refreshUi('استثنای این سایت حذف شد.', 'success');
      return;
    }

    await BanichShared.upsertRule({
      type: 'exclude',
      pattern: currentPattern
    });
    await notifyBackground({ type: 'BANICH_REFRESH_PATTERN', pattern: currentPattern });
    await refreshUi('این سایت به فهرست استثنا اضافه شد.', 'info');
  } catch (error) {
    console.error('Banich exclude toggle error:', error);
    setMessage('ویرایش فهرست استثنا ناموفق بود.', 'error');
  } finally {
    busy = false;
    render();
  }
}

async function handleGlobalSettingToggle(settingKey) {
  const nextSettings = {
    ...settings,
    [settingKey]: !settings[settingKey]
  };

  if (!nextSettings.fontEnabled && !nextSettings.rtlEnabled) {
    setMessage('حداقل یکی از گزینه‌های فونت یا RTL باید روشن بماند.', 'warning');
    return;
  }

  try {
    settings = await BanichShared.saveSettings(nextSettings);
    syncGlobalButtons();
    await notifyBackground({ type: 'BANICH_REFRESH_MANAGED_TABS' });
    setMessage('تنظیمات پیش‌فرض ذخیره شد.', 'success');
    await loadState();
  } catch (error) {
    console.error('Banich setting toggle error:', error);
    setMessage('ذخیره تنظیمات پیش‌فرض ناموفق بود.', 'error');
  }
}

async function maybeShowAd() {
  const seen = await BanichShared.isAdSeen();
  if (seen) {
    adBanner.hidden = true;
    return;
  }

  adBanner.hidden = false;
  await BanichShared.markAdSeen();
}

mainToggle.addEventListener('click', handleMainToggle);
excludeToggle.addEventListener('click', handleExcludeToggle);
fontToggle.addEventListener('click', () => handleGlobalSettingToggle('fontEnabled'));
rtlToggle.addEventListener('click', () => handleGlobalSettingToggle('rtlEnabled'));
openOptionsButton.addEventListener('click', async () => {
  await chrome.runtime.openOptionsPage();
  window.close();
});
adClose.addEventListener('click', () => {
  adBanner.hidden = true;
});

drawRocket(0, false);
Promise.all([maybeShowAd(), loadState()]).catch((error) => {
  console.error('Banich popup init error:', error);
  setMessage('خواندن وضعیت افزونه با خطا روبه‌رو شد.', 'error');
});
