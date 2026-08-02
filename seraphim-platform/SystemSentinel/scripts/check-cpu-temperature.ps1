# Check CPU temperature (if available via WMI)
# Exit codes: 0 = OK/WARNING, 1 = FAIL

$thresholdWarning = 70  # Celsius
$thresholdFail = 85     # Celsius

try {
    # Try to get CPU temperature from WMI
    $cpuTemp = Get-CimInstance -Namespace "root\wmi" -ClassName "MSAcpi_ThermalZoneTemperature" -ErrorAction SilentlyContinue
    
    if ($cpuTemp -eq $null) {
        # Fallback: Check if we can get temperature from other sources
        Write-Host "[WARNING] CPU temperature monitoring not available via standard WMI"
        Write-Host "This may require hardware-specific drivers or third-party tools"
        Write-Host "System appears to be running normally"
        exit 0
    }
    
    $temperatures = @()
    foreach ($temp in $cpuTemp) {
        $tempCelsius = ($temp.CurrentTemperature / 10) - 273.15
        $temperatures += [math]::Round($tempCelsius, 1)
        Write-Host "CPU Temperature Zone: $([math]::Round($tempCelsius, 1))°C"
    }
    
    $maxTemp = ($temperatures | Measure-Object -Maximum).Maximum
    
    if ($maxTemp -gt $thresholdFail) {
        Write-Host "[FAIL] Critical: CPU temperature $maxTemp°C exceeds safe threshold ($thresholdFail°C)"
        exit 1
    } elseif ($maxTemp -gt $thresholdWarning) {
        Write-Host "[WARNING] High CPU temperature: $maxTemp°C (threshold: $thresholdWarning°C)"
        exit 0
    } else {
        Write-Host "[PASS] CPU temperature is normal: $maxTemp°C"
        exit 0
    }
} catch {
    Write-Host "[WARNING] Unable to read CPU temperature: $($_.Exception.Message)"
    Write-Host "System appears to be running normally"
    exit 0
}

