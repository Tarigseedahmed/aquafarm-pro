# Test VPS Connection Script
# PowerShell script to test connection to Hostinger VPS

$VPS_IP = "72.60.187.58"
$VPS_USER = "root"
$VPS_HOSTNAME = "srv1029413.hstgr.cloud"

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "   VPS Connection Test" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

Write-Host "`nServer Information:" -ForegroundColor Yellow
Write-Host "  IP: $VPS_IP" -ForegroundColor White
Write-Host "  User: $VPS_USER" -ForegroundColor White
Write-Host "  Hostname: $VPS_HOSTNAME" -ForegroundColor White

Write-Host "`nTesting connection..." -ForegroundColor Yellow

# Test ping
Write-Host "`n1. Testing Ping..." -ForegroundColor Cyan
$pingResult = Test-Connection -ComputerName $VPS_IP -Count 4 -ErrorAction SilentlyContinue

if ($pingResult) {
    Write-Host "  [OK] Ping successful" -ForegroundColor Green
    $avgTime = ($pingResult | Measure-Object -Property ResponseTime -Average).Average
    Write-Host "  Average response time: $([math]::Round($avgTime, 2)) ms" -ForegroundColor White
} else {
    Write-Host "  [FAIL] Ping failed" -ForegroundColor Red
}

# Test SSH
Write-Host "`n2. Testing SSH connection..." -ForegroundColor Cyan
Write-Host "  Connecting to: $VPS_USER@$VPS_IP" -ForegroundColor White

# Try SSH (will ask for password)
Write-Host "`n  Note: You will be asked for the password" -ForegroundColor Yellow
Write-Host "  Password: Tariq2024Tariq2026@#" -ForegroundColor Yellow

$sshCommand = "echo 'Connected successfully!' && uname -a && docker --version"
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_IP}" $sshCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n  [OK] SSH connected successfully!" -ForegroundColor Green
} else {
    Write-Host "`n  [FAIL] SSH connection failed" -ForegroundColor Red
    Write-Host "`n  Please check:" -ForegroundColor Yellow
    Write-Host "    1. Password is correct" -ForegroundColor White
    Write-Host "    2. SSH port 22 is open" -ForegroundColor White
    Write-Host "    3. Internet connection" -ForegroundColor White
}

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "   Test completed" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

Write-Host "`nIf tests passed, you can now run:" -ForegroundColor Green
Write-Host "  .\scripts\deploy-to-vps.ps1" -ForegroundColor White
Write-Host ""
