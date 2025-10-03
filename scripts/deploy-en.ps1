# =================================
# AquaFarm Pro - Production Deployment Script (PowerShell)
# =================================
# 
# Date: October 1, 2025
# Automated deployment script for production (Windows)
# =================================

param(
    [string]$VpsHost = "srv1029413.hstgr.cloud",
    [string]$VpsUser = "root",
    [string]$LocalPath = "F:\Aqua Pro"
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

Write-Status "Starting AquaFarm Pro deployment process..."

# Check if SSH is available
if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Error "SSH is not available. Please install OpenSSH or use WSL."
    exit 1
}

# Check if SCP is available
if (-not (Get-Command scp -ErrorAction SilentlyContinue)) {
    Write-Error "SCP is not available. Please install OpenSSH or use WSL."
    exit 1
}

# Check if local path exists
if (-not (Test-Path $LocalPath)) {
    Write-Error "Local path not found: $LocalPath"
    exit 1
}

Write-Status "Checking basic requirements..."

# Upload project files to VPS
Write-Status "Uploading project files to VPS..."
$UploadCommand = "scp -r `"$LocalPath`" ${VpsUser}@${VpsHost}:/opt/aquafarm/"
Write-Status "Executing command: $UploadCommand"

try {
    Invoke-Expression $UploadCommand
    Write-Success "Files uploaded successfully"
} catch {
    Write-Error "Failed to upload files: $_"
    exit 1
}

# Connect to VPS and run deployment
Write-Status "Connecting to VPS and running deployment..."
$DeployCommand = @"
ssh ${VpsUser}@${VpsHost} "
cd /opt/aquafarm &&
chmod +x scripts/*.sh &&
./scripts/deploy.sh
"
"@

Write-Status "Running deployment on VPS..."
Write-Host "=========================================="
Write-Host "Deployment will now run on VPS"
Write-Host "This may take several minutes..."
Write-Host "=========================================="

try {
    Invoke-Expression $DeployCommand
    Write-Success "Deployment completed successfully on VPS"
} catch {
    Write-Error "Failed to deploy on VPS: $_"
    Write-Warning "Please check VPS connection and run deployment manually"
}

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

Write-Success "Deployment completed successfully! 🎉"


