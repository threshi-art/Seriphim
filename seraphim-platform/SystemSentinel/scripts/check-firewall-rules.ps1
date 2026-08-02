# Firewall Rule Audit
# Show current rules, highlight risky exceptions

$ErrorActionPreference = "Continue"

Write-Host "Firewall Rule Audit" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

try {
    $rules = Get-NetFirewallRule | Where-Object { $_.Enabled -eq $true }
    
    Write-Host "`nScanning firewall rules..." -ForegroundColor Yellow
    
    $riskyRules = @()
    
    foreach ($rule in $rules) {
        $isRisky = $false
        $reasons = @()
        
        # Check for overly permissive rules
        if ($rule.Direction -eq "Inbound" -and $rule.Action -eq "Allow") {
            $filters = Get-NetFirewallAddressFilter -AssociatedNetFirewallRule $rule
            
            # Check if rule allows all IPs
            if ($filters.RemoteAddress -eq "*" -or $filters.RemoteAddress -eq "Any") {
                $isRisky = $true
                $reasons += "Allows all remote addresses"
            }
            
            # Check for specific risky ports
            $portFilters = Get-NetFirewallPortFilter -AssociatedNetFirewallRule $rule
            if ($portFilters.LocalPort -contains "3389" -and $filters.RemoteAddress -eq "*") {
                $isRisky = $true
                $reasons += "RDP open to all"
            }
        }
        
        if ($isRisky) {
            $riskyRules += @{
                Name = $rule.DisplayName
                Reasons = $reasons
            }
            Write-Host "  [RISKY] $($rule.DisplayName)" -ForegroundColor Yellow
            Write-Host "    Reasons: $($reasons -join ', ')" -ForegroundColor Gray
        }
    }
    
    Write-Host "`nTotal Active Rules: $($rules.Count)" -ForegroundColor Gray
    
    if ($riskyRules.Count -gt 0) {
        Write-Host "`n[WARNING] $($riskyRules.Count) potentially risky firewall rule(s) found" -ForegroundColor Yellow
        Write-Host "Review these rules to ensure they are necessary and properly scoped" -ForegroundColor Gray
        exit 0
    } else {
        Write-Host "`n[PASS] Firewall rules appear secure" -ForegroundColor Green
        exit 0
    }
    
} catch {
    Write-Host "[WARNING] Error checking firewall rules: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "This may require administrator privileges" -ForegroundColor Gray
    exit 0
}




