(function attachBanichShared(global) {
  'use strict';

  const SETTINGS_KEY = 'banich_settings_v401';
  const RULES_KEY = 'banich_rules_v401';
  const AD_SEEN_KEY = 'banich_ad_seen';
  const LEGACY_SETTINGS_KEYS = ['banich_settings_v4'];
  const LEGACY_SITE_KEY_PREFIX = 'banich_site_';
  const STYLE_LINK_ID = 'banich-page-style';
  const ATTRS = Object.freeze({
    active: 'data-banich',
    font: 'data-banich-font',
    rtl: 'data-banich-rtl'
  });
  const DEFAULT_SETTINGS = Object.freeze({
    fontEnabled: true,
    rtlEnabled: true
  });
  const DEFAULT_RULE = Object.freeze({
    type: 'allow',
    fontEnabled: 'inherit',
    rtlEnabled: 'inherit'
  });
  const RULE_TYPES = new Set(['allow', 'exclude']);
  const MODE_VALUES = new Set(['inherit', 'on', 'off']);
  const RESTRICTED_PROTOCOLS = new Set([
    'about:',
    'brave:',
    'chrome:',
    'chrome-extension:',
    'devtools:',
    'edge:',
    'file:',
    'moz-extension:',
    'opera:',
    'view-source:'
  ]);
  const RESTRICTED_HOSTS = new Set([
    'chromewebstore.google.com',
    'addons.mozilla.org'
  ]);

  let migrationPromise = null;

  function parseUrl(url) {
    try {
      return new URL(url);
    } catch {
      return null;
    }
  }

  function getRestrictionReason(url) {
    const parsed = parseUrl(url);
    if (!parsed) {
      return 'نشانی این صفحه قابل شناسایی نیست.';
    }

    if (RESTRICTED_PROTOCOLS.has(parsed.protocol)) {
      return 'بانیچ فقط روی سایت‌های معمولی HTTP/HTTPS اجرا می‌شود.';
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return 'بانیچ فقط روی صفحه‌های وب معمولی پشتیبانی می‌شود.';
    }

    if (RESTRICTED_HOSTS.has(parsed.hostname)) {
      return 'مرورگر اجازه اجرای افزونه روی این صفحه را نمی‌دهد.';
    }

    return '';
  }

  function isSupportedUrl(url) {
    return getRestrictionReason(url) === '';
  }

  function getDisplayHost(url) {
    const parsed = parseUrl(url);
    if (!parsed) {
      return 'صفحه ناشناس';
    }

    if (parsed.protocol === 'file:') {
      return 'فایل محلی';
    }

    return parsed.host || parsed.protocol.replace(':', '');
  }

  function getOriginFromUrl(url) {
    const parsed = parseUrl(url);
    if (!parsed || !isSupportedUrl(url)) {
      return null;
    }

    return parsed.origin;
  }

  function getOriginPattern(origin) {
    const parsed = parseUrl(origin);
    if (!parsed || !['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    return `${parsed.protocol}//${parsed.host}/*`;
  }

  function getExactPatternForUrl(url) {
    const origin = getOriginFromUrl(url);
    return origin ? getOriginPattern(origin) : null;
  }

  function normalizePattern(input, options = {}) {
    if (typeof input !== 'string') {
      return null;
    }

    const trimmed = input.trim();
    if (!trimmed) {
      return null;
    }

    const includeSubdomains = options.includeSubdomains === true;

    if (/^(\*|https?):\/\/[^/]+(?:\/.*)?$/i.test(trimmed)) {
      const match = trimmed.match(/^(\*|https?):\/\/([^/]+)(?:\/.*)?$/i);
      if (!match) {
        return null;
      }

      const scheme = match[1];
      const host = match[2].toLowerCase();
      if (!host || host === '*') {
        return null;
      }

      if (!/^([*.a-z0-9-]+)(:\d+)?$/i.test(host)) {
        return null;
      }

      return `${scheme}://${host}/*`;
    }

    if (/^[a-z]+:\/\//i.test(trimmed)) {
      const parsed = parseUrl(trimmed);
      if (!parsed || !['http:', 'https:'].includes(parsed.protocol)) {
        return null;
      }
      return `${parsed.protocol}//${parsed.host}/*`;
    }

    const normalizedHost = trimmed
      .replace(/^https?:\/\//i, '')
      .replace(/\/.*$/, '')
      .toLowerCase();

    if (!normalizedHost) {
      return null;
    }

    if (!/^([*.a-z0-9-]+)(:\d+)?$/i.test(normalizedHost)) {
      return null;
    }

    if (normalizedHost.startsWith('*.')) {
      return `*://${normalizedHost}/*`;
    }

    return includeSubdomains
      ? `*://*.${normalizedHost}/*`
      : `*://${normalizedHost}/*`;
  }

  function sanitizeMode(value) {
    return MODE_VALUES.has(value) ? value : 'inherit';
  }

  function sanitizeSettings(rawSettings) {
    const sanitized = {
      fontEnabled: DEFAULT_SETTINGS.fontEnabled,
      rtlEnabled: DEFAULT_SETTINGS.rtlEnabled
    };

    if (rawSettings && typeof rawSettings === 'object') {
      if (typeof rawSettings.fontEnabled === 'boolean') {
        sanitized.fontEnabled = rawSettings.fontEnabled;
      }
      if (typeof rawSettings.rtlEnabled === 'boolean') {
        sanitized.rtlEnabled = rawSettings.rtlEnabled;
      }
    }

    if (!sanitized.fontEnabled && !sanitized.rtlEnabled) {
      sanitized.fontEnabled = true;
    }

    return sanitized;
  }

  function createRuleId() {
    return `rule_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function sanitizeRule(rawRule) {
    if (!rawRule || typeof rawRule !== 'object') {
      return null;
    }

    const pattern = normalizePattern(rawRule.pattern);
    if (!pattern) {
      return null;
    }

    const type = RULE_TYPES.has(rawRule.type) ? rawRule.type : DEFAULT_RULE.type;
    const createdAt = Number.isFinite(rawRule.createdAt) ? rawRule.createdAt : Date.now();

    return {
      id: typeof rawRule.id === 'string' && rawRule.id.trim() ? rawRule.id.trim() : createRuleId(),
      type,
      pattern,
      fontEnabled: type === 'allow' ? sanitizeMode(rawRule.fontEnabled) : 'inherit',
      rtlEnabled: type === 'allow' ? sanitizeMode(rawRule.rtlEnabled) : 'inherit',
      createdAt
    };
  }

  function sanitizeRules(rawRules) {
    if (!Array.isArray(rawRules)) {
      return [];
    }

    const seen = new Set();
    const result = [];

    for (const rule of rawRules) {
      const sanitized = sanitizeRule(rule);
      if (!sanitized) {
        continue;
      }

      const key = `${sanitized.type}::${sanitized.pattern}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      result.push(sanitized);
    }

    return result.sort((a, b) => b.createdAt - a.createdAt);
  }

  function getPatternHost(pattern) {
    const match = pattern.match(/^(\*|https?):\/\/([^/]+)\/\*$/);
    return match ? match[2] : '';
  }

  function escapeForRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function matchPatternToRegex(pattern) {
    const match = pattern.match(/^(\*|https?):\/\/([^/]+)\/\*$/);
    if (!match) {
      return null;
    }

    const schemeSource = match[1] === '*' ? 'https?' : escapeForRegex(match[1]);
    const host = match[2].toLowerCase();
    const exactHost = host.startsWith('*.') ? host.slice(2) : host;
    const escapedExactHost = escapeForRegex(exactHost);
    const hostSource = host.startsWith('*.')
      ? `(?:[^./]+\\.)*${escapedExactHost}`
      : escapeForRegex(host);

    return new RegExp(`^${schemeSource}:\\/\\/${hostSource}(?::\\d+)?(?:\\/.*)?$`, 'i');
  }

  function matchUrlPattern(pattern, url) {
    const regex = matchPatternToRegex(pattern);
    if (!regex) {
      return false;
    }

    return regex.test(url);
  }

  function getPatternScore(pattern) {
    const match = pattern.match(/^(\*|https?):\/\/([^/]+)\/\*$/);
    if (!match) {
      return 0;
    }

    const schemeScore = match[1] === '*' ? 0 : 20;
    const host = match[2];
    const wildcardPenalty = host.startsWith('*.') ? -10 : 0;
    return schemeScore + host.length + wildcardPenalty;
  }

  function resolveMode(mode, fallback) {
    if (mode === 'on') {
      return true;
    }
    if (mode === 'off') {
      return false;
    }
    return fallback;
  }

  function findMatchingRule(rules, url, type) {
    return rules
      .filter((rule) => rule.type === type && matchUrlPattern(rule.pattern, url))
      .sort((a, b) => getPatternScore(b.pattern) - getPatternScore(a.pattern) || b.createdAt - a.createdAt)[0] || null;
  }

  async function ensureMigrated() {
    if (migrationPromise) {
      return migrationPromise;
    }

    migrationPromise = (async () => {
      const stored = await chrome.storage.local.get(null);
      const next = {};
      const removeKeys = [];
      let changed = false;

      const existingSettings = stored[SETTINGS_KEY];
      if (!existingSettings) {
        const legacySettings = LEGACY_SETTINGS_KEYS.map((key) => stored[key]).find(Boolean);
        next[SETTINGS_KEY] = sanitizeSettings(legacySettings || DEFAULT_SETTINGS);
        changed = true;
        removeKeys.push(...LEGACY_SETTINGS_KEYS.filter((key) => key in stored));
      }

      if (!Array.isArray(stored[RULES_KEY])) {
        const legacyRules = [];
        for (const [key, value] of Object.entries(stored)) {
          if (!key.startsWith(LEGACY_SITE_KEY_PREFIX) || value !== true) {
            continue;
          }

          const origin = key.slice(LEGACY_SITE_KEY_PREFIX.length);
          const pattern = getOriginPattern(origin);
          if (!pattern) {
            continue;
          }

          legacyRules.push({
            id: createRuleId(),
            type: 'allow',
            pattern,
            fontEnabled: 'inherit',
            rtlEnabled: 'inherit',
            createdAt: Date.now()
          });
          removeKeys.push(key);
        }

        next[RULES_KEY] = sanitizeRules(legacyRules);
        changed = true;
      }

      if (changed) {
        await chrome.storage.local.set(next);
      }

      if (removeKeys.length) {
        await chrome.storage.local.remove(removeKeys);
      }
    })();

    return migrationPromise;
  }

  async function getSettings() {
    await ensureMigrated();
    const stored = await chrome.storage.local.get(SETTINGS_KEY);
    return sanitizeSettings(stored[SETTINGS_KEY]);
  }

  async function saveSettings(nextSettings) {
    await ensureMigrated();
    const sanitized = sanitizeSettings(nextSettings);
    await chrome.storage.local.set({ [SETTINGS_KEY]: sanitized });
    return sanitized;
  }

  async function getRules() {
    await ensureMigrated();
    const stored = await chrome.storage.local.get(RULES_KEY);
    return sanitizeRules(stored[RULES_KEY]);
  }

  async function saveRules(nextRules) {
    await ensureMigrated();
    const sanitized = sanitizeRules(nextRules);
    await chrome.storage.local.set({ [RULES_KEY]: sanitized });
    return sanitized;
  }

  async function findRuleByPattern(pattern, type) {
    const normalizedPattern = normalizePattern(pattern);
    if (!normalizedPattern) {
      return null;
    }

    const rules = await getRules();
    return rules.find((rule) => rule.pattern === normalizedPattern && (!type || rule.type === type)) || null;
  }

  async function upsertRule(ruleInput) {
    const rule = sanitizeRule(ruleInput);
    if (!rule) {
      throw new Error('Invalid rule');
    }

    const rules = await getRules();
    const index = rules.findIndex((item) => item.id === rule.id || (item.pattern === rule.pattern && item.type === rule.type));

    if (index >= 0) {
      rules[index] = {
        ...rules[index],
        ...rule,
        id: rules[index].id,
        createdAt: rules[index].createdAt
      };
    } else {
      rules.unshift(rule);
    }

    await saveRules(rules);
    return index >= 0 ? rules[index] : rule;
  }

  async function removeRule(ruleId) {
    if (!ruleId) {
      return false;
    }

    const rules = await getRules();
    const filtered = rules.filter((rule) => rule.id !== ruleId);
    if (filtered.length === rules.length) {
      return false;
    }

    await saveRules(filtered);
    return true;
  }

  async function removeRuleByPattern(pattern, type) {
    const normalizedPattern = normalizePattern(pattern);
    if (!normalizedPattern) {
      return false;
    }

    const rules = await getRules();
    const filtered = rules.filter((rule) => !(rule.pattern === normalizedPattern && (!type || rule.type === type)));
    if (filtered.length === rules.length) {
      return false;
    }

    await saveRules(filtered);
    return true;
  }

  async function hasPatternPermission(pattern) {
    const normalizedPattern = normalizePattern(pattern);
    if (!normalizedPattern) {
      return false;
    }

    return chrome.permissions.contains({ origins: [normalizedPattern] });
  }

  async function requestPatternPermission(pattern) {
    const normalizedPattern = normalizePattern(pattern);
    if (!normalizedPattern) {
      return false;
    }

    return chrome.permissions.request({ origins: [normalizedPattern] });
  }

  async function removePatternPermission(pattern) {
    const normalizedPattern = normalizePattern(pattern);
    if (!normalizedPattern) {
      return false;
    }

    return chrome.permissions.remove({ origins: [normalizedPattern] });
  }

  async function isPermissionPatternStillUsed(pattern, ignoreRuleId) {
    const normalizedPattern = normalizePattern(pattern);
    if (!normalizedPattern) {
      return false;
    }

    const rules = await getRules();
    return rules.some((rule) => rule.type === 'allow' && rule.pattern === normalizedPattern && rule.id !== ignoreRuleId);
  }

  async function getEffectiveConfig(url) {
    await ensureMigrated();

    if (!isSupportedUrl(url)) {
      return {
        supported: false,
        enabled: false,
        blocked: false,
        reason: getRestrictionReason(url),
        fontEnabled: DEFAULT_SETTINGS.fontEnabled,
        rtlEnabled: DEFAULT_SETTINGS.rtlEnabled,
        matchedRule: null
      };
    }

    const [settings, rules] = await Promise.all([getSettings(), getRules()]);
    const excludeRule = findMatchingRule(rules, url, 'exclude');
    if (excludeRule) {
      return {
        supported: true,
        enabled: false,
        blocked: true,
        reason: 'این سایت در فهرست استثنا قرار دارد.',
        fontEnabled: settings.fontEnabled,
        rtlEnabled: settings.rtlEnabled,
        matchedRule: excludeRule
      };
    }

    const allowRule = findMatchingRule(rules, url, 'allow');
    if (!allowRule) {
      return {
        supported: true,
        enabled: false,
        blocked: false,
        reason: 'برای این سایت هنوز قانونی ثبت نشده است.',
        fontEnabled: settings.fontEnabled,
        rtlEnabled: settings.rtlEnabled,
        matchedRule: null
      };
    }

    const hasPermission = await hasPatternPermission(allowRule.pattern);
    if (!hasPermission) {
      return {
        supported: true,
        enabled: false,
        blocked: false,
        needsPermission: true,
        reason: 'قانون سایت ثبت شده اما مجوز مرورگر برای آن وجود ندارد.',
        fontEnabled: settings.fontEnabled,
        rtlEnabled: settings.rtlEnabled,
        matchedRule: allowRule
      };
    }

    let fontEnabled = resolveMode(allowRule.fontEnabled, settings.fontEnabled);
    let rtlEnabled = resolveMode(allowRule.rtlEnabled, settings.rtlEnabled);
    if (!fontEnabled && !rtlEnabled) {
      fontEnabled = true;
    }

    return {
      supported: true,
      enabled: true,
      blocked: false,
      reason: 'بانیچ برای این سایت فعال است.',
      fontEnabled,
      rtlEnabled,
      matchedRule: allowRule
    };
  }

  function setPageState(styleUrl, payload) {
    const root = document.documentElement;
    if (!root) {
      return { enabled: false };
    }

    const config = payload || {};
    const attrs = config.attrs || ATTRS;
    const styleId = config.styleId || STYLE_LINK_ID;
    const enabled = config.enabled === true;
    const fontEnabled = config.fontEnabled === true;
    const rtlEnabled = config.rtlEnabled === true;
    let link = document.getElementById(styleId);

    if (enabled) {
      root.setAttribute(attrs.active, 'on');
      root.setAttribute(attrs.font, fontEnabled ? 'on' : 'off');
      root.setAttribute(attrs.rtl, rtlEnabled ? 'on' : 'off');

      if (!link) {
        link = document.createElement('link');
        link.id = styleId;
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = styleUrl;
        (document.head || document.documentElement).appendChild(link);
      } else if (link.getAttribute('href') !== styleUrl) {
        link.setAttribute('href', styleUrl);
      }
    } else {
      root.removeAttribute(attrs.active);
      root.removeAttribute(attrs.font);
      root.removeAttribute(attrs.rtl);
      if (link) {
        link.remove();
      }
    }

    return {
      enabled,
      fontEnabled,
      rtlEnabled,
      host: window.location.host
    };
  }

  async function applyStateToTab(tabId, enabled, settings) {
    const sanitized = sanitizeSettings(settings);
    return chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      func: setPageState,
      args: [
        chrome.runtime.getURL('page.css'),
        {
          enabled,
          fontEnabled: sanitized.fontEnabled,
          rtlEnabled: sanitized.rtlEnabled,
          styleId: STYLE_LINK_ID,
          attrs: ATTRS
        }
      ]
    });
  }

  async function getCurrentTab() {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    return tabs[0] || null;
  }

  async function isAdSeen() {
    const stored = await chrome.storage.local.get(AD_SEEN_KEY);
    return stored[AD_SEEN_KEY] === true;
  }

  async function markAdSeen() {
    await chrome.storage.local.set({ [AD_SEEN_KEY]: true });
    return true;
  }

  global.BanichShared = Object.freeze({
    AD_SEEN_KEY,
    ATTRS,
    DEFAULT_SETTINGS,
    LEGACY_SITE_KEY_PREFIX,
    RULES_KEY,
    SETTINGS_KEY,
    STYLE_LINK_ID,
    applyStateToTab,
    ensureMigrated,
    findRuleByPattern,
    getCurrentTab,
    getDisplayHost,
    getEffectiveConfig,
    getExactPatternForUrl,
    getOriginFromUrl,
    getOriginPattern,
    getRestrictionReason,
    getRules,
    getSettings,
    hasPatternPermission,
    isAdSeen,
    isPermissionPatternStillUsed,
    isSupportedUrl,
    markAdSeen,
    matchUrlPattern,
    normalizePattern,
    removePatternPermission,
    removeRule,
    removeRuleByPattern,
    requestPatternPermission,
    saveRules,
    saveSettings,
    sanitizeRule,
    sanitizeRules,
    sanitizeSettings,
    setPageState,
    upsertRule
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
