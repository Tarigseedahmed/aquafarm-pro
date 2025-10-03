# AquaFarm Pro Hostinger Deployment Script (PowerShell)
param(
    [string]$SSH_HOST = "72.60.187.58",
    [string]$SSH_USER = "root",
    [string]$DOMAIN = "srv1029413.hstgr.cloud",
    [int]$SSH_PORT = 22,
    [string]$DEPLOY_PATH = "/home/root/aquafarm-pro"
)

Write-Host "🚀 Starting AquaFarm Pro Hostinger Deployment..." -ForegroundColor Green
Write-Host "📡 Target: $SSH_USER@$SSH_HOST`:$SSH_PORT" -ForegroundColor Cyan
Write-Host "🌐 Domain: $DOMAIN" -ForegroundColor Cyan

# Check if required tools are available
Write-Host "🔍 Checking dependencies..." -ForegroundColor Yellow

$requiredTools = @("ssh", "scp", "tar")
$missingTools = @()

foreach ($tool in $requiredTools) {
    if (!(Get-Command $tool -ErrorAction SilentlyContinue)) {
        $missingTools += $tool
    }
}

if ($missingTools.Count -gt 0) {
    Write-Host "❌ Missing tools: $($missingTools -join ', ')" -ForegroundColor Red
    Write-Host "Please install Git for Windows or WSL to get SSH tools" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ All dependencies are available" -ForegroundColor Green

# Test SSH connection
Write-Host "🔐 Testing SSH connection..." -ForegroundColor Yellow
try {
    $sshTest = ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p $SSH_PORT "$SSH_USER@$SSH_HOST" "echo 'SSH connection successful'"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SSH connection successful" -ForegroundColor Green
    } else {
        Write-Host "❌ SSH connection failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ SSH connection failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Create deployment archive
Write-Host "📦 Creating deployment archive..." -ForegroundColor Yellow
$archiveName = "aquafarm-pro-$(Get-Date -Format 'yyyyMMdd-HHmmss').tar.gz"

try {
    # Use Git Bash tar if available, otherwise use system tar
    if (Get-Command "tar" -ErrorAction SilentlyContinue) {
        tar -czf $archiveName `
            --exclude='node_modules' `
            --exclude='.git' `
            --exclude='*.log' `
            --exclude='uploads/*' `
            --exclude='logs/*' `
            --exclude='backups/*' `
            .
        Write-Host "✅ Archive created: $archiveName" -ForegroundColor Green
    } else {
        Write-Host "❌ tar command not found" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Failed to create archive: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Upload to server
Write-Host "📤 Uploading to server..." -ForegroundColor Yellow
try {
    scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -P $SSH_PORT $archiveName "$SSH_USER@$SSH_HOST`:$DEPLOY_PATH/"
    Write-Host "✅ Upload successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Upload failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Deploy on server
Write-Host "🚀 Deploying on server..." -ForegroundColor Yellow
$deployScript = @'
#!/bin/bash
set -e

echo "📁 Setting up deployment directory..."
mkdir -p /home/root/aquafarm-pro
cd /home/root/aquafarm-pro

echo "📦 Extracting files..."
tar -xzf aquafarm-pro-*.tar.gz
rm aquafarm-pro-*.tar.gz

echo "🐳 Setting up Docker..."
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    apt update && apt install -y docker.io docker-compose
    systemctl start docker
    systemctl enable docker
fi

echo "🔧 Creating environment file..."
cat > .env << 'ENVEOF'
# AquaFarm Pro Environment Variables
NODE_ENV=production
DOMAIN=srv1029413.hstgr.cloud

# Database Configuration
DB_TYPE=postgres
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=aquafarm_user
DB_PASSWORD=aquafarm_secure_password_2024
DB_DATABASE=aquafarm_production

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_secure_password_2024

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here_2024
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_key_here_2024
JWT_REFRESH_EXPIRES_IN=7d

# Security Configuration
BCRYPT_SALT_ROUNDS=12
CORS_ORIGINS=https://srv1029413.hstgr.cloud,https://www.srv1029413.hstgr.cloud

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000
ENVEOF

echo "🚀 Starting services..."
docker-compose -f docker-compose.hostinger.yml down || true
docker-compose -f docker-compose.hostinger.yml up -d --build

echo "⏳ Waiting for services to start..."
sleep 60

echo "🔍 Checking service status..."
docker-compose -f docker-compose.hostinger.yml ps

echo "✅ Deployment completed!"
echo "🌐 Application should be available at: http://srv1029413.hstgr.cloud"
echo "📊 Monitoring available at:"
echo "   - Prometheus: http://srv1029413.hstgr.cloud:9090"
echo "   - Grafana: http://srv1029413.hstgr.cloud:3000"
'@

# Save deploy script to temporary file
$tempScript = [System.IO.Path]::GetTempFileName() + ".sh"
$deployScript | Out-File -FilePath $tempScript -Encoding UTF8

try {
    # Upload and execute deploy script
    scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -P $SSH_PORT $tempScript "$SSH_USER@$SSH_HOST`:/tmp/deploy.sh"
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p $SSH_PORT "$SSH_USER@$SSH_HOST" "chmod +x /tmp/deploy.sh && /tmp/deploy.sh"
    
    Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
    Write-Host "🌐 Application URL: http://srv1029413.hstgr.cloud" -ForegroundColor Cyan
    Write-Host "📊 Monitoring:" -ForegroundColor Cyan
    Write-Host "   - Prometheus: http://srv1029413.hstgr.cloud:9090" -ForegroundColor White
    Write-Host "   - Grafana: http://srv1029413.hstgr.cloud:3000" -ForegroundColor White
    
} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Cleanup
    if (Test-Path $tempScript) { Remove-Item $tempScript }
    if (Test-Path $archiveName) { Remove-Item $archiveName }
}

Write-Host "🎉 AquaFarm Pro deployment completed!" -ForegroundColor Green
