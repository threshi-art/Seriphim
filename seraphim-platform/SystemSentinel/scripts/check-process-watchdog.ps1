# Process Watchdog
# Highlight suspicious processes (high CPU, unsigned binaries)

$ErrorActionPreference = "Continue"

Write-Host "Process Watchdog" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan

Write-Host "`nScanning running processes..." -ForegroundColor Yellow

$suspiciousProcesses = @()
$processes = Get-Process | Where-Object { $_.Path }

foreach ($proc in $processes) {
    $issues = @()
    
    # Check CPU usage (if > 50% sustained, might be suspicious)
    $cpuTime = $proc.CPU
    if ($cpuTime -gt 1000) {  # High CPU time
        $issues += "High CPU usage"
    }
    
    # Check if process path exists and is signed
    if ($proc.Path) {
        try {
            $signature = Get-AuthenticodeSignature $proc.Path -ErrorAction SilentlyContinue
            if ($signature.Status -ne "Valid") {
                $issues += "Unsigned binary"
            }
        } catch {
            # Path might not be accessible
        }
        
        # Check for suspicious locations
        if ($proc.Path -match "temp|tmp|appdata.*local.*temp" -and 
            $proc.Path -notmatch "microsoft|windows|program files") {
            $issues += "Running from temp location"
        }
    }
    
    # Check memory usage (very high might indicate issues)
    $memoryMB = [math]::Round($proc.WorkingSet64 / 1MB, 2)
    if ($memoryMB -gt 1000) {  # > 1GB
        $issues += "High memory usage ($memoryMB MB)"
    }
    
    if ($issues.Count -gt 0) {
        $suspiciousProcesses += @{
            Name = $proc.ProcessName
            PID = $proc.Id
            Issues = $issues
            Path = $proc.Path
        }
    }
}

if ($suspiciousProcesses.Count -gt 0) {
    Write-Host "`nSuspicious Processes Found:" -ForegroundColor Yellow
    foreach ($sp in $suspiciousProcesses) {
        Write-Host "  [$($sp.PID)] $($sp.Name)" -ForegroundColor Yellow
        Write-Host "    Issues: $($sp.Issues -join ', ')" -ForegroundColor Gray
        if ($sp.Path) {
            Write-Host "    Path: $($sp.Path)" -ForegroundColor Gray
        }
    }
    Write-Host "`n[WARNING] $($suspiciousProcesses.Count) suspicious process(es) detected" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "`n[PASS] No suspicious processes detected" -ForegroundColor Green
    exit 0
}




