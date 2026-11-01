@echo off
setlocal
cd /d "%~dp0"
set "PORT=3000"
set "FOODLY_HOST=127.0.0.1"
if not exist "node_modules\next\dist\bin\next" (
  echo Dependencies are missing. Open this folder in VS Code and run npm ci first.
  pause
  exit /b 1
)
echo Starting Foodly on this computer.
echo Leave this window open while using the website.
echo After Ready appears, open http://127.0.0.1:3000 in Chrome or Edge.
echo.
call npm run dev -- --webpack
echo.
echo Foodly has stopped. Any startup error is shown above.
pause
