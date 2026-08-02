# Network Port Monitor
# List open ports, flag unusual listeners

$ErrorActionPreference = "Continue"

Write-Host "Network Port Monitor" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan

try {
    $connections = Get-NetTCPConnection | Where-Object { $_.State -eq "Listen" }
    
    Write-Host "`nScanning listening ports..." -ForegroundColor Yellow
    
    $unusualPorts = @()
    $commonPorts = @(80, 443, 135, 445, 3389, 5985, 5986, 22, 21, 25, 53, 139)
    
    Write-Host "`nOpen Ports:" -ForegroundColor Gray
    foreach ($conn in $connections) {
        $port = $conn.LocalPort
        $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        $processName = if ($process) { $process.ProcessName } else { "Unknown" }
        
        # Check if port is unusual
        if ($port -notin $commonPorts -and $port -gt 1024) {
            $unusualPorts += @{
                Port = $port
                Process = $processName
                PID = $conn.OwningProcess
            }
            Write-Host "  [UNUSUAL] Port $port - Process: $processName (PID: $($conn.OwningProcess))" -ForegroundColor Yellow
        } else {
            Write-Host "  Port $port - Process: $processName" -ForegroundColor Gray
        }
    }
    
    if ($unusualPorts.Count -gt 5) {
        Write-Host "`n[WARNING] Multiple unusual ports detected ($($unusualPorts.Count))" -ForegroundColor Yellow
        Write-Host "Review these ports to ensure they are expected" -ForegroundColor Gray
        exit 0
    } elseif ($unusualPorts.Count -gt 0) {
        Write-Host "`n[WARNING] Some unusual ports found" -ForegroundColor Yellow
        exit 0
    } else {
        Write-Host "`n[PASS] All listening ports appear normal" -ForegroundColor Green
        exit 0
    }
    
} catch {
    Write-Host "[WARNING] Error scanning ports: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "This may require administrator privileges" -ForegroundColor Gray
    exit 0
}




