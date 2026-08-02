# Scheduled Task Audit
# List hidden scheduled jobs, flag unknown entries

$ErrorActionPreference = "Continue"

Write-Host "Scheduled Task Audit" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

try {
    $tasks = Get-ScheduledTask | Where-Object { $_.State -eq "Ready" -or $_.State -eq "Running" }
    
    Write-Host "`nScanning scheduled tasks..." -ForegroundColor Yellow
    
    $suspiciousTasks = @()
    $knownMicrosoftTasks = @("Microsoft", "Windows", "OneDrive", "Office", "Adobe")
    
    foreach ($task in $tasks) {
        $isSuspicious = $false
        $reasons = @()
        
        # Check if task is hidden
        if ($task.Settings.Hidden) {
            $isSuspicious = $true
            $reasons += "Hidden task"
        }
        
        # Check if task runs with highest privileges
        if ($task.Principal.RunLevel -eq "Highest") {
            $reasons += "Runs with highest privileges"
        }
        
        # Check if task is from unknown source
        $isKnown = $false
        foreach ($known in $knownMicrosoftTasks) {
            if ($task.TaskName -like "*$known*" -or $task.TaskPath -like "*$known*") {
                $isKnown = $true
                break
            }
        }
        
        if (-not $isKnown -and $task.TaskPath -notlike "\Microsoft*") {
            $isSuspicious = $true
            $reasons += "Unknown source"
        }
        
        if ($isSuspicious) {
            $suspiciousTasks += @{
                Name = $task.TaskName
                Path = $task.TaskPath
                Reasons = $reasons
            }
            Write-Host "  [SUSPICIOUS] $($task.TaskPath)$($task.TaskName)" -ForegroundColor Yellow
            Write-Host "    Reasons: $($reasons -join ', ')" -ForegroundColor Gray
        }
    }
    
    Write-Host "`nTotal Active Tasks: $($tasks.Count)" -ForegroundColor Gray
    
    if ($suspiciousTasks.Count -gt 0) {
        Write-Host "`n[WARNING] $($suspiciousTasks.Count) suspicious scheduled task(s) found" -ForegroundColor Yellow
        Write-Host "Review these tasks to ensure they are legitimate" -ForegroundColor Gray
        exit 0
    } else {
        Write-Host "`n[PASS] All scheduled tasks appear normal" -ForegroundColor Green
        exit 0
    }
    
} catch {
    Write-Host "[WARNING] Error checking scheduled tasks: $($_.Exception.Message)" -ForegroundColor Yellow
    exit 0
}


