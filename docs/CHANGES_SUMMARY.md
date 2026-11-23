# خلاصه تغییرات Banich v6.0

## قابلیت‌ها
- دو کلید مستقل فونت و راست‌چین با ذخیرهٔ جداگانه برای هر origin.
- تشخیص زبان در سطح پاراگراف: فارسی، عربی، کردی سورانی، دری و پشتو راست‌چین؛ پاراگراف انگلیسی بدون تغییر.
- جهت هر مورد فهرست مستقل از زیر‌فهرست‌ها؛ علامت و شمارهٔ موارد فارسی سمت راست.
- جهت پنجره‌ها، منوها و containerهای flex/grid حفظ می‌شود.
- فونت وزیرمتن محلی با محدودهٔ نویسه‌های عربی؛ لاتین در متن ترکیبی با فونت اصلی می‌ماند.
- متن داینامیک و ورودی‌ها پشتیبانی می‌شوند؛ آیکون‌ها، SVG، canvas، کد و ویرایشگرهای rich-text مستثنا هستند.
- بدون spanسازی متن؛ اسکن با فاصلهٔ ۲۰۰ میلی‌ثانیه و بدون حلقهٔ mutation.
- چهار تم popup، انیمیشن راکت و آیکون متحرک نوار ابزار.

## ساختار
```
manifest.json            Chrome MV3
manifest-firefox.json    Firefox MV2
popup.html / popup.js    رابط و کلیدها
content.js               تشخیص پاراگراف و فهرست
background.js            آیکون Chrome
background-firefox.js    آیکون Firefox
fonts/                   وزیرمتن، Black Ops One، Harmattan + مجوزهای OFL
icons/                   آیکون‌های ثابت PNG
build.bat                ساخت خروجی دو مرورگر
dist/banich-chrome       خروجی کروم
dist/banich-firefox      خروجی فایرفاکس
tools/check.cjs          بررسی نسخه و خروجی‌ها
tools/check-browser.html تست رفتاری مرورگر
docs/                    مستندات نسخه
```

## نصب
- Chrome: `chrome://extensions` → Developer mode → Load unpacked → `dist/banich-chrome`
- Firefox: `about:debugging` → This Firefox → Load Temporary Add-on → `dist/banich-firefox/manifest.json`

## تست
```
node tools/check.cjs
node --check content.js
```
تست رفتاری: پوشهٔ ریشه را با سرور محلی سرو کنید و `tools/check-browser.html` را باز کنید.

## نکات فنی
- ذخیره‌سازی per-origin با کلید `banich_<origin>`.
- پیام‌ها: `BANICH_ORIGIN`، `BANICH_APPLY`، `BANICH_UPDATE`.
- فونت‌ها و مجوزها محلی‌اند؛ درخواست فونت خارجی وجود ندارد.
- Chrome از MV3 و OffscreenCanvas استفاده می‌کند؛ Firefox از MV2 و canvas صفحهٔ background.
- محدودیت‌ها: صفحات محافظت‌شدهٔ مرورگر، متن canvas و closed shadow roots.

**توسعه‌دهنده:** شوان  
**نسخه:** 6.0
