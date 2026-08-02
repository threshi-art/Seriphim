# Build and publish Seraphim Desktop Companion as a one-click Windows EXE.
# Output: dist\desktop\SeraphimDesktopCompanion.exe (+ wwwroot)

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$companionUi = Join-Path $projectRoot "seraphim_desktop_companion"
$companionUiDist = Join-Path $companionUi "dist"
$desktopProjectDir = Join-Path $projectRoot "desktop\SeraphimDesktopCompanion"
$desktopProject = Join-Path $desktopProjectDir "SeraphimDesktopCompanion.csproj"
$wwwroot = Join-Path $desktopProjectDir "wwwroot"
$publishDir = Join-Path $projectRoot "dist\desktop"
$legacyLauncherProject = Join-Path $projectRoot "desktop\SeraphimDesktopLauncher\SeraphimDesktopLauncher.csproj"

function Find-CommandPath {
    param([string]$Name)
    $cmd = Get-Command $Name -ErrorAction SilentlyContinue
    if ($cmd) {
        return $cmd.Source
    }
    return $null
}

function Copy-RepoDocs {
    param([string]$WwwrootPath)

    $repoDocs = Join-Path $WwwrootPath "repo-docs"
    if (Test-Path $repoDocs) {
        Remove-Item $repoDocs -Recurse -Force
    }
    New-Item -ItemType Directory -Path $repoDocs -Force | Out-Null

    Copy-Item -Path (Join-Path $projectRoot "docs") -Destination (Join-Path $repoDocs "docs") -Recurse -Force
    Copy-Item -Path (Join-Path $projectRoot "AGENTS.md") -Destination $repoDocs -Force
    Copy-Item -Path (Join-Path $projectRoot "SERAPHIM_WHITE_PAPER.md") -Destination $repoDocs -Force

    $bridgeDir = Join-Path $repoDocs "seraphim_local_bridge"
    New-Item -ItemType Directory -Path $bridgeDir -Force | Out-Null
    foreach ($name in @("main.py", "workspace_guard.py", "audit.py", "requirements.txt")) {
        Copy-Item -Path (Join-Path $projectRoot "seraphim_local_bridge\$name") -Destination $bridgeDir -Force
    }
}

function Invoke-Pnpm {
    param(
        [string[]]$PnpmArgs,
        [string]$WorkingDirectory
    )

    $pnpm = Find-CommandPath "pnpm"
    if ($pnpm) {
        Push-Location $WorkingDirectory
        try {
            & $pnpm @PnpmArgs
            if ($LASTEXITCODE -ne 0) {
                throw "pnpm $($PnpmArgs -join ' ') failed with exit code $LASTEXITCODE"
            }
        }
        finally {
            Pop-Location
        }
        return
    }

    $npm = Find-CommandPath "npm"
    if ($npm) {
        Push-Location $WorkingDirectory
        try {
            if ($PnpmArgs[0] -eq "install") {
                & npm install
            }
            elseif ($PnpmArgs[0] -eq "build") {
                & npm run build
            }
            else {
                & npm @PnpmArgs
            }
            if ($LASTEXITCODE -ne 0) {
                throw "npm $($PnpmArgs -join ' ') failed with exit code $LASTEXITCODE"
            }
        }
        finally {
            Pop-Location
        }
        return
    }

    $localPnpm = Join-Path $projectRoot "node_modules\.bin\pnpm.cmd"
    if (Test-Path $localPnpm) {
        Push-Location $WorkingDirectory
        try {
            & $localPnpm @PnpmArgs
            if ($LASTEXITCODE -ne 0) {
                throw "local pnpm $($PnpmArgs -join ' ') failed with exit code $LASTEXITCODE"
            }
        }
        finally {
            Pop-Location
        }
        return
    }

    throw "Neither pnpm nor npm was found. Install Node.js, then re-run scripts\build-desktop.ps1"
}

Write-Host "==> Preparing Desktop Companion UI" -ForegroundColor Cyan

