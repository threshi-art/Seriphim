# Check network connectivity
# Exit codes: 0 = OK/WARNING, 1 = FAIL

$testHosts = @(
    @{Name="Google DNS"; Address="8.8.8.8"},
    @{Name="Cloudflare DNS"; Address="1.1.1.1"},
    @{Name="Default Gateway"; Address=(Get-NetRoute -DestinationPrefix "0.0.0.0/0" | Select-Object -First 1).NextHop}
)

$failedPings = @()
$successfulPings = 0

# Get default gateway
$gateway = (Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Select-Object -First 1).NextHop
if ($gateway) {
    $testHosts[2].Address = $gateway
} else {
    $testHosts = $testHosts[0..1]  # Remove gateway test if not available
}

foreach ($host in $testHosts) {
    if ([string]::IsNullOrEmpty($host.Address)) {
        continue
    }
    
    $pingResult = Test-Connection -ComputerName $host.Address -Count 2 -Quiet -ErrorAction SilentlyContinue
    
    if ($pingResult) {
        Write-Host "[PASS] $($host.Name) ($($host.Address)) : Reachable"
        $successfulPings++
    } else {
        Write-Host "[FAIL] $($host.Name) ($($host.Address)) : Not reachable"
        $failedPings += $host.Name
    }
}

# Check network adapter status
$adapters = Get-NetAdapter | Where-Object {$_.Status -eq "Up"}
$activeAdapters = $adapters.Count

Write-Host "`nActive network adapters: $activeAdapters"

if ($failedPings.Count -eq $testHosts.Count) {
    Write-Host "`n[FAIL] No network connectivity - all test hosts unreachable"
    exit 1
} elseif ($failedPings.Count -gt 0) {
    Write-Host "`n[WARNING] Partial connectivity - some hosts unreachable: $($failedPings -join ', ')"
    exit 0
} elseif ($activeAdapters -eq 0) {
    Write-Host "`n[WARNING] No active network adapters detected"
    exit 0
} else {
    Write-Host "`n[PASS] Network connectivity is healthy"
    exit 0
}

