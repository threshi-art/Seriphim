# Check disk space for all drives
# Exit codes: 0 = OK/WARNING, 1 = FAIL

$thresholdWarning = 20  # Percentage
$thresholdFail = 10      # Percentage
$hasFailures = $false
$hasWarnings = $false

$drives = Get-PSDrive -PSProvider FileSystem

foreach ($drive in $drives) {
    $freeSpacePercent = ($drive.Free / $drive.Used) * 100
    $totalSpace = $drive.Used + $drive.Free
    $freeSpaceGB = [math]::Round($drive.Free / 1GB, 2)
    $totalSpaceGB = [math]::Round($totalSpace / 1GB, 2)
    $usedPercent = [math]::Round((($drive.Used / $totalSpace) * 100), 2)
    
    Write-Host "Drive $($drive.Name): $usedPercent% used ($freeSpaceGB GB free of $totalSpaceGB GB total)"
    
    if ($usedPercent -gt (100 - $thresholdFail)) {
        Write-Host "  [FAIL] Critical: Less than $thresholdFail% free space remaining"
        $hasFailures = $true
    } elseif ($usedPercent -gt (100 - $thresholdWarning)) {
        Write-Host "  [WARNING] Low disk space: Less than $thresholdWarning% free space remaining"
        $hasWarnings = $true
    } else {
        Write-Host "  [PASS] Disk space is healthy"
    }
}

if ($hasFailures) {
    exit 1
} elseif ($hasWarnings) {
    exit 0  # Warning but not critical
} else {
    exit 0  # All good
}

