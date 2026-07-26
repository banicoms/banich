const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'content.js'), 'utf8');

function createElement(tagName, documentRef) {
  return {
    tagName: tagName.toUpperCase(),
    id: '',
    rel: '',
    type: '',
    href: '',
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = String(value);
      if (name === 'href') {
        this.href = String(value);
      }
    },
    getAttribute(name) {
      if (name === 'href') {
        return this.href || null;
      }
      return this.attributes[name] ?? null;
    },
    remove() {
      if (this.id) {
        delete documentRef.elements[this.id];
      }
      this.removed = true;
    }
  };
}

function createDocument() {
  const documentRef = {
    elements: {},
    documentElement: {
      attrs: {},
      appendChild(node) {
        if (node.id) {
          documentRef.elements[node.id] = node;
        }
      },
      setAttribute(name, value) {
        this.attrs[name] = String(value);
      },
      removeAttribute(name) {
        delete this.attrs[name];
      },
      getAttribute(name) {
        return this.attrs[name] ?? null;
      }
    },
    head: {
      appendChild(node) {
        if (node.id) {
          documentRef.elements[node.id] = node;
        }
      }
    },
    createElement(tagName) {
      return createElement(tagName, documentRef);
    },
    getElementById(id) {
      return documentRef.elements[id] || null;
    }
  };

  return documentRef;
}

const sandbox = {
  URL,
  console,
  location: { host: 'example.com' },
  window: { location: { host: 'example.com' } }
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'content.js' });

const shared = sandbox.BanichShared;
assert.ok(shared, 'BanichShared should be attached to global scope');

function normalize(value) {
  return JSON.parse(JSON.stringify(value));
}

assert.deepEqual(normalize(shared.sanitizeSettings({})), { fontEnabled: true, rtlEnabled: true });
assert.deepEqual(normalize(shared.sanitizeSettings({ fontEnabled: false, rtlEnabled: true })), { fontEnabled: false, rtlEnabled: true });
assert.deepEqual(normalize(shared.sanitizeSettings({ fontEnabled: false, rtlEnabled: false })), { fontEnabled: true, rtlEnabled: false });

assert.equal(shared.normalizePattern('example.com'), '*://example.com/*');
assert.equal(shared.normalizePattern('example.com', { includeSubdomains: true }), '*://*.example.com/*');
assert.equal(shared.normalizePattern('*.example.com'), '*://*.example.com/*');
assert.equal(shared.normalizePattern('https://example.com/path?a=1'), 'https://example.com/*');
assert.equal(shared.matchUrlPattern('*://*.example.com/*', 'https://a.example.com/path'), true);
assert.equal(shared.matchUrlPattern('*://*.example.com/*', 'https://example.net/path'), false);

assert.equal(shared.isSupportedUrl('https://example.com/path'), true);
assert.equal(shared.isSupportedUrl('http://example.com/path'), true);
assert.equal(shared.isSupportedUrl('chrome://extensions'), false);
assert.equal(shared.isSupportedUrl('file:///tmp/test.html'), false);
assert.equal(shared.getOriginFromUrl('https://example.com/path?q=1'), 'https://example.com');
assert.equal(shared.getOriginFromUrl('chrome://extensions'), null);
assert.equal(shared.getOriginPattern('https://example.com'), 'https://example.com/*');
assert.equal(shared.getExactPatternForUrl('https://example.com/test'), 'https://example.com/*');
assert.equal(shared.getDisplayHost('https://sub.example.com/path'), 'sub.example.com');

const allowRule = shared.sanitizeRule({ type: 'allow', pattern: 'example.com', fontEnabled: 'off', rtlEnabled: 'on' });
assert.equal(allowRule.type, 'allow');
assert.equal(allowRule.pattern, '*://example.com/*');
assert.equal(allowRule.fontEnabled, 'off');
assert.equal(allowRule.rtlEnabled, 'on');

const excludeRule = shared.sanitizeRule({ type: 'exclude', pattern: '*.example.com' });
assert.equal(excludeRule.type, 'exclude');
assert.equal(excludeRule.fontEnabled, 'inherit');
assert.equal(excludeRule.rtlEnabled, 'inherit');

const documentRef = createDocument();
sandbox.document = documentRef;

shared.setPageState('chrome-extension://banich/page.css', {
  enabled: true,
  fontEnabled: true,
  rtlEnabled: false,
  styleId: shared.STYLE_LINK_ID,
  attrs: shared.ATTRS
});

assert.equal(documentRef.documentElement.getAttribute(shared.ATTRS.active), 'on');
assert.equal(documentRef.documentElement.getAttribute(shared.ATTRS.font), 'on');
assert.equal(documentRef.documentElement.getAttribute(shared.ATTRS.rtl), 'off');
assert.ok(documentRef.getElementById(shared.STYLE_LINK_ID), 'style link should be injected');
assert.equal(documentRef.getElementById(shared.STYLE_LINK_ID).href, 'chrome-extension://banich/page.css');

shared.setPageState('chrome-extension://banich/page.css', {
  enabled: false,
  fontEnabled: true,
  rtlEnabled: true,
  styleId: shared.STYLE_LINK_ID,
  attrs: shared.ATTRS
});

assert.equal(documentRef.documentElement.getAttribute(shared.ATTRS.active), null);
assert.equal(documentRef.getElementById(shared.STYLE_LINK_ID), null, 'style link should be removed');

console.log('Unit checks passed.');
