// Run: node tools/check.cjs. Browser behavior: serve root, open tools/check-browser.html.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
for (const file of ['manifest.json', 'manifest-firefox.json', 'dist/banich-chrome/manifest.json', 'dist/banich-firefox/manifest.json']) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
  assert.equal(manifest.version, '6.0');
  assert.equal(manifest.content_scripts[0].all_frames, true);
}
for (const file of ['content.js', 'popup.js']) {
  for (const browser of ['chrome', 'firefox']) {
    assert.equal(fs.readFileSync(path.join(root, file), 'utf8'), fs.readFileSync(path.join(root, 'dist/banich-' + browser, file), 'utf8'));
  }
}
assert.ok(fs.existsSync(path.join(__dirname, 'check-browser.html')));
assert.equal(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8').includes('5.9'), false);
assert.equal(fs.readFileSync(path.join(root, 'popup.html'), 'utf8').includes('5.9'), false);
console.log('PASS: 6.0 manifests, built source, and version text match. Open tools/check-browser.html for DOM/layout regression checks.');
