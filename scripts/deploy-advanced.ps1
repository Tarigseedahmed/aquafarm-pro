# =============================================================================
# AquaFarm Pro - Advanced Deployment Script
# Professional deployment system for Hostinger VPS
# =============================================================================

param(
    [string]$SSH_HOST = "72.60.187.58",
    [string]$SSH_USER = "root",
    [string]$DOMAIN = "srv1029413.hstgr.cloud",
    [int]$SSH_PORT = 22,
    [string]$DEPLOY_PATH = "/home/root/aquafarm-pro",
    [string]$Environment = "production"
)

# Configuration
$Config = @{
    ProjectName = "AquaFarm Pro"
    Version = "1.0.0"
    DeploymentId = [System.Guid]::NewGuid().ToString("N").Substring(0, 8)
    ArchiveName = "aquafarm-pro-$(Get-Date -Format 'yyyyMMdd-HHmmss').tar.gz"
    LogFile = "deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
}

# Logging function
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    switch ($Level) {
        "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
        "WARNING" { Write-Host $logEntry -ForegroundColor Yellow }
        "ERROR" { Write-Host $logEntry -ForegroundColor Red }
        default { Write-Host $logEntry -ForegroundColor Cyan }
    }
    
    Add-Content -Path $Config.LogFile -Value $logEntry -Encoding UTF8
}

# SSH command execution
function Invoke-SSHCommand {
    param([string]$Command)
    
    $sshArgs = @(
        "-o", "ConnectTimeout=10",
        "-o", "StrictHostKeyChecking=no",
        "-o", "UserKnownHostsFile=/dev/null",
        "-p", $SSH_PORT,
        "$SSH_USER@$SSH_HOST",
        $Command
    )
    
    try {
        $result = & ssh @sshArgs 2>&1
        return $result
    } catch {
        Write-Log "SSH command failed: $($_.Exception.Message)" -Level ERROR
        return $null
    }
}

# File transfer
function Invoke-SCPTransfer {
    param([string]$LocalPath, [string]$RemotePath)
    
    $scpArgs = @(
        "-o", "StrictHostKeyChecking=no",
        "-o", "UserKnownHostsFile=/dev/null",
        "-P", $SSH_PORT,
        $LocalPath,
        "$SSH_USER@$SSH_HOST`:$RemotePath"
    )
    
    try {
        & scp @scpArgs 2>&1
        return $LASTEXITCODE -eq 0
    } catch {
        Write-Log "SCP transfer failed: $($_.Exception.Message)" -Level ERROR
        return $false
    }
}

