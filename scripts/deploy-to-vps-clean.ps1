# AquaFarm Pro - VPS Hostinger Deployment Script
# Quick and secure deployment to Hostinger VPS

param(
    [switch]$SkipBackup = $false,
    [switch]$SkipBuild = $false,
    [switch]$Verbose = $false
)

# Configuration
$VPS_IP = "72.60.187.58"
$VPS_USER = "root"
$VPS_HOSTNAME = "srv1029413.hstgr.cloud"
$DEPLOY_PATH = "/root/aquafarm-pro"
$PROJECT_NAME = "aquafarm-pro"

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Info($message) {
    Write-ColorOutput Blue "[INFO] $message"
}

function Write-Success($message) {
    Write-ColorOutput Green "[SUCCESS] $message"
}

function Write-Warning($message) {
    Write-ColorOutput Yellow "[WARNING] $message"
}

function Write-Error-Message($message) {
    Write-ColorOutput Red "[ERROR] $message"
}

# Test SSH connection
function Test-SSHConnection {
    Write-Info "Testing VPS connection..."

    # Check if ssh is available
    if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
        Write-Error-Message "SSH not available. Please install OpenSSH."
        return $false
    }

    # Try connection
    $result = ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_IP}" "echo 'Connected'" 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Successfully connected to VPS"
        return $true
    } else {
        Write-Error-Message "VPS connection failed"
        Write-Info "Please check:"
        Write-Info "  1. Your internet connection"
        Write-Info "  2. IP address: $VPS_IP"
        Write-Info "  3. Username: $VPS_USER"
        return $false
    }
}

# Setup server environment
function Setup-ServerEnvironment {
    Write-Info "Setting up server environment..."

    $setupScript = @'
#!/bin/bash
set -e

echo "Updating system..."
apt update && apt upgrade -y

echo "Installing essential tools..."
apt install -y curl wget git htop nano ufw net-tools

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
    echo "Docker installed successfully"
else
    echo "Docker already installed"
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose installed successfully"
else
    echo "Docker Compose already installed"
fi

# Setup firewall
echo "Setting up firewall..."
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw reload

# Create project directories
echo "Creating project directories..."
mkdir -p /root/aquafarm-pro
mkdir -p /root/aquafarm-pro/uploads
mkdir -p /root/aquafarm-pro/logs
mkdir -p /root/aquafarm-pro/backups
mkdir -p /root/aquafarm-pro/ssl
mkdir -p /root/aquafarm-pro/prometheus
mkdir -p /root/aquafarm-pro/grafana

# Set permissions
chmod 755 /root/aquafarm-pro
chmod 755 /root/aquafarm-pro/uploads
chmod 755 /root/aquafarm-pro/logs
chmod 755 /root/aquafarm-pro/backups
chmod 700 /root/aquafarm-pro/ssl

echo "Server environment setup completed successfully"
'@

    $setupScript | ssh "${VPS_USER}@${VPS_IP}" "bash -s"

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Server environment setup successful"
        return $true
    } else {
        Write-Error-Message "Server environment setup failed"
        return $false
    }
}

# تحضير الملفات للنشر
function Prepare-DeploymentFiles {
    Write-Info "Preparing deployment files..."

    $deployDir = "$PSScriptRoot\..\deploy-temp"

    # Create temporary directory
    if (Test-Path $deployDir) {
        Remove-Item -Path $deployDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $deployDir -Force | Out-Null

    # Copy necessary files
    Write-Info "Copying files..."

    $filesToCopy = @(
        "docker-compose.hostinger.yml",
        "env.hostinger.production",
        "backend",
        "frontend",
        "infra",
        "scripts"
    )

    foreach ($item in $filesToCopy) {
        $sourcePath = Join-Path $PSScriptRoot "..\$item"
        $destPath = Join-Path $deployDir $item

        if (Test-Path $sourcePath) {
            Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
            Write-Info "  [OK] Copied: $item"
        } else {
            Write-Warning "  [SKIP] Not found: $item"
        }
    }

    # Create archive
    Write-Info "Creating deployment archive..."
    $archivePath = Join-Path $PSScriptRoot "aquafarm-deploy.tar.gz"

    if (Test-Path $archivePath) {
        Remove-Item -Path $archivePath -Force
    }

    # Use tar to compress (available in Windows 10+)
    Push-Location $deployDir
    tar -czf $archivePath *
    Pop-Location

    # Delete temporary directory
    Remove-Item -Path $deployDir -Recurse -Force

    Write-Success "Deployment files prepared: $archivePath"
    return $archivePath
}

# رفع الملفات إلى الخادم
function Upload-Files($archivePath) {
    Write-Info "Uploading files to server..."

    if (-not (Test-Path $archivePath)) {
        Write-Error-Message "Archive file not found: $archivePath"
        return $false
    }

    # Upload archive
    scp -o StrictHostKeyChecking=no "$archivePath" "${VPS_USER}@${VPS_IP}:${DEPLOY_PATH}/aquafarm-deploy.tar.gz"

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Files uploaded successfully"

        # Extract files on server
        Write-Info "Extracting files on server..."
        ssh "${VPS_USER}@${VPS_IP}" "cd ${DEPLOY_PATH} && tar -xzf aquafarm-deploy.tar.gz && rm aquafarm-deploy.tar.gz"

        if ($LASTEXITCODE -eq 0) {
            Write-Success "Files extracted successfully"
            return $true
        }
    }

    Write-Error-Message "File upload failed"
    return $false
}

