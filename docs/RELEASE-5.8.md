# Banich 5.8

- JSON manifests repaired; version synchronized at 5.8.
- Content script owns font/RTL CSS. Popup persists site settings; storage changes update already-loaded content scripts in matching tabs and permitted frames.
- Frame settings use top-level tab origin, including cross-origin frames where content scripts may run.
- All frames and matching about:blank frames enabled.
- Vazirmatn, Black Ops One and Harmattan bundled locally with OFL licenses; no remote font requests.
- Common icon-font classes, SVG and code elements excluded from font override.
- RTL explicitly sets direction: rtl and text-align: right on text targets; email, password, URL and telephone inputs retain native direction.
- Popup injects content.js into already-open tabs with duplicate-listener guard, requires main-frame apply acknowledgment, and falls back to main-frame injection if an inaccessible frame blocks all-frame injection.
- Popup and Firefox background use browser Promise APIs where available. Icon messaging errors are isolated; apply errors appear in popup.
- Checkbox label, row and keyboard changes use same handler.
- Firefox toolbar icon refreshes after navigation.

## Pending

Handwriting font requires exact name or repository link. Virgil was not a confirmed choice and lacks Persian coverage. Current package uses Vazirmatn.

## Checks

Run `node tools/check.cjs`, `node --check` on root JavaScript files, and `npx --yes web-ext lint --source-dir dist/banich-firefox --output json`.

Firefox lint: zero errors; two compatibility warnings for data_collection_permissions with minimum Firefox 102 (key supported from desktop 140 / Android 142). Minimum version retained; actual installation and browser behavior require browser verification.

## Install

Chrome: chrome://extensions, Developer mode, Load unpacked, select dist/banich-chrome.
Firefox: about:debugging, This Firefox, Load Temporary Add-on, select dist/banich-firefox/manifest.json. Persistent installation in regular Firefox requires a signed add-on.

## Coverage

Already-open tabs receive content script when a toggle is used. Protected browser pages, canvas text and closed shadow roots are outside CSS coverage. Site CSP or nonstandard icon fonts may still affect rendering.
