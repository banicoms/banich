const currentSiteHost = document.getElementById('currentSiteHost');
const currentSiteHint = document.getElementById('currentSiteHint');
const quickAllow = document.getElementById('quickAllow');
const quickExclude = document.getElementById('quickExclude');
const fontToggle = document.getElementById('fontToggle');
const rtlToggle = document.getElementById('rtlToggle');
const reloadStateButton = document.getElementById('reloadState');
const resetFormButton = document.getElementById('resetForm');
const patternInput = document.getElementById('patternInput');
const ruleType = document.getElementById('ruleType');
const includeSubdomains = document.getElementById('includeSubdomains');
const fontMode = document.getElementById('fontMode');
const rtlMode = document.getElementById('rtlMode');
const saveRuleButton = document.getElementById('saveRule');
const allowCount = document.getElementById('allowCount');
const excludeCount = document.getElementById('excludeCount');
const allowList = document.getElementById('allowList');
const excludeList = document.getElementById('excludeList');
const messageBar = document.getElementById('messageBar');
const allowOnlyFields = [...document.querySelectorAll('.allow-only')];

let currentTab = null;
let settings = { ...BanichShared.DEFAULT_SETTINGS };
let rules = [];
let editingRuleId = null;

function setMessage(text, tone = 'info') {
  messageBar.textContent = text;
  messageBar.className = `message ${tone}`;
}

function syncGlobalButtons() {
  fontToggle.classList.toggle('is-on', settings.fontEnabled);
  rtlToggle.classList.toggle('is-on', settings.rtlEnabled);
}

function modeLabel(value) {
  if (value === 'on') {
    return 'روشن';
  }
  if (value === 'off') {
    return 'خاموش';
  }
  return 'از پیش‌فرض';
}

function getCurrentExactPattern() {
  return currentTab?.url ? BanichShared.getExactPatternForUrl(currentTab.url) : null;
}

function renderCurrentSite() {
  if (!currentTab?.url) {
    currentSiteHost.textContent = 'تب فعالی پیدا نشد';
    currentSiteHint.textContent = 'یک سایت HTTP یا HTTPS را باز کنید تا بتوانید برای آن قانون بسازید.';
    quickAllow.disabled = true;
    quickExclude.disabled = true;
    return;
  }

  currentSiteHost.textContent = BanichShared.getDisplayHost(currentTab.url);
  if (!BanichShared.isSupportedUrl(currentTab.url)) {
    currentSiteHint.textContent = BanichShared.getRestrictionReason(currentTab.url);
    quickAllow.disabled = true;
    quickExclude.disabled = true;
    return;
  }

  quickAllow.disabled = false;
  quickExclude.disabled = false;
  currentSiteHint.textContent = 'می‌توانید همین دامنه را مستقیم به allowlist یا فهرست استثنا اضافه کنید.';
}

function renderRuleList(container, list, type) {
  if (!list.length) {
    container.className = 'rule-list empty-state';
    container.textContent = type === 'allow' ? 'هنوز قانونی ثبت نشده است.' : 'هنوز استثنایی ثبت نشده است.';
    return;
  }

  container.className = 'rule-list';
  container.innerHTML = '';

  for (const rule of list) {
    const row = document.createElement('div');
    row.className = 'rule-row';

    const content = document.createElement('div');
    const meta = type === 'allow'
      ? `فونت: ${modeLabel(rule.fontEnabled)} · RTL: ${modeLabel(rule.rtlEnabled)}`
      : 'این قانون برای خاموش نگه داشتن بانیچ روی الگوی فوق استفاده می‌شود.';
    content.innerHTML = `
      <div class="rule-pattern">${rule.pattern}</div>
      <div class="rule-meta">${meta}</div>
    `;

    const actions = document.createElement('div');
    actions.className = 'rule-actions';

    if (type === 'allow') {
      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.textContent = 'ویرایش';
      editButton.addEventListener('click', () => populateForm(rule));
      actions.appendChild(editButton);
    } else {
      const duplicateAsAllowButton = document.createElement('button');
      duplicateAsAllowButton.type = 'button';
      duplicateAsAllowButton.textContent = 'کپی در فرم';
      duplicateAsAllowButton.addEventListener('click', () => populateForm(rule));
      actions.appendChild(duplicateAsAllowButton);
    }

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'danger';
    deleteButton.textContent = 'حذف';
    deleteButton.addEventListener('click', () => removeRule(rule));
    actions.appendChild(deleteButton);

    row.appendChild(content);
    row.appendChild(actions);
    container.appendChild(row);
  }
}

function renderRules() {
  const allowRules = rules.filter((rule) => rule.type === 'allow');
  const excludeRules = rules.filter((rule) => rule.type === 'exclude');
  allowCount.textContent = String(allowRules.length);
  excludeCount.textContent = String(excludeRules.length);
  renderRuleList(allowList, allowRules, 'allow');
  renderRuleList(excludeList, excludeRules, 'exclude');
}

function syncRuleTypeUi() {
  const isAllow = ruleType.value === 'allow';
  for (const field of allowOnlyFields) {
    field.style.display = isAllow ? 'grid' : 'none';
  }
}

function resetForm() {
  editingRuleId = null;
  patternInput.value = '';
  includeSubdomains.checked = false;
  ruleType.value = 'allow';
  fontMode.value = 'inherit';
  rtlMode.value = 'inherit';
  saveRuleButton.textContent = 'ذخیره قانون';
  syncRuleTypeUi();
}