# إعداد ملف البيئة
function Setup-Environment {
    Write-Info "Setting up environment variables..."

    $envScript = @"
cd ${DEPLOY_PATH}

# Copy environment file
if [ -f env.hostinger.production ]; then
    cp env.hostinger.production .env
    echo "Environment file copied"
else
    echo "Warning: Environment file not found"
fi

# Update sensitive values
sed -i 's/srv1029413.hstgr.cloud/${VPS_IP}/g' .env || true
sed -i 's/srv1029413.hstgr.cloud/${VPS_HOSTNAME}/g' .env || true

echo "Environment setup completed"
"@

    $envScript | ssh "${VPS_USER}@${VPS_IP}" "bash -s"

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Environment variables setup successful"
        return $true
    }

    Write-Error-Message "Environment setup failed"
    return $false
}

# إعداد شهادات SSL
function Setup-SSL {
    Write-Info "Setting up SSL certificates..."

    $sslScript = @"
cd ${DEPLOY_PATH}/ssl

# Create self-signed certificate for initial setup
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout key.pem \
    -out cert.pem \
    -subj "/C=SA/ST=State/L=City/O=AquaFarm Pro/CN=${VPS_HOSTNAME}"

chmod 600 key.pem
chmod 644 cert.pem

echo "SSL certificates created successfully"
"@

    $sslScript | ssh "${VPS_USER}@${VPS_IP}" "bash -s"

    if ($LASTEXITCODE -eq 0) {
        Write-Success "SSL certificates setup successful"
        Write-Info "Note: You can replace them with Let's Encrypt certificate later"
        return $true
    }

    Write-Warning "Warning: SSL certificate setup failed"
    return $false
}

# نشر التطبيق
function Deploy-Application {
    Write-Info "Deploying application..."

    $deployScript = @"
cd ${DEPLOY_PATH}

# Stop old containers if any
echo "Stopping old containers..."
docker-compose -f docker-compose.hostinger.yml down || true

# Remove old images
echo "Cleaning old images..."
docker system prune -f

# Build and start containers
echo "Building and starting new containers..."
docker-compose -f docker-compose.hostinger.yml up -d --build

# Wait for application to start
echo "Waiting for application to start..."
sleep 30

# Check container status
echo ""
echo "=== Container Status ==="
docker-compose -f docker-compose.hostinger.yml ps

echo ""
echo "=== Backend Logs ==="
docker logs aquafarm-backend --tail 20

echo ""
echo "Deployment completed successfully!"
"@

    $deployScript | ssh "${VPS_USER}@${VPS_IP}" "bash -s"

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Application deployed successfully!"
        return $true
    }

    Write-Error-Message "Application deployment failed"
    return $false
}

# Display deployment information
function Show-DeploymentInfo {
    Write-Success "`n=========================================="
    Write-Success "   Deployment Successful! 🎉"
    Write-Success "=========================================="
    Write-Info ""
    Write-Info "Access Information:"
    Write-Info "  🌐 Website: http://${VPS_IP}"
    Write-Info "  🔗 API: http://${VPS_IP}/api"
    Write-Info "  📚 API Docs: http://${VPS_IP}/api/docs"
    Write-Info "  💚 Health Check: http://${VPS_IP}/health"
    Write-Info ""
    Write-Info "Server Information:"
    Write-Info "  🖥️  IP: ${VPS_IP}"
    Write-Info "  🔑 SSH: ssh ${VPS_USER}@${VPS_IP}"
    Write-Info "  📁 Path: ${DEPLOY_PATH}"
    Write-Info ""
    Write-Info "Useful Commands:"
    Write-Info "  View logs: ssh ${VPS_USER}@${VPS_IP}"
    Write-Info "  Restart: ssh ${VPS_USER}@${VPS_IP}"
    Write-Info "  Container status: ssh ${VPS_USER}@${VPS_IP}"
    Write-Info ""
    Write-Warning "Note: Use Let's Encrypt for real SSL certificate in production"
    Write-Success "=========================================="
}

# Main program
function Main {
    Write-Info "=========================================="
    Write-Info "   AquaFarm Pro - VPS Deployment"
    Write-Info "=========================================="
    Write-Info ""

    # 1. Test connection
    if (-not (Test-SSHConnection)) {
        Write-Error-Message "VPS connection failed. Deployment stopped."
        exit 1
    }

    # 2. Setup server environment
    if (-not (Setup-ServerEnvironment)) {
        Write-Error-Message "Server environment setup failed. Deployment stopped."
        exit 1
    }

    # 3. Prepare files
    $archivePath = Prepare-DeploymentFiles
    if (-not $archivePath -or -not (Test-Path $archivePath)) {
        Write-Error-Message "File preparation failed. Deployment stopped."
        exit 1
    }

    # 4. Upload files
    if (-not (Upload-Files $archivePath)) {
        Write-Error-Message "File upload failed. Deployment stopped."
        exit 1
    }

    # 5. Setup environment
    if (-not (Setup-Environment)) {
        Write-Warning "Warning: There may be issues with environment setup"
    }

    # 6. Setup SSL
    Setup-SSL | Out-Null

    # 7. Deploy application
    if (-not (Deploy-Application)) {
        Write-Error-Message "Application deployment failed."
        exit 1
    }

    # 8. Delete local archive
    if (Test-Path $archivePath) {
        Remove-Item -Path $archivePath -Force
    }

    # 9. Show deployment information
    Show-DeploymentInfo
}

# Run main program
Main
