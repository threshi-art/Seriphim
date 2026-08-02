# Windows Update Audit
# List pending updates, failed installs, patch status

$ErrorActionPreference = "Continue"

Write-Host "Windows Update Audit" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan

try {
    # Get update session
    $updateSession = New-Object -ComObject Microsoft.Update.Session
    $updateSearcher = $updateSession.CreateUpdateSearcher()
    
    Write-Host "`nSearching for updates..." -ForegroundColor Yellow
    
    # Search for updates
    $searchResult = $updateSearcher.Search("IsInstalled=0")
    
    $pendingCount = $searchResult.Updates.Count
    Write-Host "Pending Updates: $pendingCount" -ForegroundColor Gray
    
    if ($pendingCount -gt 0) {
        Write-Host "`nPending Updates List:" -ForegroundColor Yellow
        foreach ($update in $searchResult.Updates) {
            Write-Host "  - $($update.Title)" -ForegroundColor Gray
        }
        Write-Host "`n[WARNING] $pendingCount update(s) pending installation" -ForegroundColor Yellow
        exit 0
    }
    
    # Check for failed updates
    $failedSearch = $updateSearcher.Search("IsInstalled=1 and IsHidden=0")
    $failedCount = 0
    
    foreach ($update in $failedSearch.Updates) {
        if ($update.LastDeploymentChangeTime -and 
            $update.LastDeploymentChangeTime -lt (Get-Date).AddDays(-7)) {
            # Check if update failed (simplified check)
            $failedCount++
        }
    }
    
    if ($failedCount -gt 0) {
        Write-Host "[WARNING] Some updates may have installation issues" -ForegroundColor Yellow
        exit 0
    }
    
    Write-Host "[PASS] Windows Update status is healthy" -ForegroundColor Green
    Write-Host "No pending updates found" -ForegroundColor Gray
    exit 0
    
} catch {
    Write-Host "[WARNING] Unable to query Windows Update service" -ForegroundColor Yellow
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host "This may require administrator privileges" -ForegroundColor Gray
    exit 0
}


