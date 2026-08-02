# Check network latency
# Exit codes: 0 = OK/WARNING, 1 = FAIL

$testHost = "8.8.8.8"  # Google DNS
$thresholdWarning = 100  # milliseconds
$thresholdFail = 500      # milliseconds

try {
    $pingResults = Test-Connection -ComputerName $testHost -Count 4 -ErrorAction Stop
    
    $latencies = $pingResults | ForEach-Object { $_.ResponseTime }
    $avgLatency = ($latencies | Measure-Object -Average).Average
    $maxLatency = ($latencies | Measure-Object -Maximum).Maximum
    $minLatency = ($latencies | Measure-Object -Minimum).Minimum
    
    Write-Host "Network Latency to $testHost :"
    Write-Host "  Average: $([math]::Round($avgLatency, 2)) ms"
    Write-Host "  Min: $([math]::Round($minLatency, 2)) ms"
    Write-Host "  Max: $([math]::Round($maxLatency, 2)) ms"
    
    if ($avgLatency -gt $thresholdFail) {
        Write-Host "[FAIL] Critical latency: $([math]::Round($avgLatency, 2)) ms exceeds threshold ($thresholdFail ms)"
        exit 1
    } elseif ($avgLatency -gt $thresholdWarning) {
        Write-Host "[WARNING] High latency: $([math]::Round($avgLatency, 2)) ms (threshold: $thresholdWarning ms)"
        exit 0
    } else {
        Write-Host "[PASS] Network latency is acceptable: $([math]::Round($avgLatency, 2)) ms"
        exit 0
    }
} catch {
    Write-Host "[FAIL] Unable to test network latency: $($_.Exception.Message)"
    exit 1
}

