# Resource Usage Dashboard
# CPU, RAM, Disk, Network in real time

$ErrorActionPreference = "Continue"

Write-Host "Resource Usage Dashboard" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

# CPU Usage
$cpu = Get-Counter '\Processor(_Total)\% Processor Time' -ErrorAction SilentlyContinue
$cpuValue = if ($cpu) { [math]::Round($cpu.CounterSamples[0].CookedValue, 2) } else { 0 }

# Memory Usage
$os = Get-CimInstance Win32_OperatingSystem
$totalMemory = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
$freeMemory = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
$usedMemory = $totalMemory - $freeMemory
$memoryPercent = [math]::Round(($usedMemory / $totalMemory) * 100, 2)

# Disk Usage
$disks = Get-CimInstance Win32_LogicalDisk | Where-Object { $_.DriveType -eq 3 }
$diskInfo = @()
foreach ($disk in $disks) {
    $sizeGB = [math]::Round($disk.Size / 1GB, 2)
    $freeGB = [math]::Round($disk.FreeSpace / 1GB, 2)
    $usedGB = $sizeGB - $freeGB
    $usedPercent = [math]::Round(($usedGB / $sizeGB) * 100, 2)
    $diskInfo += "$($disk.DeviceID) $usedPercent%"
}

# Network (simplified)
$networkAdapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }
$activeAdapters = $networkAdapters.Count

Write-Host "`nCurrent Resource Usage:" -ForegroundColor Yellow
Write-Host "  CPU: $cpuValue%" -ForegroundColor $(if ($cpuValue -gt 80) { "Yellow" } else { "Green" })
Write-Host "  Memory: $usedMemory GB / $totalMemory GB ($memoryPercent%)" -ForegroundColor $(if ($memoryPercent -gt 85) { "Yellow" } else { "Green" })
Write-Host "  Disk Usage: $($diskInfo -join ', ')" -ForegroundColor Gray
Write-Host "  Active Network Adapters: $activeAdapters" -ForegroundColor Gray

$warnings = @()
if ($cpuValue -gt 80) { $warnings += "High CPU usage" }
if ($memoryPercent -gt 85) { $warnings += "High memory usage" }

if ($warnings.Count -gt 0) {
    Write-Host "`n[WARNING] $($warnings -join ', ')" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "`n[PASS] Resource usage is within normal limits" -ForegroundColor Green
    exit 0
}




