# BSOD Dump Parser
# Basic analysis of crash dumps (stop codes, drivers involved)

$ErrorActionPreference = "Continue"

Write-Host "BSOD Dump Parser" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan

$dumpPath = "$env:SystemRoot\Minidump"
$hasDumps = $false

if (Test-Path $dumpPath) {
    $dumps = Get-ChildItem $dumpPath -Filter "*.dmp" -ErrorAction SilentlyContinue
    
    if ($dumps) {
        $hasDumps = $true
        Write-Host "`nFound $($dumps.Count) crash dump file(s)" -ForegroundColor Yellow
        
        # Get most recent dump
        $latestDump = $dumps | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        
        Write-Host "`nMost Recent Dump:" -ForegroundColor Cyan
        Write-Host "  File: $($latestDump.Name)" -ForegroundColor Gray
        Write-Host "  Date: $($latestDump.LastWriteTime)" -ForegroundColor Gray
        Write-Host "  Size: $([math]::Round($latestDump.Length / 1MB, 2)) MB" -ForegroundColor Gray
        
        # Try to get basic info (requires WinDbg or similar tools for full analysis)
        Write-Host "`nNote: Full dump analysis requires WinDbg or similar tools" -ForegroundColor Gray
        Write-Host "For detailed analysis, use: windbg -z `"$($latestDump.FullName)`"" -ForegroundColor Gray
        
        # Check dump age
        $dumpAge = ((Get-Date) - $latestDump.LastWriteTime).Days
        if ($dumpAge -lt 30) {
            Write-Host "`n[WARNING] Recent crash dump found (age: $dumpAge days)" -ForegroundColor Yellow
            Write-Host "System experienced a crash recently - investigate the cause" -ForegroundColor Gray
            exit 0
        } else {
            Write-Host "`n[WARNING] Crash dump found (age: $dumpAge days)" -ForegroundColor Yellow
            Write-Host "Dump is older but indicates past system instability" -ForegroundColor Gray
            exit 0
        }
    }
}

if (-not $hasDumps) {
    Write-Host "`n[PASS] No crash dumps found" -ForegroundColor Green
    Write-Host "System has not experienced recent crashes" -ForegroundColor Gray
    exit 0
}




