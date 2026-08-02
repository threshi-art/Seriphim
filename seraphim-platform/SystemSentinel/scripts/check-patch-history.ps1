# Patch History Timeline
# Show applied updates chronologically

$ErrorActionPreference = "Continue"

Write-Host "Patch History Timeline" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan

try {
    $updates = Get-HotFix | Sort-Object InstalledOn -Descending
    
    Write-Host "`nRecent Updates (Last 30 days):" -ForegroundColor Yellow
    
    $recentUpdates = $updates | Where-Object { $_.InstalledOn -gt (Get-Date).AddDays(-30) }
    
    if ($recentUpdates) {
        $recentUpdates | ForEach-Object {
            Write-Host "  $($_.InstalledOn.ToString('yyyy-MM-dd')) - $($_.Description) (KB$($_.HotFixID))" -ForegroundColor Gray
        }
        Write-Host "`nTotal updates in last 30 days: $($recentUpdates.Count)" -ForegroundColor Gray
    } else {
        Write-Host "  No updates installed in the last 30 days" -ForegroundColor Gray
    }
    
    Write-Host "`nTotal Updates Installed: $($updates.Count)" -ForegroundColor Gray
    Write-Host "Oldest Update: $($updates[-1].InstalledOn.ToString('yyyy-MM-dd'))" -ForegroundColor Gray
    Write-Host "Newest Update: $($updates[0].InstalledOn.ToString('yyyy-MM-dd'))" -ForegroundColor Gray
    
    # Check for very old system (no updates in 90 days)
    $veryOld = $updates | Where-Object { $_.InstalledOn -gt (Get-Date).AddDays(-90) }
    if ($veryOld.Count -eq 0) {
        Write-Host "`n[WARNING] No updates installed in the last 90 days" -ForegroundColor Yellow
        Write-Host "System may be missing important security patches" -ForegroundColor Gray
        exit 0
    }
    
    Write-Host "`n[PASS] Patch history appears current" -ForegroundColor Green
    exit 0
    
} catch {
    Write-Host "[WARNING] Error retrieving patch history: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "This may require administrator privileges" -ForegroundColor Gray
    exit 0
}




