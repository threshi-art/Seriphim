# Driver Integrity Check
# Flag unsigned or outdated drivers

$ErrorActionPreference = "Continue"

Write-Host "Driver Integrity Check" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan

try {
    $drivers = Get-WmiObject Win32_PnPSignedDriver | Where-Object { $_.DeviceName }
    
    $unsignedCount = 0
    $outdatedCount = 0
    $totalCount = $drivers.Count
    
    Write-Host "`nChecking $totalCount drivers..." -ForegroundColor Yellow
    
    foreach ($driver in $drivers) {
        # Check if signed
        if ($driver.IsSigned -eq $false -or $driver.DriverVersion -eq $null) {
            $unsignedCount++
            Write-Host "  [UNSIGNED] $($driver.DeviceName)" -ForegroundColor Yellow
        }
        
        # Check driver date (simplified - drivers older than 3 years)
        if ($driver.DriverDate) {
            $driverDate = [DateTime]::ParseExact($driver.DriverDate.Substring(0,8), "yyyyMMdd", $null)
            $ageYears = ((Get-Date) - $driverDate).Days / 365
            
            if ($ageYears -gt 3) {
                $outdatedCount++
                Write-Host "  [OUTDATED] $($driver.DeviceName) (Age: $([math]::Round($ageYears, 1)) years)" -ForegroundColor Yellow
            }
        }
    }
    
    Write-Host "`nSummary:" -ForegroundColor Cyan
    Write-Host "  Total Drivers: $totalCount" -ForegroundColor Gray
    Write-Host "  Unsigned: $unsignedCount" -ForegroundColor $(if ($unsignedCount -gt 0) { "Yellow" } else { "Green" })
    Write-Host "  Potentially Outdated: $outdatedCount" -ForegroundColor $(if ($outdatedCount -gt 0) { "Yellow" } else { "Green" })
    
    if ($unsignedCount -gt 5 -or $outdatedCount -gt 10) {
        Write-Host "`n[WARNING] Multiple driver issues detected" -ForegroundColor Yellow
        Write-Host "Consider updating drivers from manufacturer websites" -ForegroundColor Gray
        exit 0
    } elseif ($unsignedCount -gt 0 -or $outdatedCount -gt 0) {
        Write-Host "`n[WARNING] Some driver issues found" -ForegroundColor Yellow
        exit 0
    } else {
        Write-Host "`n[PASS] All drivers appear to be signed and up-to-date" -ForegroundColor Green
        exit 0
    }
    
} catch {
    Write-Host "[FAIL] Error checking drivers: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}


