# Check system memory usage
# Exit codes: 0 = OK/WARNING, 1 = FAIL

$thresholdWarning = 85  # Percentage
$thresholdFail = 95      # Percentage

$os = Get-CimInstance Win32_OperatingSystem
$totalMemoryGB = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
$freeMemoryGB = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
$usedMemoryGB = $totalMemoryGB - $freeMemoryGB
$usedPercent = [math]::Round((($usedMemoryGB / $totalMemoryGB) * 100), 2)

Write-Host "Total Memory: $totalMemoryGB GB"
Write-Host "Used Memory: $usedMemoryGB GB ($usedPercent%)"
Write-Host "Free Memory: $freeMemoryGB GB"

if ($usedPercent -gt $thresholdFail) {
    Write-Host "[FAIL] Critical: Memory usage exceeds $thresholdFail%"
    exit 1
} elseif ($usedPercent -gt $thresholdWarning) {
    Write-Host "[WARNING] High memory usage: $usedPercent% (threshold: $thresholdWarning%)"
    exit 0
} else {
    Write-Host "[PASS] Memory usage is healthy: $usedPercent%"
    exit 0
}