function populateForm(rule) {
  editingRuleId = rule.id;
  patternInput.value = rule.pattern;
  includeSubdomains.checked = false;
  ruleType.value = rule.type;
  fontMode.value = rule.fontEnabled || 'inherit';
  rtlMode.value = rule.rtlEnabled || 'inherit';
  saveRuleButton.textContent = 'به‌روزرسانی قانون';
  syncRuleTypeUi();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function notifyPattern(pattern) {
  if (!pattern) {
    return;
  }

  try {
    await chrome.runtime.sendMessage({ type: 'BANICH_REFRESH_PATTERN', pattern });
  } catch {
    // Background worker may be sleeping.
  }
}

async function notifyManagedTabsRefresh() {
  try {
    await chrome.runtime.sendMessage({ type: 'BANICH_REFRESH_MANAGED_TABS' });
  } catch {
    // Background worker may be sleeping.
  }
}

async function refreshState() {
  await BanichShared.ensureMigrated();
  currentTab = await BanichShared.getCurrentTab();
  settings = await BanichShared.getSettings();
  rules = await BanichShared.getRules();
  syncGlobalButtons();
  renderCurrentSite();
  renderRules();
  syncRuleTypeUi();
}

async function handleGlobalToggle(settingKey) {
  const nextSettings = {
    ...settings,
    [settingKey]: !settings[settingKey]
  };

  if (!nextSettings.fontEnabled && !nextSettings.rtlEnabled) {
    setMessage('حداقل یکی از گزینه‌های فونت یا RTL باید روشن بماند.', 'warning');
    return;
  }

  settings = await BanichShared.saveSettings(nextSettings);
  syncGlobalButtons();
  await notifyManagedTabsRefresh();
  setMessage('تنظیمات پیش‌فرض ذخیره شد.', 'success');
}

async function addExactRule(type) {
  const pattern = getCurrentExactPattern();
  if (!pattern) {
    setMessage('برای این تب نمی‌توان قانون ساخت.', 'warning');
    return;
  }

  if (type === 'allow') {
    const granted = await BanichShared.requestPatternPermission(pattern);
    if (!granted) {
      setMessage('مجوز دامنه تأیید نشد.', 'warning');
      return;
    }
  }

  await BanichShared.upsertRule({
    type,
    pattern,
    fontEnabled: 'inherit',
    rtlEnabled: 'inherit'
  });

  await notifyPattern(pattern);
  await refreshState();
  setMessage(type === 'allow' ? 'قانون allow برای این سایت ثبت شد.' : 'این سایت به فهرست استثنا اضافه شد.', 'success');
}

async function removeRule(rule) {
  await BanichShared.removeRule(rule.id);
  if (rule.type === 'allow' && !await BanichShared.isPermissionPatternStillUsed(rule.pattern, rule.id)) {
    await BanichShared.removePatternPermission(rule.pattern);
  }
  await notifyPattern(rule.pattern);
  await refreshState();
  setMessage('قانون حذف شد.', 'info');
}

async function saveRule() {
  const normalizedPattern = BanichShared.normalizePattern(patternInput.value, {
    includeSubdomains: includeSubdomains.checked
  });

  if (!normalizedPattern) {
    setMessage('دامنه یا الگوی وارد شده معتبر نیست.', 'error');
    return;
  }

  const type = ruleType.value;
  const existingRule = editingRuleId ? rules.find((rule) => rule.id === editingRuleId) : null;

  if (type === 'allow') {
    const granted = await BanichShared.requestPatternPermission(normalizedPattern);
    if (!granted) {
      setMessage('مجوز این دامنه تأیید نشد؛ بنابراین قانون ذخیره نشد.', 'warning');
      return;
    }
  }

  const savedRule = await BanichShared.upsertRule({
    id: editingRuleId || undefined,
    type,
    pattern: normalizedPattern,
    fontEnabled: type === 'allow' ? fontMode.value : 'inherit',
    rtlEnabled: type === 'allow' ? rtlMode.value : 'inherit'
  });

  if (existingRule && existingRule.type === 'allow' && existingRule.pattern !== savedRule.pattern) {
    if (!await BanichShared.isPermissionPatternStillUsed(existingRule.pattern, existingRule.id)) {
      await BanichShared.removePatternPermission(existingRule.pattern);
    }
    await notifyPattern(existingRule.pattern);
  }

  await notifyPattern(savedRule.pattern);
  await refreshState();
  resetForm();
  setMessage('قانون با موفقیت ذخیره شد.', 'success');
}

quickAllow.addEventListener('click', () => addExactRule('allow'));
quickExclude.addEventListener('click', () => addExactRule('exclude'));
fontToggle.addEventListener('click', () => handleGlobalToggle('fontEnabled'));
rtlToggle.addEventListener('click', () => handleGlobalToggle('rtlEnabled'));
reloadStateButton.addEventListener('click', async () => {
  await refreshState();
  setMessage('وضعیت از نو بارگذاری شد.', 'info');
});
resetFormButton.addEventListener('click', resetForm);
ruleType.addEventListener('change', syncRuleTypeUi);
saveRuleButton.addEventListener('click', saveRule);

refreshState().catch((error) => {
  console.error('Banich options init error:', error);
  setMessage('بارگذاری تنظیمات ناموفق بود.', 'error');
});
