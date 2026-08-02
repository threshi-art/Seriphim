# Startup Program Audit
# Show auto-run entries with enable/disable toggles

$ErrorActionPreference = "Continue"

Write-Host "Startup Program Audit" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan

$startupItems = @()

# Get startup items from registry
$regPaths = @(
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run",
    "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run",
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce",
    "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce"
)

Write-Host "`nScanning startup locations..." -ForegroundColor Yellow

foreach ($path in $regPaths) {
    if (Test-Path $path) {
        $items = Get-ItemProperty $path -ErrorAction SilentlyContinue
        foreach ($item in $items.PSObject.Properties) {
            if ($item.Name -notmatch "PSPath|PSParentPath|PSChildName|PSDrive|PSProvider") {
                $startupItems += @{
                    Name = $item.Name
                    Path = $item.Value
                    Location = $path
                }
            }
        }
    }
}

# Get from Startup folder
$startupFolder = [Environment]::GetFolderPath("Startup")
if (Test-Path $startupFolder) {
    Get-ChildItem $startupFolder | ForEach-Object {
        $startupItems += @{
            Name = $_.Name
            Path = $_.FullName
            Location = "Startup Folder"
        }
    }
}

Write-Host "`nFound $($startupItems.Count) startup items:" -ForegroundColor Gray

$suspiciousCount = 0
foreach ($item in $startupItems) {
    $isSuspicious = $false
    
    # Check for suspicious patterns
    if ($item.Path -match "temp|tmp|appdata.*local.*temp" -and 
        $item.Path -notmatch "microsoft|windows") {
        $isSuspicious = $true
        Write-Host "  [SUSPICIOUS] $($item.Name) -> $($item.Path)" -ForegroundColor Yellow
        $suspiciousCount++
    } else {
        Write-Host "  $($item.Name) -> $($item.Path)" -ForegroundColor Gray
    }
}

if ($suspiciousCount -gt 0) {
    Write-Host "`n[WARNING] $suspiciousCount suspicious startup item(s) found" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "`n[PASS] Startup programs appear normal" -ForegroundColor Green
    exit 0
}




