# Launch Seraphim Desktop Companion (mock-only WebView2 host).
# For the legacy Red local-agent on :8767, see LOCAL_AGENT.md (out of MVP scope).

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$companionExe = Join-Path $projectRoot "dist\desktop\SeraphimDesktopCompanion.exe"
$buildScript = Join-Path $projectRoot "scripts\build-desktop.ps1"

if (-not (Test-Path $companionExe)) {
    Write-Host "Companion EXE missing. Building via build-desktop.ps1 ..." -ForegroundColor Yellow
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $buildScript
}

if (-not (Test-Path $companionExe)) {
    throw "SeraphimDesktopCompanion.exe not found after build: $companionExe"
}

Write-Host "Starting Seraphim Desktop Companion (MOCK only) ..." -ForegroundColor Cyan
Start-Process $companionExe | Out-Null
Write-Host "Launched: $companionExe" -ForegroundColor Green
