# Driver List with Versions
# Highlight outdated or duplicate drivers

$ErrorActionPreference = "Continue"

Write-Host "Driver List with Versions" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

try {
    $drivers = Get-WmiObject Win32_PnPSignedDriver | 
        Where-Object { $_.DeviceName } | 
        Select-Object DeviceName, DriverVersion, DriverDate, IsSigned, Manufacturer |
        Sort-Object DeviceName
    
    Write-Host "`nScanning $($drivers.Count) drivers..." -ForegroundColor Yellow
    
    $outdatedDrivers = @()
    $duplicateDrivers = @()
    $driverNames = @{}
    
    foreach ($driver in $drivers) {
        # Check for duplicates
        if ($driverNames.ContainsKey($driver.DeviceName)) {
            $duplicateDrivers += $driver.DeviceName
        } else {
            $driverNames[$driver.DeviceName] = $true
        }
        
        # Check driver age
        if ($driver.DriverDate) {
            try {
                $driverDate = [DateTime]::ParseExact($driver.DriverDate.Substring(0,8), "yyyyMMdd", $null)
                $ageYears = ((Get-Date) - $driverDate).Days / 365
                
                if ($ageYears -gt 5) {
                    $outdatedDrivers += @{
                        Name = $driver.DeviceName
                        Version = $driver.DriverVersion
                        Age = [math]::Round($ageYears, 1)
                    }
                }
            } catch {
                # Date parsing failed
            }
        }
    }
    
    Write-Host "`nSummary:" -ForegroundColor Cyan
    Write-Host "  Total Drivers: $($drivers.Count)" -ForegroundColor Gray
    Write-Host "  Outdated (>5 years): $($outdatedDrivers.Count)" -ForegroundColor $(if ($outdatedDrivers.Count -gt 0) { "Yellow" } else { "Green" })
    Write-Host "  Duplicates: $($duplicateDrivers.Count)" -ForegroundColor $(if ($duplicateDrivers.Count -gt 0) { "Yellow" } else { "Green" })
    
    if ($outdatedDrivers.Count -gt 0) {
        Write-Host "`nOutdated Drivers:" -ForegroundColor Yellow
        $outdatedDrivers | Select-Object -First 5 | ForEach-Object {
            Write-Host "  $($_.Name) v$($_.Version) (Age: $($_.Age) years)" -ForegroundColor Gray
        }
    }
    
    if ($outdatedDrivers.Count -gt 10 -or $duplicateDrivers.Count -gt 5) {
        Write-Host "`n[WARNING] Multiple driver issues detected" -ForegroundColor Yellow
        exit 0
    } elseif ($outdatedDrivers.Count -gt 0 -or $duplicateDrivers.Count -gt 0) {
        Write-Host "`n[WARNING] Some driver issues found" -ForegroundColor Yellow
        exit 0
    } else {
        Write-Host "`n[PASS] Driver list is healthy" -ForegroundColor Green
        exit 0
    }
    
} catch {
    Write-Host "[WARNING] Error checking drivers: $($_.Exception.Message)" -ForegroundColor Yellow
    exit 0
}




