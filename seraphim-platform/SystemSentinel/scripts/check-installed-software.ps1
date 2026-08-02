# Installed Software List
# Export to JSON/CSV for inventory

param(
    [string]$ExportFormat = "none"  # "json", "csv", or "none"
)

$ErrorActionPreference = "Continue"

Write-Host "Installed Software List" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan

try {
    $software = Get-WmiObject Win32_Product | Select-Object Name, Version, Vendor, InstallDate
    
    Write-Host "`nFound $($software.Count) installed programs" -ForegroundColor Gray
    
    # Show sample
    Write-Host "`nSample (first 10):" -ForegroundColor Yellow
    $software | Select-Object -First 10 | ForEach-Object {
        Write-Host "  $($_.Name) v$($_.Version) - $($_.Vendor)" -ForegroundColor Gray
    }
    
    if ($ExportFormat -eq "json") {
        $exportPath = "logs\installed-software-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
        $software | ConvertTo-Json | Out-File $exportPath
        Write-Host "`n[PASS] Software list exported to: $exportPath" -ForegroundColor Green
    } elseif ($ExportFormat -eq "csv") {
        $exportPath = "logs\installed-software-$(Get-Date -Format 'yyyyMMdd-HHmmss').csv"
        $software | Export-Csv $exportPath -NoTypeInformation
        Write-Host "`n[PASS] Software list exported to: $exportPath" -ForegroundColor Green
    } else {
        Write-Host "`n[PASS] Software inventory complete" -ForegroundColor Green
        Write-Host "Use -ExportFormat json or csv to export the full list" -ForegroundColor Gray
    }
    
    exit 0
    
} catch {
    Write-Host "[WARNING] Error retrieving software list: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "This may require administrator privileges" -ForegroundColor Gray
    exit 0
}




