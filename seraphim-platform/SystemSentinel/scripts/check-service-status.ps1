# Check critical Windows services status
# Exit codes: 0 = OK/WARNING, 1 = FAIL

$criticalServices = @(
    "Themes",
    "AudioSrv",
    "Dhcp",
    "Dnscache",
    "EventLog",
    "PlugPlay",
    "RpcSs",
    "Schedule",
    "Winmgmt"
)

$failedServices = @()
$stoppedServices = @()

foreach ($serviceName in $criticalServices) {
    $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    
    if ($service -eq $null) {
        Write-Host "[WARNING] Service '$serviceName' not found (may not be installed)"
        continue
    }
    
    if ($service.Status -eq "Running") {
        Write-Host "[PASS] $serviceName : Running"
    } elseif ($service.Status -eq "Stopped") {
        Write-Host "[WARNING] $serviceName : Stopped"
        $stoppedServices += $serviceName
    } else {
        Write-Host "[FAIL] $serviceName : $($service.Status)"
        $failedServices += $serviceName
    }
}

if ($failedServices.Count -gt 0) {
    Write-Host "`n[FAIL] Critical services in failed state: $($failedServices -join ', ')"
    exit 1
} elseif ($stoppedServices.Count -gt 0) {
    Write-Host "`n[WARNING] Some services are stopped: $($stoppedServices -join ', ')"
    exit 0
} else {
    Write-Host "`n[PASS] All critical services are running"
    exit 0
}

