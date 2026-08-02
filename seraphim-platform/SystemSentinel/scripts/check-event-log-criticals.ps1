# Event Log Criticals
# Pull red-flag events (system, security, application)

$ErrorActionPreference = "Continue"

Write-Host "Event Log Critical Events" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

$criticalEvents = @()
$logNames = @("System", "Application", "Security")

Write-Host "`nScanning event logs for critical events..." -ForegroundColor Yellow

foreach ($logName in $logNames) {
    try {
        $events = Get-WinEvent -LogName $logName -MaxEvents 100 -ErrorAction SilentlyContinue | 
            Where-Object { $_.LevelDisplayName -eq "Critical" -or $_.LevelDisplayName -eq "Error" }
        
        foreach ($event in $events) {
            # Filter for recent events (last 7 days)
            if ($event.TimeCreated -gt (Get-Date).AddDays(-7)) {
                $criticalEvents += @{
                    Log = $logName
                    Time = $event.TimeCreated
                    Level = $event.LevelDisplayName
                    Message = $event.Message
                    ID = $event.Id
                }
            }
        }
    } catch {
        # Log might not be accessible
    }
}

if ($criticalEvents.Count -gt 0) {
    Write-Host "`nCritical Events Found (Last 7 Days):" -ForegroundColor Yellow
    
    $criticalCount = ($criticalEvents | Where-Object { $_.Level -eq "Critical" }).Count
    $errorCount = ($criticalEvents | Where-Object { $_.Level -eq "Error" }).Count
    
    Write-Host "  Critical: $criticalCount" -ForegroundColor Red
    Write-Host "  Errors: $errorCount" -ForegroundColor Yellow
    
    # Show first 5 events
    $criticalEvents | Select-Object -First 5 | ForEach-Object {
        Write-Host "`n  [$($_.Log)] $($_.Time) - $($_.Level)" -ForegroundColor Gray
        Write-Host "    ID: $($_.ID)" -ForegroundColor Gray
        $shortMsg = $_.Message.Substring(0, [Math]::Min(100, $_.Message.Length))
        Write-Host "    $shortMsg..." -ForegroundColor Gray
    }
    
    if ($criticalCount -gt 0) {
        Write-Host "`n[FAIL] $criticalCount critical event(s) found in the last 7 days" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "`n[WARNING] $errorCount error event(s) found in the last 7 days" -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host "`n[PASS] No critical events found in the last 7 days" -ForegroundColor Green
    exit 0
}




