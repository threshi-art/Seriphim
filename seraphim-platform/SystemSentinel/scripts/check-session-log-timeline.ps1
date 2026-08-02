# Session Log Timeline
# Every run becomes a timestamped entry

$ErrorActionPreference = "Continue"

Write-Host "Session Log Timeline" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

$logFile = "logs\system-checks.log"

if (Test-Path $logFile) {
    $logContent = Get-Content $logFile
    
    # Parse log entries
    $sessions = @()
    $currentSession = $null
    
    foreach ($line in $logContent) {
        if ($line -match "=== System Check Session: (.+) ===") {
            if ($currentSession) {
                $sessions += $currentSession
            }
            $currentSession = @{
                Timestamp = $matches[1]
                Checks = @()
            }
        } elseif ($line -match "(.+):\s*(PASS|WARNING|FAIL)") {
            if ($currentSession) {
                $currentSession.Checks += @{
                    Name = $matches[1]
                    Status = $matches[2]
                }
            }
        }
    }
    
    if ($currentSession) {
        $sessions += $currentSession
    }
    
    Write-Host "`nFound $($sessions.Count) session(s) in log" -ForegroundColor Gray
    
    if ($sessions.Count -gt 0) {
        Write-Host "`nRecent Sessions:" -ForegroundColor Yellow
        $sessions | Select-Object -Last 5 | ForEach-Object {
            $passCount = ($_.Checks | Where-Object { $_.Status -eq "PASS" }).Count
            $warnCount = ($_.Checks | Where-Object { $_.Status -eq "WARNING" }).Count
            $failCount = ($_.Checks | Where-Object { $_.Status -eq "FAIL" }).Count
            
            Write-Host "  $($_.Timestamp)" -ForegroundColor Cyan
            Write-Host "    Checks: $($_.Checks.Count) | PASS: $passCount | WARN: $warnCount | FAIL: $failCount" -ForegroundColor Gray
        }
        
        Write-Host "`n[PASS] Session log timeline loaded" -ForegroundColor Green
        Write-Host "Full log available at: $logFile" -ForegroundColor Gray
    } else {
        Write-Host "`n[WARNING] Log file exists but contains no sessions" -ForegroundColor Yellow
    }
    
    exit 0
} else {
    Write-Host "`n[WARNING] No session log file found" -ForegroundColor Yellow
    Write-Host "Log file will be created on first check execution" -ForegroundColor Gray
    exit 0
}




