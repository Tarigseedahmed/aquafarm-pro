# =================================
# AquaFarm Pro - Deployment with Password
# =================================
# 
# Date: October 1, 2025
# Deployment script with secure password handling
# 
# Usage: .\deploy-with-password.ps1 -VpsPassword (Get-Credential).Password
# =================================

param(
    [string]$VpsHost = "srv1029413.hstgr.cloud",
    [string]$VpsUser = "root",
    [SecureString]$VpsPassword,
    [string]$LocalPath = "F:\Aqua Pro"
)

# Colors for output
function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Blue }
function Write-Success { param([string]$Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warning { param([string]$Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Error { param([string]$Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

# Secure function to convert SecureString to plain string
function Convert-SecureStringToPlainText {
    param([SecureString]$SecureString)
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureString)
    $PlainText = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
    return $PlainText
}

Write-Info "Starting AquaFarm Pro deployment process with password authentication..."

# Check if password is provided
if (-not $VpsPassword) {
    Write-Error "VpsPassword parameter is required. Please provide a SecureString password."
    Write-Info "Usage: .\deploy-with-password.ps1 -VpsPassword (Get-Credential).Password"
    exit 1
}

# Check if SSH is available
if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Error "SSH is not available. Please install OpenSSH or use WSL."
    Write-Info "Install OpenSSH: winget install OpenSSH.Client"
    exit 1
}

# Check if SCP is available
if (-not (Get-Command scp -ErrorAction SilentlyContinue)) {
    Write-Error "SCP is not available. Please install OpenSSH or use WSL."
    Write-Info "Install OpenSSH: winget install OpenSSH.Client"
    exit 1
}

# Check if local path exists
if (-not (Test-Path $LocalPath)) {
    Write-Error "Local path not found: $LocalPath"
    Write-Info "Please check the path and try again."
    exit 1
}

Write-Info "Checking basic requirements..."

# Test VPS connection with password
Write-Info "Testing VPS connection with password..."
try {
    # Convert SecureString to plain string for sshpass (done securely)
    $PlainPassword = Convert-SecureStringToPlainText -SecureString $VpsPassword
    
    $testConnection = sshpass -p $PlainPassword ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $VpsUser@$VpsHost "echo 'Connection successful'" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "VPS connection successful"
    } else {
        Write-Warning "SSH with password failed. Error: $testConnection"
        Write-Warning "Trying alternative method..."
        # Try with expect or plink
        Write-Info "You may need to install sshpass or use manual deployment"
    }
} catch {
    Write-Warning "Could not test VPS connection: $_"
    Write-Info "Continuing with manual deployment instructions..."
}

# Create deployment package
Write-Info "Creating deployment package..."
$DeployDir = "F:\Aqua Pro Deploy"
if (Test-Path $DeployDir) {
    Remove-Item -Recurse -Force $DeployDir
}
New-Item -ItemType Directory -Path $DeployDir | Out-Null

# Copy essential files
Write-Info "Copying essential files..."
$EssentialFiles = @(
    "backend",
    "frontend", 
    "infra",
    "scripts",
    "docker-compose.production.yml",
    "env.production"
)

foreach ($file in $EssentialFiles) {
    if (Test-Path "$LocalPath\$file") {
        Copy-Item -Recurse "$LocalPath\$file" "$DeployDir\" -Force
        Write-Info "Copied: $file"
    } else {
        Write-Warning "File not found: $file"
    }
}

Write-Success "Deployment package created successfully!"

# Manual deployment instructions
Write-Host ""
Write-Host "=========================================="
Write-Host "MANUAL DEPLOYMENT INSTRUCTIONS"
Write-Host "=========================================="
Write-Host ""
Write-Host "Since automated deployment requires additional tools,"
Write-Host "please follow these manual steps:"
Write-Host ""
Write-Host "1. Upload files to VPS:"
Write-Host "   scp -r `"$DeployDir`" ${VpsUser}@${VpsHost}:/opt/aquafarm/"
Write-Host ""
Write-Host "2. Connect to VPS:"
Write-Host "   ssh ${VpsUser}@${VpsHost}"
Write-Host "   Password: [SECURE - Not displayed for security]"
Write-Host ""
Write-Host "3. Run deployment on VPS:"
Write-Host "   cd /opt/aquafarm"
Write-Host "   chmod +x scripts/*.sh"
Write-Host "   ./scripts/deploy.sh"
Write-Host ""
Write-Host "4. Configure DNS in Hostinger:"
Write-Host "   - Go to Domains → aquafarm.cloud → DNS Zone"
Write-Host "   - Add A records pointing to VPS IP"
Write-Host ""
Write-Host "5. Setup SSL:"
Write-Host "   sudo apt install certbot python3-certbot-nginx"
Write-Host "   sudo certbot --nginx -d aquafarm.cloud -d api.aquafarm.cloud -d admin.aquafarm.cloud"
Write-Host ""

# Try to upload using PowerShell with password
Write-Info "Attempting to upload files using PowerShell..."
try {
    # Create a simple upload script
    $UploadScript = @"
# Upload script
`$source = `"$DeployDir`"
`$destination = `"${VpsUser}@${VpsHost}:/opt/aquafarm/`"
# Note: Password handling is now secure - use SecureString input

# Use scp with password (if sshpass is available)
scp -r `"`$source`" `$destination
"@
    
    $UploadScript | Out-File -FilePath "$DeployDir\upload.ps1" -Encoding UTF8
    Write-Info "Upload script created: $DeployDir\upload.ps1"
    
} catch {
    Write-Warning "Could not create upload script: $_"
}

# Final status
Write-Host ""
Write-Host "=========================================="
Write-Host "DEPLOYMENT PACKAGE READY!"
Write-Host "=========================================="
Write-Host ""
Write-Host "Package Location: $DeployDir"
Write-Host "VPS Details:"
Write-Host "• Host: $VpsHost"
Write-Host "• User: $VpsUser"
Write-Host "• Password: [SECURE - Not displayed for security]"
Write-Host ""
Write-Host "Next Steps:"
Write-Host "1. Upload the package to VPS"
Write-Host "2. Connect to VPS and run deployment"
Write-Host "3. Configure DNS and SSL"
Write-Host ""
Write-Host "Service URLs (after deployment):"
Write-Host "• Main Site: https://aquafarm.cloud"
Write-Host "• API: https://api.aquafarm.cloud"
Write-Host "• API Health: https://api.aquafarm.cloud/health"
Write-Host "• API Docs: https://api.aquafarm.cloud/api"
Write-Host "• Admin Panel: https://admin.aquafarm.cloud"
Write-Host "• Monitoring: https://aquafarm.cloud:3002"
Write-Host ""
Write-Host "=========================================="

Write-Success "Deployment package ready! 🎉"
Write-Info "Please follow the manual instructions above to complete deployment."
