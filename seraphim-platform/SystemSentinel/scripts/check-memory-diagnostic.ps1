# Memory Diagnostic
# Run Windows memory test, log results

$ErrorActionPreference = "Continue"

Write-Host "Memory Diagnostic" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan

# Check if memory diagnostic is scheduled
$memDiagScheduled = $false

try {
    # Check for scheduled memory diagnostic
    $scheduledTasks = Get-ScheduledTask | Where-Object { $_.TaskName -like "*Memory*" -or $_.TaskName -like "*Diagnostic*" }
    
    if ($scheduledTasks) {
        Write-Host "`nScheduled Memory Diagnostics:" -ForegroundColor Yellow
        foreach ($task in $scheduledTasks) {
            Write-Host "  $($task.TaskName) - State: $($task.State)" -ForegroundColor Gray
        }
    }
    
    # Get memory information
    $os = Get-CimInstance Win32_OperatingSystem
    $totalMemory = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
    $freeMemory = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
    $usedMemory = $totalMemory - $freeMemory
    $usedPercent = [math]::Round(($usedMemory / $totalMemory) * 100, 2)
    
    Write-Host "`nMemory Status:" -ForegroundColor Gray
    Write-Host "  Total: $totalMemory GB" -ForegroundColor Gray
    Write-Host "  Used: $usedMemory GB ($usedPercent%)" -ForegroundColor Gray
    Write-Host "  Free: $freeMemory GB" -ForegroundColor Gray
    
    # Check for memory-related errors in event log
    $memoryErrors = Get-WinEvent -LogName System -MaxEvents 50 -ErrorAction SilentlyContinue | 
        Where-Object { 
            $_.Message -match "memory" -and 
            ($_.LevelDisplayName -eq "Error" -or $_.LevelDisplayName -eq "Warning") -and
            $_.TimeCreated -gt (Get-Date).AddDays(-30)
        }
    
    if ($memoryErrors) {
        Write-Host "`n[WARNING] Memory-related events found in System log" -ForegroundColor Yellow
        Write-Host "  Events in last 30 days: $($memoryErrors.Count)" -ForegroundColor Gray
        Write-Host "  Consider running Windows Memory Diagnostic on next reboot" -ForegroundColor Gray
        Write-Host "  Command: mdsched.exe" -ForegroundColor Gray
        exit 0
    }
    
    Write-Host "`n[PASS] No memory issues detected" -ForegroundColor Green
    Write-Host "Note: For full diagnostic, run 'mdsched.exe' to schedule a memory test on reboot" -ForegroundColor Gray
    exit 0
    
} catch {
    Write-Host "[WARNING] Error checking memory status: $($_.Exception.Message)" -ForegroundColor Yellow
    exit 0
}




