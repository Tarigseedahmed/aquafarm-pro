# =================================
# AquaFarm Pro - Fixed Deployment Script
# =================================
# 
# Date: October 1, 2025
# Fixed deployment script for production
# =================================

param(
    [string]$VpsHost = "srv1029413.hstgr.cloud",
    [string]$VpsUser = "root",
    [string]$LocalPath = "F:\Aqua Pro"
)

# Colors for output
function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Blue }
function Write-Success { param([string]$Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warning { param([string]$Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Error { param([string]$Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

Write-Info "Starting AquaFarm Pro deployment process..."

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

# Test VPS connection first
Write-Info "Testing VPS connection..."
try {
    $testConnection = ssh -o ConnectTimeout=10 -o BatchMode=yes $VpsUser@$VpsHost "echo 'Connection successful'" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "VPS connection successful"
    } else {
        Write-Warning "VPS connection failed. Error: $testConnection"
        Write-Warning "Please check:"
        Write-Info "1. VPS is running and accessible"
        Write-Info "2. SSH key is configured"
        Write-Info "3. Firewall allows SSH connections"
        Write-Info "You can continue with manual deployment if needed."
    }
} catch {
    Write-Warning "Could not test VPS connection: $_"
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

# Upload project files to VPS
Write-Info "Uploading project files to VPS..."
$UploadCommand = "scp -r `"$DeployDir`" ${VpsUser}@${VpsHost}:/opt/aquafarm/"

Write-Info "Executing: $UploadCommand"
try {
    Invoke-Expression $UploadCommand
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Files uploaded successfully"
    } else {
        Write-Error "Upload failed with exit code: $LASTEXITCODE"
        Write-Info "Please check VPS connection and try again."
    }
} catch {
    Write-Error "Failed to upload files: $_"
    Write-Info "Manual upload command:"
    Write-Info "scp -r `"$DeployDir`" ${VpsUser}@${VpsHost}:/opt/aquafarm/"
}

# Connect to VPS and run deployment
Write-Info "Connecting to VPS and running deployment..."
$DeployCommand = @"
ssh ${VpsUser}@${VpsHost} "
cd /opt/aquafarm &&
chmod +x scripts/*.sh &&
./scripts/deploy.sh
"
"@

Write-Info "Running deployment on VPS..."
Write-Host "=========================================="
Write-Host "Deployment will now run on VPS"
Write-Host "This may take several minutes..."
Write-Host "=========================================="

try {
    Invoke-Expression $DeployCommand
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Deployment completed successfully on VPS"
    } else {
        Write-Error "Deployment failed with exit code: $LASTEXITCODE"
        Write-Info "Please check VPS logs and try again."
    }
} catch {
    Write-Error "Failed to deploy on VPS: $_"
    Write-Warning "Please check VPS connection and run deployment manually"
}

# Cleanup
Write-Info "Cleaning up temporary files..."
Remove-Item -Recurse -Force $DeployDir -ErrorAction SilentlyContinue

# Final status
Write-Host ""
Write-Host "=========================================="
Write-Host "Deployment process completed!"
Write-Host "=========================================="
Write-Host ""
Write-Host "Service URLs:"
Write-Host "• Main Site: https://aquafarm.cloud"
Write-Host "• API: https://api.aquafarm.cloud"
Write-Host "• API Health: https://api.aquafarm.cloud/health"
Write-Host "• API Docs: https://api.aquafarm.cloud/api"
Write-Host "• Admin Panel: https://admin.aquafarm.cloud"
Write-Host "• Monitoring: https://aquafarm.cloud:3002"
Write-Host ""
Write-Host "Admin Information:"
Write-Host "• Admin Email: admin@aquafarm.cloud"
Write-Host "• Admin Password: AquaFarm2025AdminPassword"
Write-Host ""
Write-Host "Useful Commands:"
Write-Host "• Check Services: ssh ${VpsUser}@${VpsHost} 'cd /opt/aquafarm && docker-compose -f docker-compose.production.yml ps'"
Write-Host "• View Logs: ssh ${VpsUser}@${VpsHost} 'cd /opt/aquafarm && docker-compose -f docker-compose.production.yml logs -f'"
Write-Host "• Restart: ssh ${VpsUser}@${VpsHost} 'cd /opt/aquafarm && docker-compose -f docker-compose.production.yml restart'"
Write-Host ""
Write-Host "=========================================="

Write-Success "Deployment process completed! 🎉"