# Packaged wwwroot already contains a full mock cockpit (vanilla JS) so the EXE
# works without Node. If Node/pnpm is available, optionally replace with the React build.
$useReactBuild = $false
try {
    if (Test-Path (Join-Path $companionUi "package.json")) {
        Invoke-Pnpm -PnpmArgs @("install") -WorkingDirectory $companionUi
        Invoke-Pnpm -PnpmArgs @("build") -WorkingDirectory $companionUi
        if (Test-Path (Join-Path $companionUiDist "index.html")) {
            $useReactBuild = $true
        }
    }
}
catch {
    Write-Host "React UI build skipped: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "Using packaged wwwroot cockpit instead." -ForegroundColor Yellow
}

if ($useReactBuild) {
    Write-Host "==> Staging React build into wwwroot" -ForegroundColor Cyan
    if (Test-Path $wwwroot) {
        Remove-Item $wwwroot -Recurse -Force
    }
    New-Item -ItemType Directory -Path $wwwroot | Out-Null
    Copy-Item -Path (Join-Path $companionUiDist "*") -Destination $wwwroot -Recurse -Force
    Copy-RepoDocs -WwwrootPath $wwwroot
}
elseif (-not (Test-Path (Join-Path $wwwroot "index.html"))) {
    throw "Missing desktop\SeraphimDesktopCompanion\wwwroot\index.html"
}
else {
    Write-Host "==> Using packaged wwwroot cockpit" -ForegroundColor Cyan
    Copy-RepoDocs -WwwrootPath $wwwroot
}

$dotnet = Find-CommandPath "dotnet"
if (-not $dotnet) {
    throw "dotnet SDK was not found. Install .NET 9 SDK to publish the EXE."
}

Write-Host "==> Publishing SeraphimDesktopCompanion.exe" -ForegroundColor Cyan
New-Item -ItemType Directory -Path $publishDir -Force | Out-Null

& dotnet publish $desktopProject `
    -c Release `
    -r win-x64 `
    --self-contained true `
    -p:PublishSingleFile=true `
    -p:IncludeNativeLibrariesForSelfExtract=true `
    -p:DebugType=None `
    -p:DebugSymbols=false `
    -o $publishDir

if ($LASTEXITCODE -ne 0) {
    throw "dotnet publish failed for SeraphimDesktopCompanion"
}

$publishedWwwroot = Join-Path $publishDir "wwwroot"
if (Test-Path $publishedWwwroot) {
    Remove-Item $publishedWwwroot -Recurse -Force
}
New-Item -ItemType Directory -Path $publishedWwwroot | Out-Null
Copy-Item -Path (Join-Path $wwwroot "*") -Destination $publishedWwwroot -Recurse -Force
Copy-RepoDocs -WwwrootPath $publishedWwwroot

$companionExe = Join-Path $publishDir "SeraphimDesktopCompanion.exe"
if (-not (Test-Path $companionExe)) {
    throw "Expected output missing: $companionExe"
}

# Optional: also publish the legacy web+agent launcher for operators who still use it.
if ($env:SERAPHIM_PUBLISH_LEGACY_LAUNCHER -eq "1" -and (Test-Path $legacyLauncherProject)) {
    Write-Host "==> Publishing legacy SeraphimDesktopLauncher.exe" -ForegroundColor DarkCyan
    & dotnet publish $legacyLauncherProject `
        -c Release `
        -r win-x64 `
        --self-contained false `
        -p:PublishSingleFile=true `
        -p:DebugType=None `
        -p:DebugSymbols=false `
        -o $publishDir
}

Write-Host ""
Write-Host "One-click Desktop Companion ready:" -ForegroundColor Green
Write-Host $companionExe -ForegroundColor Cyan
Write-Host "UI assets:" -ForegroundColor Green
Write-Host $publishedWwwroot -ForegroundColor Cyan
Write-Host ""
Write-Host "Double-click SeraphimDesktopCompanion.exe to open the cockpit." -ForegroundColor Yellow
Write-Host "MOCK execution only. No real shell/file tools are enabled." -ForegroundColor Yellow
