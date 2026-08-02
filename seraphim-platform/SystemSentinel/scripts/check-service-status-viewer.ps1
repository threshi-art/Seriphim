# Service Status Viewer
# Show running/stopped services, allow safe restart

$ErrorActionPreference = "Continue"

Write-Host "Service Status Viewer" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan

try {
    $services = Get-Service | Where-Object { $_.Status -ne "Running" -or $_.StartType -eq "Disabled" }
    
    $stoppedCount = ($services | Where-Object { $_.Status -eq "Stopped" -and $_.StartType -ne "Disabled" }).Count
    $disabledCount = ($services | Where-Object { $_.StartType -eq "Disabled" }).Count
    
    Write-Host "`nService Status Summary:" -ForegroundColor Yellow
    Write-Host "  Stopped (but enabled): $stoppedCount" -ForegroundColor $(if ($stoppedCount -gt 0) { "Yellow" } else { "Green" })
    Write-Host "  Disabled: $disabledCount" -ForegroundColor Gray
    
    # Check critical services
    $criticalServices = @("Themes", "AudioSrv", "Dhcp", "Dnscache", "EventLog", "PlugPlay", "RpcSs", "Schedule", "Winmgmt")
    $criticalIssues = @()
    
    foreach ($svcName in $criticalServices) {
        $svc = Get-Service -Name $svcName -ErrorAction SilentlyContinue
        if ($svc) {
            if ($svc.Status -ne "Running") {
                $criticalIssues += $svcName
                Write-Host "  [ISSUE] $svcName is $($svc.Status)" -ForegroundColor Yellow
            }
        }
    }
    
    if ($criticalIssues.Count -gt 0) {
        Write-Host "`n[WARNING] $($criticalIssues.Count) critical service(s) not running" -ForegroundColor Yellow
        Write-Host "Services: $($criticalIssues -join ', ')" -ForegroundColor Gray
        exit 0
    } elseif ($stoppedCount -gt 5) {
        Write-Host "`n[WARNING] Multiple services are stopped" -ForegroundColor Yellow
        exit 0
    } else {
        Write-Host "`n[PASS] All critical services are running" -ForegroundColor Green
        exit 0
    }
    
} catch {
    Write-Host "[WARNING] Error checking services: $($_.Exception.Message)" -ForegroundColor Yellow
    exit 0
}




