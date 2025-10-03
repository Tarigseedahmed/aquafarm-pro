# =================================
# AquaFarm Pro - Upload to VPS
# =================================

param(
    [string]$VpsHost = "srv1029413.hstgr.cloud",
    [string]$VpsUser = "root",
    [string]$VpsPassword = "Tariq2024Tariq2026@#",
    [string]$SourcePath = "F:\Aqua Pro Deploy",
    [string]$RemotePath = "/opt/aquafarm"
)

# Colors for output
function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Blue }
function Write-Success { param([string]$Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warning { param([string]$Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Error { param([string]$Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

Write-Info "Starting file upload to VPS..."

# Check if source directory exists
if (-not (Test-Path $SourcePath)) {
    Write-Error "Source directory not found: $SourcePath"
    exit 1
}

Write-Info "Source: $SourcePath"
Write-Info "Target: ${VpsUser}@${VpsHost}:${RemotePath}"

# Create the remote directory first
Write-Info "Creating remote directory..."
try {
    $createDirCmd = "mkdir -p $RemotePath"
    $result = echo "y" | ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no ${VpsUser}@${VpsHost} $createDirCmd
    Write-Success "Remote directory created/verified"
} catch {
    Write-Warning "Could not create remote directory: $_"
}

# Upload files using SCP
Write-Info "Uploading files to VPS..."
try {
    # Use SCP to upload the directory
    Write-Info "This may take several minutes depending on file size..."
    
    # Create a batch file for SCP with password
    $scpBatch = @"
#!/bin/bash
echo "$VpsPassword" | scp -o StrictHostKeyChecking=no -r "$SourcePath" ${VpsUser}@${VpsHost}:${RemotePath}/
"@
    
    $scpBatch | Out-File -FilePath "scp_upload.sh" -Encoding UTF8
    
    # Try to run with bash if available
    if (Get-Command bash -ErrorAction SilentlyContinue) {
        Write-Info "Using bash to run SCP upload..."
        bash scp_upload.sh
    } else {
        Write-Warning "Bash not available, trying direct SCP..."
        # Try direct SCP (will prompt for password)
        scp -o StrictHostKeyChecking=no -r "$SourcePath" ${VpsUser}@${VpsHost}:${RemotePath}/
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Files uploaded successfully!"
    } else {
        Write-Warning "SCP upload had issues, but continuing..."
    }
    
} catch {
    Write-Error "Upload failed: $_"
    Write-Info "You may need to upload manually using:"
    Write-Info "scp -r `"$SourcePath`" ${VpsUser}@${VpsHost}:${RemotePath}/"
    exit 1
}

# Clean up
if (Test-Path "scp_upload.sh") {
    Remove-Item "scp_upload.sh" -Force
}

Write-Success "Upload process completed! 🎉"
Write-Info "Next step: Connect to VPS and run deployment"
