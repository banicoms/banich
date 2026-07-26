const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function exists(file) {
  return fs.existsSync(path.join(root, file));
}

function checkSyntax(file) {
  execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' });
}

const manifest = JSON.parse(read('manifest.json'));
assert.equal(manifest.version, '4.0.1', 'manifest version must be 4.0.1');
assert.ok(!manifest.content_scripts, 'v4.0.1 should not register a global content script');
assert.deepEqual(manifest.optional_host_permissions, ['http://*/*', 'https://*/*']);
assert.deepEqual(manifest.permissions, ['scripting', 'storage', 'tabs']);
assert.equal(manifest.options_ui.page, 'options.html');

const requiredFiles = [
  'README.md',
  'background.js',
  'content.js',
  'page.css',
  'popup.html',
  'popup.css',
  'popup.js',
  'options.html',
  'options.css',
  'options.js',
  'package.json',
  'assets/fonts/Vazirmatn[wght].woff2',
  'assets/fonts/OFL.txt',
  'scripts/lint.js',
  'scripts/test.js'
];

for (const file of requiredFiles) {
  assert.ok(exists(file), `missing required file: ${file}`);
}

for (const file of ['background.js', 'content.js', 'popup.js', 'options.js', 'scripts/lint.js', 'scripts/test.js']) {
  checkSyntax(file);
}

const popupHtml = read('popup.html');
const popupCss = read('popup.css');
const optionsHtml = read('options.html');
const optionsCss = read('options.css');
const pageCss = read('page.css');

assert.ok(!/fonts\.googleapis\.com/i.test(popupHtml + popupCss + optionsHtml + optionsCss + pageCss), 'remote Google Fonts should not be referenced');
assert.ok(/BanicomVPN|t\.me\/BanicomVPN/i.test(popupHtml), 'popup advertisement should exist');
assert.ok(/content\.js/.test(popupHtml) && /content\.js/.test(optionsHtml), 'popup and options should load shared helper library');
assert.ok(/options\.html/.test(JSON.stringify(manifest)), 'options page should be registered in manifest');
assert.ok(Buffer.byteLength(fs.readFileSync(path.join(root, 'assets/fonts/Vazirmatn[wght].woff2'))) > 0, 'bundled font must not be empty');

console.log('Lint checks passed.');