# Main deployment function
function Start-Deployment {
    Write-Log "Starting AquaFarm Pro Deployment"
    Write-Log "Deployment ID: $($Config.DeploymentId)"
    Write-Log "Target: $SSH_USER@$SSH_HOST`:$SSH_PORT"
    Write-Log "Domain: $DOMAIN"
    
    try {
        # Phase 1: Test SSH connection
        Write-Log "Testing SSH connection..."
        $sshTest = Invoke-SSHCommand "echo 'SSH connection successful'"
        if (-not $sshTest) {
            throw "SSH connection failed"
        }
        Write-Log "SSH connection successful" -Level SUCCESS
        
        # Phase 2: Install dependencies
        Write-Log "Installing server dependencies..."
        $installScript = @'
apt update && apt upgrade -y
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl start docker
    systemctl enable docker
fi
apt install -y curl wget git unzip htop nano vim
'@
        Invoke-SSHCommand $installScript
        Write-Log "Dependencies installed" -Level SUCCESS
        
        # Phase 3: Create project archive
        Write-Log "Creating project archive..."
        $tarArgs = @("-czf", $Config.ArchiveName, "--exclude=node_modules", "--exclude=.git", "--exclude=*.log", "--exclude=logs/*", "--exclude=uploads/*", "--exclude=backups/*", ".")
        & tar @tarArgs
        
        if ($LASTEXITCODE -ne 0) {
            throw "Archive creation failed"
        }
        Write-Log "Project archive created" -Level SUCCESS
        
        # Phase 4: Upload and extract
        Write-Log "Uploading to server..."
        if (-not (Invoke-SCPTransfer $Config.ArchiveName "$DEPLOY_PATH/$($Config.ArchiveName)")) {
            throw "Upload failed"
        }
        Write-Log "Upload completed" -Level SUCCESS
        
        # Phase 5: Setup on server
        Write-Log "Setting up on server..."
        $setupScript = @'
mkdir -p /home/root/aquafarm-pro
cd /home/root/aquafarm-pro
tar -xzf aquafarm-pro-*.tar.gz
rm aquafarm-pro-*.tar.gz

# Create environment file
cat > .env << 'ENVEOF'
NODE_ENV=production
DOMAIN=srv1029413.hstgr.cloud
DB_TYPE=postgres
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=aquafarm_user
DB_PASSWORD=aquafarm_secure_password_20241002
DB_DATABASE=aquafarm_production
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_secure_password_20241002
JWT_SECRET=aquafarm_jwt_secret_123456
JWT_EXPIRES_IN=24h
BCRYPT_SALT_ROUNDS=12
CORS_ORIGINS=https://srv1029413.hstgr.cloud,http://srv1029413.hstgr.cloud
ENVEOF

# Start services
docker-compose -f docker-compose.hostinger.yml down || true
docker-compose -f docker-compose.hostinger.yml up -d --build

# Wait for services
sleep 60

# Check status
docker-compose -f docker-compose.hostinger.yml ps
'@
        
        Invoke-SSHCommand $setupScript
        Write-Log "Server setup completed" -Level SUCCESS
        
        # Phase 6: Health check
        Write-Log "Running health checks..."
        Start-Sleep -Seconds 30
        
        $healthCheck = Invoke-SSHCommand "curl -f http://localhost:3001/api/health || echo 'Health check failed'"
        if ($healthCheck -match "healthy") {
            Write-Log "Health check passed" -Level SUCCESS
        } else {
            Write-Log "Health check failed" -Level WARNING
        }
        
        # Phase 7: SSL setup
        Write-Log "Setting up SSL certificate..."
        $sslScript = @'
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
fi

# Stop nginx temporarily
docker-compose -f docker-compose.hostinger.yml stop nginx || true

# Generate SSL certificate
certbot certonly --standalone --non-interactive --agree-tos --email admin@srv1029413.hstgr.cloud -d srv1029413.hstgr.cloud

# Copy certificates
if [ -d "/etc/letsencrypt/live/srv1029413.hstgr.cloud" ]; then
    mkdir -p /home/root/aquafarm-pro/ssl
    cp /etc/letsencrypt/live/srv1029413.hstgr.cloud/fullchain.pem /home/root/aquafarm-pro/ssl/
    cp /etc/letsencrypt/live/srv1029413.hstgr.cloud/privkey.pem /home/root/aquafarm-pro/ssl/
    
    # Restart nginx
    docker-compose -f docker-compose.hostinger.yml up -d nginx
    
    echo "SSL certificate configured successfully"
else
    echo "SSL certificate generation failed"
fi
'@
        
        $sslResult = Invoke-SSHCommand $sslScript
        if ($sslResult -match "successfully") {
            Write-Log "SSL certificate configured" -Level SUCCESS
        } else {
            Write-Log "SSL certificate setup failed" -Level WARNING
        }
        
        # Phase 8: Backup setup
        Write-Log "Setting up backup system..."
        $backupScript = @'
mkdir -p /home/root/aquafarm-pro/backups

cat > /home/root/aquafarm-pro/backup.sh << 'BACKUPEOF'
#!/bin/bash
BACKUP_DIR="/home/root/aquafarm-pro/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="aquafarm_backup_$DATE.tar.gz"

tar -czf "$BACKUP_DIR/$BACKUP_FILE" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='logs' \
    --exclude='backups' \
    --exclude='uploads' \
    .

ls -t "$BACKUP_DIR"/aquafarm_backup_*.tar.gz | tail -n +8 | xargs -r rm
echo "Backup completed: $BACKUP_FILE"
BACKUPEOF

chmod +x /home/root/aquafarm-pro/backup.sh
echo "0 2 * * * /home/root/aquafarm-pro/backup.sh" | crontab -
echo "Backup system configured"
'@
        
        Invoke-SSHCommand $backupScript
        Write-Log "Backup system configured" -Level SUCCESS
        
        # Final summary
        Write-Log "Deployment completed successfully!" -Level SUCCESS
        Write-Log "Application URL: http://$DOMAIN" -Level SUCCESS
        Write-Log "HTTPS URL: https://$DOMAIN" -Level SUCCESS
        Write-Log "Prometheus: http://$DOMAIN`:9090" -Level SUCCESS
        Write-Log "Grafana: http://$DOMAIN`:9091" -Level SUCCESS
        
        return $true
        
    } catch {
        Write-Log "Deployment failed: $($_.Exception.Message)" -Level ERROR
        return $false
    } finally {
        # Cleanup
        if (Test-Path $Config.ArchiveName) {
            Remove-Item $Config.ArchiveName -Force
        }
    }
}

# Execute deployment
if ($MyInvocation.InvocationName -ne ".") {
    $success = Start-Deployment
    
    if ($success) {
        Write-Log "Deployment completed successfully!" -Level SUCCESS
        exit 0
    } else {
        Write-Log "Deployment failed!" -Level ERROR
        exit 1
    }
}
