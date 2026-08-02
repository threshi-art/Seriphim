# SFC Scan & Repair
# Scans protected system files and repairs corruption

$ErrorActionPreference = "Continue"

Write-Host "SFC (System File Checker) Scan & Repair" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Run SFC scan
Write-Host "`nRunning SFC scannow..." -ForegroundColor Yellow
$sfcResult = sfc /scannow

# Check for corruption
$corruptionFound = $false
$repairSuccess = $false

if ($sfcResult -match "found integrity violations" -or $sfcResult -match "corruption") {
    $corruptionFound = $true
    Write-Host "[WARNING] System file corruption detected" -ForegroundColor Yellow
    
    # Check if repair was attempted
    if ($sfcResult -match "repaired" -or $sfcResult -match "restored") {
        $repairSuccess = $true
        Write-Host "[PASS] Corruption has been repaired" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "[FAIL] Corruption detected but repair may require administrator privileges" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[PASS] No integrity violations found" -ForegroundColor Green
    Write-Host "System files are healthy" -ForegroundColor Gray
    exit 0
}


