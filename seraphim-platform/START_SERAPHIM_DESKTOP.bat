@echo off
setlocal
set "SERAPHIM_COMPANION_EXE=%~dp0dist\desktop\SeraphimDesktopCompanion.exe"

if exist "%SERAPHIM_COMPANION_EXE%" (
  start "" "%SERAPHIM_COMPANION_EXE%"
  exit /b 0
)

echo Seraphim Desktop Companion EXE not found.
echo Building it now via scripts\build-desktop.ps1 ...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\build-desktop.ps1"
if errorlevel 1 (
  echo Build failed. Install Node.js and .NET 9 SDK, then re-run this file.
  pause
  exit /b 1
)

if exist "%SERAPHIM_COMPANION_EXE%" (
  start "" "%SERAPHIM_COMPANION_EXE%"
  exit /b 0
)

echo Build finished but EXE is still missing.
pause
exit /b 1
