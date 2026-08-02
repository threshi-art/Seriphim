# Check disk I/O performance
# Exit codes: 0 = OK/WARNING, 1 = FAIL

$thresholdWarning = 80  # Percentage of disk time
$thresholdFail = 95      # Percentage of disk time

try {
    $diskCounters = Get-Counter "\PhysicalDisk(*)\% Disk Time" -ErrorAction SilentlyContinue
    
    if ($diskCounters -eq $null) {
        Write-Host "[WARNING] Unable to read disk performance counters"
        Write-Host "This may require administrator privileges"
        exit 0
    }
    
    $hasIssues = $false
    $hasWarnings = $false
    
    foreach ($counter in $diskCounters.CounterSamples) {
        $instanceName = $counter.InstanceName
        $diskTime = [math]::Round($counter.CookedValue, 2)
        
        if ($instanceName -eq "_Total") {
            Write-Host "Total Disk Time: $diskTime%"
            
            if ($diskTime -gt $thresholdFail) {
                Write-Host "[FAIL] Critical: Disk I/O at $diskTime% (threshold: $thresholdFail%)"
                $hasIssues = $true
            } elseif ($diskTime -gt $thresholdWarning) {
                Write-Host "[WARNING] High disk I/O: $diskTime% (threshold: $thresholdWarning%)"
                $hasWarnings = $true
            } else {
                Write-Host "[PASS] Disk I/O is normal: $diskTime%"
            }
        } elseif ($instanceName -ne "0 C:" -and $instanceName -notmatch "^_") {
            # Show individual disk stats (skip total and system disk summary)
            Write-Host "Disk $instanceName : $diskTime%"
        }
    }
    
    if ($hasIssues) {
        exit 1
    } elseif ($hasWarnings) {
        exit 0
    } else {
        exit 0
    }
} catch {
    Write-Host "[WARNING] Error checking disk I/O: $($_.Exception.Message)"
    exit 0
}

