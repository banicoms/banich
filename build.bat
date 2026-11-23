@echo off
setlocal
set ROOT=%~dp0
set DIST=%ROOT%dist

if not exist "%DIST%\banich-chrome\icons"  mkdir "%DIST%\banich-chrome\icons"
if not exist "%DIST%\banich-firefox\icons"  mkdir "%DIST%\banich-firefox\icons"

rem ---- Chrome (MV3) ----
copy /y "%ROOT%manifest.json"      "%DIST%\banich-chrome\manifest.json"      >nul
copy /y "%ROOT%popup.html"         "%DIST%\banich-chrome\popup.html"         >nul
copy /y "%ROOT%popup.js"           "%DIST%\banich-chrome\popup.js"           >nul
copy /y "%ROOT%content.js"         "%DIST%\banich-chrome\content.js"         >nul
copy /y "%ROOT%background.js"      "%DIST%\banich-chrome\background.js"      >nul
copy /y "%ROOT%icons\icon16.png"   "%DIST%\banich-chrome\icons\icon16.png"   >nul
copy /y "%ROOT%icons\icon32.png"   "%DIST%\banich-chrome\icons\icon32.png"   >nul
copy /y "%ROOT%icons\icon48.png"   "%DIST%\banich-chrome\icons\icon48.png"   >nul
copy /y "%ROOT%icons\icon128.png"  "%DIST%\banich-chrome\icons\icon128.png"  >nul

rem ---- Firefox (MV2) ----
copy /y "%ROOT%manifest-firefox.json" "%DIST%\banich-firefox\manifest.json"  >nul
copy /y "%ROOT%popup.html"            "%DIST%\banich-firefox\popup.html"     >nul
copy /y "%ROOT%popup.js"              "%DIST%\banich-firefox\popup.js"       >nul
copy /y "%ROOT%content.js"            "%DIST%\banich-firefox\content.js"     >nul
copy /y "%ROOT%background-firefox.js" "%DIST%\banich-firefox\background-firefox.js" >nul
copy /y "%ROOT%icons\icon16.png"      "%DIST%\banich-firefox\icons\icon16.png"  >nul
copy /y "%ROOT%icons\icon32.png"      "%DIST%\banich-firefox\icons\icon32.png"  >nul
copy /y "%ROOT%icons\icon48.png"      "%DIST%\banich-firefox\icons\icon48.png"  >nul
copy /y "%ROOT%icons\icon128.png"     "%DIST%\banich-firefox\icons\icon128.png" >nul

rem ---- Local fonts and licenses ----
xcopy /e /i /y "%ROOT%fonts" "%DIST%\banich-chrome\fonts" >nul
if errorlevel 1 exit /b 1
xcopy /e /i /y "%ROOT%fonts" "%DIST%\banich-firefox\fonts" >nul
if errorlevel 1 exit /b 1

echo.
echo  Build OK!
echo.
echo  Chrome  : chrome://extensions  -^> Developer mode ON -^> Load unpacked -^> "%DIST%\banich-chrome"
echo  Firefox : about:debugging -^> This Firefox -^> Load Temporary Add-on... -^> "%DIST%\banich-firefox\manifest.json"
echo.
pause
