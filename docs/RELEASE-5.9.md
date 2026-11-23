# Banich 5.9

Paragraph-level Arabic-script detection. First strong letter determines paragraph language. Persian, Arabic, Sorani Kurdish, Dari and Pashto paragraphs become RTL/right-aligned as whole blocks; English paragraphs remain LTR. Inline words are not classified separately.

List fix: Arabic-script list items receive RTL on their own `<li>`, moving `::marker` to the right. Nested list items are evaluated independently; English items stay LTR. List containers and flex/grid layout containers keep original direction. Text inside headings/lists with inline links remains eligible.

No inline wrappers or text-node replacement. Dynamic content uses 200ms coalesced scanning. Observer disconnects during attribute updates to prevent mutation loops. Font applies only to Arabic-script paragraphs/items and uses bundled Vazirmatn.

Excluded: icons, SVG, canvas, code, rich-text editors and technical input types. Protected browser pages and closed shadow roots remain outside coverage.

Checks passed: `node --check content.js`; `node tools/check.cjs`; browser regression test including list marker direction, nested mixed-language lists, mixed paragraphs, stable DOM, dynamic content, fixed layout position and disable restoration; Firefox web-ext lint has zero errors and two existing minimum-version warnings for `data_collection_permissions`.

Install: reload extension from `dist/banich-chrome` or `dist/banich-firefox`, then refresh existing pages once.
