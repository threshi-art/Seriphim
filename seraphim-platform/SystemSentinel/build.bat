@echo off
REM SystemSentinel - One-Click Build
REM Just double-click this file to build everything

powershell.exe -ExecutionPolicy Bypass -File "%~dp0scripts\build.ps1"
pause

