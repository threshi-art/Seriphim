# SystemSentinel - Fully Automated Build Pipeline
# Zero manual intervention required - handles everything automatically

$ErrorActionPreference = "Stop"

function Remove-DirectoryRobust {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PathToRemove
    )

    if (-not (Test-Path $PathToRemove)) {
        return
    }

    try {
        Remove-Item $PathToRemove -Recurse -Force -ErrorAction Stop
        return
    } catch {
        $tempEmpty = Join-Path $env:TEMP "SystemSentinel-empty-$(Get-Random)"
        New-Item -ItemType Directory -Path $tempEmpty -Force | Out-Null
        robocopy $tempEmpty $PathToRemove /MIR /NFL /NDL /NJH /NJS /NP | Out-Null
        Remove-Item $PathToRemove -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item $tempEmpty -Recurse -Force -ErrorAction SilentlyContinue

        if (Test-Path $PathToRemove) {
            throw "Unable to remove directory: $PathToRemove"
        }
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SystemSentinel - Automated Build" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Auto-configure Java environment
Write-Host "[1/8] Configuring Java..." -ForegroundColor Yellow
try {
    $javaCmd = Get-Command java -ErrorAction Stop
    $jdkHome = Split-Path (Split-Path $javaCmd.Source)
    $env:JAVA_HOME = $jdkHome
    $jpackageExe = Join-Path $jdkHome "bin\jpackage.exe"
    
    if (-not (Test-Path $jpackageExe)) {
        throw "jpackage not found"
    }
    Write-Host "       [OK] Java configured" -ForegroundColor Green
} catch {
    Write-Host "       [ERROR] Java/jpackage not found" -ForegroundColor Red
    exit 1
}

# Step 2: Clean target directory (handles recursive structures)
Write-Host "[2/8] Cleaning target directory..." -ForegroundColor Yellow
Get-Process SystemSentinel -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
if (Test-Path "target") {
    try {
        Remove-DirectoryRobust "target"
        Write-Host "       [OK] Cleaned (standard)" -ForegroundColor Green
    } catch {
        Write-Host "       [WARNING] Partial clean, continuing..." -ForegroundColor Yellow
    }
} else {
    Write-Host "       [OK] Already clean" -ForegroundColor Green
}

# Step 3: Verify Maven Wrapper
Write-Host "[3/8] Verifying Maven Wrapper..." -ForegroundColor Yellow
$mvnwPath = Join-Path $PWD "mvnw.cmd"
if (-not (Test-Path $mvnwPath)) {
    Write-Host "       [ERROR] mvnw.cmd not found" -ForegroundColor Red
    exit 1
}
Write-Host "       [OK] Maven Wrapper ready" -ForegroundColor Green

# Step 4: Build JAR
Write-Host "[4/8] Building JAR..." -ForegroundColor Yellow
Write-Host "       (This may take a few minutes...)" -ForegroundColor Gray
try {
    & $mvnwPath package -DskipTests
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }
    Write-Host "       [OK] JAR built successfully" -ForegroundColor Green
} catch {
    Write-Host "       [ERROR] Build failed" -ForegroundColor Red
    exit 1
}

# Step 5: Verify JAR
Write-Host "[5/8] Verifying JAR..." -ForegroundColor Yellow
$jarFile = Get-ChildItem -Path "target" -Filter "SystemSentinel-*.jar" -ErrorAction SilentlyContinue | 
    Where-Object { $_.Name -notlike "*-javadoc.jar" -and $_.Name -notlike "*-sources.jar" } | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 1

if (-not $jarFile) {
    Write-Host "       ✗ ERROR: JAR not found" -ForegroundColor Red
    exit 1
}
$jarSizeMB = [math]::Round($jarFile.Length / 1MB, 2)
    Write-Host "       JAR verified ($jarSizeMB MB)" -ForegroundColor Green

# Step 6: Prepare resources
Write-Host "[6/8] Preparing resources..." -ForegroundColor Yellow
$packageInputDir = "target\package-input"
$outputDir = "target\exe"
if (Test-Path $outputDir) {
    Remove-DirectoryRobust $outputDir
}
if (Test-Path $packageInputDir) {
    Remove-DirectoryRobust $packageInputDir
}
New-Item -ItemType Directory -Path $packageInputDir -Force | Out-Null

Copy-Item $jarFile.FullName (Join-Path $packageInputDir $jarFile.Name) -Force

foreach ($resourceDirectory in @("scripts", "assets")) {
    $targetPath = Join-Path $packageInputDir $resourceDirectory
    if (Test-Path $resourceDirectory) {
        if (Test-Path $targetPath) {
            Remove-Item $targetPath -Recurse -Force -ErrorAction SilentlyContinue
        }
        Copy-Item $resourceDirectory $targetPath -Recurse -Force -ErrorAction SilentlyContinue | Out-Null
    }
}
Write-Host "       [OK] Resources prepared" -ForegroundColor Green

# Step 7: Create executable
Write-Host "[7/8] Creating executable..." -ForegroundColor Yellow
Write-Host "       (This may take several minutes...)" -ForegroundColor Gray
$jpackageArgs = @(
    "--input", $packageInputDir,
    "--name", "SystemSentinel",
    "--main-jar", $jarFile.Name,
    "--main-class", "ui.Launcher",
    "--type", "app-image",
    "--dest", $outputDir,
    "--app-version", "1.0.0",
    "--description", "System Sentinel - Local Integrity Console",
    "--vendor", "SystemSentinel"
)

try {
    & $jpackageExe @jpackageArgs
    if ($LASTEXITCODE -ne 0) {
        throw "jpackage failed"
    }
    Write-Host "       [OK] Executable created" -ForegroundColor Green
} catch {
    Write-Host "       [ERROR] Executable creation failed" -ForegroundColor Red
    exit 1
}

# Step 8: Verify executable
Write-Host "[8/8] Verifying executable..." -ForegroundColor Yellow
$exePath = Join-Path $outputDir "SystemSentinel\SystemSentinel.exe"

if (Test-Path $exePath) {
    $exeInfo = Get-Item $exePath
    $exeSizeMB = [math]::Round($exeInfo.Length / 1MB, 2)
    
    Write-Host "`n" -NoNewline
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "[SUCCESS] BUILD COMPLETE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "`nExecutable: $exePath" -ForegroundColor Cyan
    Write-Host "Size: $exeSizeMB MB" -ForegroundColor Gray
    Write-Host "`nTo run: .\$exePath" -ForegroundColor Yellow
    Write-Host "`nBuild pipeline is fully automated and working!" -ForegroundColor Green
} else {
    Write-Host "       [ERROR] Executable not found" -ForegroundColor Red
    exit 1
}

