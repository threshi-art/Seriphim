# DISM Health Check & Restore
# Checks Windows image health and repairs component store

$ErrorActionPreference = "Continue"

Write-Host "DISM Health Check & Restore" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan

# Check component store health
Write-Host "`nChecking component store health..." -ForegroundColor Yellow
$dismCheck = DISM /Online /Cleanup-Image /CheckHealth 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "[PASS] Component store is healthy" -ForegroundColor Green
    exit 0
}

# If health check fails, try scanhealth
Write-Host "`nRunning detailed scan..." -ForegroundColor Yellow
$dismScan = DISM /Online /Cleanup-Image /ScanHealth 2>&1

if ($dismScan -match "corruption" -or $dismScan -match "error") {
    Write-Host "[WARNING] Component store corruption detected" -ForegroundColor Yellow
    Write-Host "Attempting repair with RestoreHealth..." -ForegroundColor Yellow
    
    $dismRestore = DISM /Online /Cleanup-Image /RestoreHealth 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[PASS] Component store has been restored" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "[FAIL] Unable to restore component store automatically" -ForegroundColor Red
        Write-Host "May require manual intervention or Windows installation media" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "[PASS] Component store is healthy" -ForegroundColor Green
    exit 0
}


