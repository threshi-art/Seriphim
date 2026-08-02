# CHKDSK with Auto-Repair
# Run in scan-only or fix mode

param(
    [switch]$Fix = $false
)

$ErrorActionPreference = "Continue"

Write-Host "CHKDSK Disk Check" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan

# Get system drive
$systemDrive = $env:SystemDrive

Write-Host "`nSystem Drive: $systemDrive" -ForegroundColor Gray

if ($Fix) {
    Write-Host "`nRunning CHKDSK with auto-repair (requires reboot)..." -ForegroundColor Yellow
    Write-Host "WARNING: This will schedule a disk check on next reboot" -ForegroundColor Yellow
    
    # Schedule chkdsk for next reboot
    $chkdskResult = chkdsk $systemDrive /F /R
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[PASS] Disk check scheduled for next reboot" -ForegroundColor Green
        Write-Host "The system will check and repair the disk on restart" -ForegroundColor Gray
        exit 0
    } else {
        Write-Host "[WARNING] Could not schedule disk check" -ForegroundColor Yellow
        Write-Host "Disk may be in use or check already scheduled" -ForegroundColor Gray
        exit 0
    }
} else {
    Write-Host "`nRunning CHKDSK in read-only mode..." -ForegroundColor Yellow
    
    # Run read-only check
    $chkdskResult = chkdsk $systemDrive 2>&1
    
    # Parse results
    if ($chkdskResult -match "errors") {
        $errorCount = [regex]::Match($chkdskResult, "(\d+)\s+errors").Groups[1].Value
        if ($errorCount -and [int]$errorCount -gt 0) {
            Write-Host "[WARNING] Found $errorCount errors on disk" -ForegroundColor Yellow
            Write-Host "Run with -Fix parameter to repair (requires reboot)" -ForegroundColor Gray
            exit 0
        }
    }
    
    Write-Host "[PASS] No errors found on disk" -ForegroundColor Green
    exit 0
}


