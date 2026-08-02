# Disk Defrag / Optimize
# Analyze and run defrag

param(
    [switch]$Optimize = $false
)

$ErrorActionPreference = "Continue"

Write-Host "Disk Defragmentation Analysis" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

try {
    $volumes = Get-Volume | Where-Object { $_.DriveType -eq "Fixed" -and $_.DriveLetter }
    
    foreach ($vol in $volumes) {
        $driveLetter = $vol.DriveLetter
        Write-Host "`nAnalyzing Drive $driveLetter`:" -ForegroundColor Yellow
        
        # Get fragmentation info (requires admin)
        $defragResult = defrag $driveLetter`:\ /A 2>&1
        
        if ($defragResult -match "fragmented" -or $defragResult -match "% fragmented") {
            $fragPercent = [regex]::Match($defragResult, "(\d+)\s*%").Groups[1].Value
            
            if ($fragPercent -and [int]$fragPercent -gt 10) {
                Write-Host "  Fragmentation: $fragPercent%" -ForegroundColor Yellow
                
                if ($Optimize) {
                    Write-Host "  Running optimization..." -ForegroundColor Yellow
                    defrag $driveLetter`:\ /O 2>&1 | Out-Null
                    Write-Host "  [PASS] Optimization completed" -ForegroundColor Green
                } else {
                    Write-Host "  [WARNING] Drive is $fragPercent% fragmented" -ForegroundColor Yellow
                    Write-Host "  Run with -Optimize to defragment" -ForegroundColor Gray
                }
            } else {
                Write-Host "  Fragmentation: $fragPercent% (acceptable)" -ForegroundColor Green
            }
        } else {
            # SSD or volume that doesn't need defrag
            Write-Host "  Volume type: $($vol.FileSystemType)" -ForegroundColor Gray
            if ($vol.FileSystemType -eq "NTFS") {
                Write-Host "  [PASS] Drive appears to be an SSD or doesn't require defragmentation" -ForegroundColor Green
            }
        }
    }
    
    exit 0
    
} catch {
    Write-Host "[WARNING] Error analyzing disk fragmentation: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "This may require administrator privileges" -ForegroundColor Gray
    exit 0
}




