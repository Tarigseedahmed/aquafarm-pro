# =============================================================================
# AquaFarm Pro - Professional Deployment System
# Advanced PowerShell Deployment Script for Hostinger VPS
# =============================================================================

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$SSH_HOST = "72.60.187.58",
    
    [Parameter(Mandatory = $false)]
    [string]$SSH_USER = "root",
    
    [Parameter(Mandatory = $false)]
    [string]$DOMAIN = "srv1029413.hstgr.cloud",
    
    [Parameter(Mandatory = $false)]
    [int]$SSH_PORT = 22,
    
    [Parameter(Mandatory = $false)]
    [string]$DEPLOY_PATH = "/home/root/aquafarm-pro",
    
    [Parameter(Mandatory = $false)]
    [switch]$SkipDependencies,
    
    [Parameter(Mandatory = $false)]
    [switch]$SkipSSL,
    
    [Parameter(Mandatory = $false)]
    [switch]$SkipMonitoring,
    
    [Parameter(Mandatory = $false)]
    [switch]$ForceRebuild,
    
    [Parameter(Mandatory = $false)]
    [string]$Environment = "production"
)

# =============================================================================
# Configuration and Constants
# =============================================================================

$Script:Config = @{
    ProjectName = "AquaFarm Pro"
    Version = "1.0.0"
    DeploymentId = [System.Guid]::NewGuid().ToString("N").Substring(0, 8)
    LogFile = "deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
    ArchiveName = "aquafarm-pro-$(Get-Date -Format 'yyyyMMdd-HHmmss').tar.gz"
    TempDir = [System.IO.Path]::GetTempPath()
    RequiredTools = @("ssh", "scp", "tar", "gzip")
    RequiredPorts = @(22, 80, 443, 3000, 3001, 5432, 6379, 9090, 9091)
    HealthCheckEndpoints = @(
        @{ Path = "/api/health"; Port = 3001; Service = "Backend" },
        @{ Path = "/"; Port = 3000; Service = "Frontend" },
        @{ Path = "/api/metrics"; Port = 9090; Service = "Prometheus" },
        @{ Path = "/"; Port = 9091; Service = "Grafana" }
    )
}

# =============================================================================
# Logging System
# =============================================================================

function Write-Log {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message,
        
        [Parameter(Mandatory = $false)]
        [ValidateSet("INFO", "SUCCESS", "WARNING", "ERROR", "DEBUG")]
        [string]$Level = "INFO",
        
        [Parameter(Mandatory = $false)]
        [switch]$NoConsole
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    if (-not $NoConsole) {
        switch ($Level) {
            "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
            "WARNING" { Write-Host $logEntry -ForegroundColor Yellow }
            "ERROR" { Write-Host $logEntry -ForegroundColor Red }
            "DEBUG" { Write-Host $logEntry -ForegroundColor Gray }
            default { Write-Host $logEntry -ForegroundColor Cyan }
        }
    }
    
    # Write to log file
    Add-Content -Path $Script:Config.LogFile -Value $logEntry -Encoding UTF8
}

function Write-Section {
    param([string]$Title)
    Write-Log ""
    Write-Log "=" * 60
    Write-Log $Title
    Write-Log "=" * 60
}

# =============================================================================
# Validation and Dependencies
# =============================================================================

function Test-SystemRequirements {
    Write-Section "System Requirements Check"
    
    # Check PowerShell version
    if ($PSVersionTable.PSVersion.Major -lt 5) {
        Write-Log "PowerShell 5.0 or higher is required" -Level ERROR
        return $false
    }
    Write-Log "PowerShell Version: $($PSVersionTable.PSVersion)" -Level SUCCESS
    
    # Check required tools
    $missingTools = @()
    foreach ($tool in $Script:Config.RequiredTools) {
        if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
            $missingTools += $tool
        } else {
            Write-Log "Tool '$tool' is available" -Level SUCCESS
        }
    }
    
    if ($missingTools.Count -gt 0) {
        Write-Log "Missing required tools: $($missingTools -join ', ')" -Level ERROR
        Write-Log "Please install Git for Windows or WSL to get these tools" -Level WARNING
        return $false
    }
    
    # Check available disk space
    $drive = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"
    $freeSpaceGB = [math]::Round($drive.FreeSpace / 1GB, 2)
    if ($freeSpaceGB -lt 2) {
        Write-Log "Insufficient disk space. Required: 2GB, Available: ${freeSpaceGB}GB" -Level WARNING
    } else {
        Write-Log "Disk space check passed: ${freeSpaceGB}GB available" -Level SUCCESS
    }
    
    return $true
}

function Test-NetworkConnectivity {
    Write-Section "Network Connectivity Check"
    
    # Test SSH host connectivity
    try {
        $ping = Test-NetConnection -ComputerName $SSH_HOST -Port $SSH_PORT -WarningAction SilentlyContinue
        if ($ping.TcpTestSucceeded) {
            Write-Log "SSH connectivity to $SSH_HOST`:$SSH_PORT successful" -Level SUCCESS
        } else {
            Write-Log "SSH connectivity to $SSH_HOST`:$SSH_PORT failed" -Level ERROR
            return $false
        }
    } catch {
        Write-Log "Network connectivity test failed: $($_.Exception.Message)" -Level ERROR
        return $false
    }
    
    # Test internet connectivity
    try {
        $dnsTest = Test-NetConnection -ComputerName "8.8.8.8" -Port 53 -WarningAction SilentlyContinue
        if ($dnsTest.TcpTestSucceeded) {
            Write-Log "Internet connectivity verified" -Level SUCCESS
        } else {
            Write-Log "Internet connectivity issues detected" -Level WARNING
        }
    } catch {
        Write-Log "Internet connectivity test failed" -Level WARNING
    }
    
    return $true
}

# =============================================================================
# SSH Operations
# =============================================================================

function Invoke-SSHCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command,
        
        [Parameter(Mandatory = $false)]
        [int]$TimeoutSeconds = 300,
        
        [Parameter(Mandatory = $false)]
        [switch]$IgnoreErrors
    )
    
    $sshArgs = @(
        "-o", "ConnectTimeout=10",
        "-o", "StrictHostKeyChecking=no",
        "-o", "UserKnownHostsFile=/dev/null",
        "-o", "ServerAliveInterval=30",
        "-o", "ServerAliveCountMax=3",
        "-p", $SSH_PORT,
        "$SSH_USER@$SSH_HOST",
        $Command
    )
    
    try {
        Write-Log "Executing SSH command: $Command" -Level DEBUG
        $result = & ssh @sshArgs 2>&1
        
        if ($LASTEXITCODE -eq 0 -or $IgnoreErrors) {
            Write-Log "SSH command executed successfully" -Level SUCCESS
            return $result
        } else {
            Write-Log "SSH command failed with exit code: $LASTEXITCODE" -Level ERROR
            Write-Log "Command output: $result" -Level ERROR
            throw "SSH command failed"
        }
    } catch {
        Write-Log "SSH command execution failed: $($_.Exception.Message)" -Level ERROR
        if (-not $IgnoreErrors) {
            throw
        }
        return $null
    }
}

function Invoke-SCPTransfer {
    param(
        [Parameter(Mandatory = $true)]
        [string]$LocalPath,
        
        [Parameter(Mandatory = $true)]
        [string]$RemotePath,
        
        [Parameter(Mandatory = $false)]
        [switch]$IsDirectory
    )
    
    $scpArgs = @(
        "-o", "StrictHostKeyChecking=no",
        "-o", "UserKnownHostsFile=/dev/null",
        "-o", "ServerAliveInterval=30",
        "-P", $SSH_PORT
    )
    
    if ($IsDirectory) {
        $scpArgs += "-r"
    }
    
    $scpArgs += "$LocalPath"
    $scpArgs += "$SSH_USER@$SSH_HOST`:$RemotePath"
    
    try {
        Write-Log "Transferring $LocalPath to $RemotePath" -Level DEBUG
        $result = & scp @scpArgs 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "File transfer completed successfully" -Level SUCCESS
            return $true
        } else {
            Write-Log "File transfer failed with exit code: $LASTEXITCODE" -Level ERROR
            Write-Log "Transfer output: $result" -Level ERROR
            return $false
        }
    } catch {
        Write-Log "File transfer failed: $($_.Exception.Message)" -Level ERROR
        return $false
    }
}

# =============================================================================
# Deployment Operations
# =============================================================================

function New-ProjectArchive {
    Write-Section "Creating Project Archive"
    
    $excludePatterns = @(
        "node_modules",
        ".git",
        "*.log",
        "logs/*",
        "uploads/*",
        "backups/*",
        "coverage/*",
        "dist/*",
        ".env*",
        "*.tmp",
        "*.temp"
    )
    
    $tarArgs = @("-czf", $Script:Config.ArchiveName)
    
    foreach ($pattern in $excludePatterns) {
        $tarArgs += "--exclude=$pattern"
    }
    
    $tarArgs += "."
    
    try {
        Write-Log "Creating archive: $($Script:Config.ArchiveName)" -Level INFO
        & tar @tarArgs
        
        if ($LASTEXITCODE -eq 0) {
            $archiveSize = (Get-Item $Script:Config.ArchiveName).Length
            $archiveSizeMB = [math]::Round($archiveSize / 1MB, 2)
            Write-Log "Archive created successfully: ${archiveSizeMB}MB" -Level SUCCESS
            return $true
        } else {
            Write-Log "Archive creation failed" -Level ERROR
            return $false
        }
    } catch {
        Write-Log "Archive creation failed: $($_.Exception.Message)" -Level ERROR
        return $false
    }
}

function Install-ServerDependencies {
    Write-Section "Installing Server Dependencies"
    
    $installScript = @'
#!/bin/bash
set -e

echo "🔄 Updating system packages..."
apt update && apt upgrade -y

echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    # Install Docker Compose
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    echo "✅ Docker installed successfully"
else
    echo "✅ Docker already installed"
fi

echo "🔧 Installing additional tools..."
apt install -y curl wget git unzip htop nano vim

echo "🌐 Configuring firewall..."
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000:3001/tcp
ufw allow 5432/tcp
ufw allow 6379/tcp
ufw allow 9090:9091/tcp

echo "✅ Server dependencies installed successfully"
'@
    
    $tempScript = Join-Path $Script:Config.TempDir "install-deps.sh"
    $installScript | Out-File -FilePath $tempScript -Encoding UTF8
    
    try {
        # Upload and execute installation script
        if (Invoke-SCPTransfer -LocalPath $tempScript -RemotePath "/tmp/install-deps.sh") {
            Invoke-SSHCommand -Command "chmod +x /tmp/install-deps.sh && /tmp/install-deps.sh"
            Write-Log "Server dependencies installed successfully" -Level SUCCESS
            return $true
        } else {
            Write-Log "Failed to upload installation script" -Level ERROR
            return $false
        }
    } finally {
        if (Test-Path $tempScript) { Remove-Item $tempScript -Force }
    }
}

function Set-EnvironmentConfiguration {
    Write-Section "Configuring Environment"
    
    $envConfig = @"
# AquaFarm Pro Environment Configuration
# Generated on: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
# Deployment ID: $($Script:Config.DeploymentId)

# Application Configuration
NODE_ENV=$Environment
DOMAIN=$DOMAIN
APP_NAME=AquaFarm Pro
APP_VERSION=$($Script:Config.Version)

# Database Configuration
DB_TYPE=postgres
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=aquafarm_user
DB_PASSWORD=aquafarm_secure_password_$(Get-Date -Format 'yyyyMMdd')
DB_DATABASE=aquafarm_production
DB_SSL_MODE=require
DB_SSL_REJECT_UNAUTHORIZED=false

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_secure_password_$(Get-Date -Format 'yyyyMMdd')
REDIS_DB=0

# JWT Configuration
JWT_SECRET=aquafarm_jwt_secret_$(Get-Random -Minimum 100000 -Maximum 999999)
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=aquafarm_refresh_secret_$(Get-Random -Minimum 100000 -Maximum 999999)
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=aquafarm-pro
JWT_AUDIENCE=aquafarm-users

# Security Configuration
BCRYPT_SALT_ROUNDS=12
CORS_ORIGINS=https://$DOMAIN,https://www.$DOMAIN,http://$DOMAIN,http://www.$DOMAIN
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100
HELMET_ENABLED=true

# Monitoring Configuration
PROMETHEUS_PORT=9090
GRAFANA_PORT=9091
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=grafana_admin_$(Get-Random -Minimum 100000 -Maximum 999999)
METRICS_ENABLED=true
LOGGING_LEVEL=info

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx

# Email Configuration (if needed)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@$DOMAIN

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=
BACKUP_S3_REGION=

# Performance Configuration
DB_CONNECTION_POOL_MIN=2
DB_CONNECTION_POOL_MAX=10
REDIS_CONNECTION_POOL_MIN=1
REDIS_CONNECTION_POOL_MAX=5
COMPRESSION_ENABLED=true
CACHE_TTL=3600
"@
    
    $envFile = Join-Path $Script:Config.TempDir ".env"
    $envConfig | Out-File -FilePath $envFile -Encoding UTF8
    
    try {
        if (Invoke-SCPTransfer -LocalPath $envFile -RemotePath "$DEPLOY_PATH/.env") {
            Write-Log "Environment configuration uploaded successfully" -Level SUCCESS
            return $true
        } else {
            Write-Log "Failed to upload environment configuration" -Level ERROR
            return $false
        }
    } finally {
        if (Test-Path $envFile) { Remove-Item $envFile -Force }
    }
}

function Start-ApplicationServices {
    Write-Section "Starting Application Services"
    
    $deployScript = @"
#!/bin/bash
set -e

echo "📁 Setting up deployment directory..."
mkdir -p $DEPLOY_PATH
cd $DEPLOY_PATH

echo "📦 Extracting application files..."
if [ -f "$($Script:Config.ArchiveName)" ]; then
    tar -xzf $($Script:Config.ArchiveName)
    rm $($Script:Config.ArchiveName)
    echo "✅ Application files extracted successfully"
else
    echo "❌ Archive file not found: $($Script:Config.ArchiveName)"
    exit 1
fi

echo "🐳 Building and starting Docker services..."
if [ -f "docker-compose.hostinger.yml" ]; then
    # Stop existing services
    docker-compose -f docker-compose.hostinger.yml down || true
    
    # Remove old images if force rebuild
    if [ "$ForceRebuild" = "true" ]; then
        docker system prune -f || true
    fi
    
    # Build and start services
    docker-compose -f docker-compose.hostinger.yml up -d --build
    
    echo "⏳ Waiting for services to initialize..."
    sleep 30
    
    # Check service health
    echo "🔍 Checking service status..."
    docker-compose -f docker-compose.hostinger.yml ps
    
    # Show logs for debugging
    echo "📋 Recent logs:"
    docker-compose -f docker-compose.hostinger.yml logs --tail=20
    
    echo "✅ Application services started successfully"
else
    echo "❌ Docker Compose file not found"
    exit 1
fi
"@
    
    $tempScript = Join-Path $Script:Config.TempDir "deploy-app.sh"
    $deployScript | Out-File -FilePath $tempScript -Encoding UTF8
    
    try {
        # Upload application archive
        if (-not (Invoke-SCPTransfer -LocalPath $Script:Config.ArchiveName -RemotePath "$DEPLOY_PATH/$($Script:Config.ArchiveName)")) {
            Write-Log "Failed to upload application archive" -Level ERROR
            return $false
        }
        
        # Upload and execute deployment script
        if (Invoke-SCPTransfer -LocalPath $tempScript -RemotePath "/tmp/deploy-app.sh") {
            Invoke-SSHCommand -Command "chmod +x /tmp/deploy-app.sh && /tmp/deploy-app.sh"
            Write-Log "Application services started successfully" -Level SUCCESS
            return $true
        } else {
            Write-Log "Failed to upload deployment script" -Level ERROR
            return $false
        }
    } finally {
        if (Test-Path $tempScript) { Remove-Item $tempScript -Force }
    }
}

# =============================================================================
# Health Checks and Monitoring
# =============================================================================

function Test-ApplicationHealth {
    Write-Section "Application Health Check"
    
    $allHealthy = $true
    
    foreach ($endpoint in $Script:Config.HealthCheckEndpoints) {
        Write-Log "Testing $($endpoint.Service) at port $($endpoint.Port)" -Level INFO
        
        $healthCheck = @"
#!/bin/bash
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f -s "http://localhost:$($endpoint.Port)$($endpoint.Path)" > /dev/null 2>&1; then
        echo "✅ $($endpoint.Service) is healthy"
        exit 0
    fi
    
    echo "⏳ Waiting for $($endpoint.Service) to be ready (attempt $attempt/$max_attempts)..."
    sleep 2
    attempt=$((attempt + 1))
done

echo "❌ $($endpoint.Service) health check failed"
exit 1
"@
        
        $tempHealthScript = Join-Path $Script:Config.TempDir "health-check-$($endpoint.Service).sh"
        $healthCheck | Out-File -FilePath $tempHealthScript -Encoding UTF8
        
        try {
            if (Invoke-SCPTransfer -LocalPath $tempHealthScript -RemotePath "/tmp/health-check.sh") {
                $result = Invoke-SSHCommand -Command "chmod +x /tmp/health-check.sh && /tmp/health-check.sh" -IgnoreErrors
                if ($LASTEXITCODE -eq 0) {
                    Write-Log "$($endpoint.Service) health check passed" -Level SUCCESS
                } else {
                    Write-Log "$($endpoint.Service) health check failed" -Level ERROR
                    $allHealthy = $false
                }
            }
        } finally {
            if (Test-Path $tempHealthScript) { Remove-Item $tempHealthScript -Force }
        }
    }
    
    return $allHealthy
}

# =============================================================================
# SSL Configuration
# =============================================================================

function Set-SSLCertificate {
    Write-Section "SSL Certificate Configuration"
    
    $sslScript = @"
#!/bin/bash
set -e

echo "🔒 Setting up SSL certificate..."

# Install certbot if not installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    apt update && apt install -y certbot python3-certbot-nginx
fi

# Stop nginx temporarily
docker-compose -f docker-compose.hostinger.yml stop nginx || true

# Generate SSL certificate
echo "Generating SSL certificate for $DOMAIN..."
certbot certonly --standalone --non-interactive --agree-tos --email admin@$DOMAIN -d $DOMAIN

# Copy certificates to application directory
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    mkdir -p $DEPLOY_PATH/ssl
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $DEPLOY_PATH/ssl/
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $DEPLOY_PATH/ssl/
    
    echo "✅ SSL certificate configured successfully"
    
    # Setup auto-renewal
    echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
    
    # Restart nginx with SSL
    docker-compose -f docker-compose.hostinger.yml up -d nginx
else
    echo "❌ SSL certificate generation failed"
    exit 1
fi
"@
    
    $tempSSLScript = Join-Path $Script:Config.TempDir "setup-ssl.sh"
    $sslScript | Out-File -FilePath $tempSSLScript -Encoding UTF8
    
    try {
        if (Invoke-SCPTransfer -LocalPath $tempSSLScript -RemotePath "/tmp/setup-ssl.sh") {
            Invoke-SSHCommand -Command "chmod +x /tmp/setup-ssl.sh && /tmp/setup-ssl.sh"
            Write-Log "SSL certificate configured successfully" -Level SUCCESS
            return $true
        } else {
            Write-Log "Failed to configure SSL certificate" -Level ERROR
            return $false
        }
    } finally {
        if (Test-Path $tempSSLScript) { Remove-Item $tempSSLScript -Force }
    }
}

# =============================================================================
# Backup and Recovery
# =============================================================================

function Set-BackupSystem {
    Write-Section "Setting up Backup System"
    
    $backupScript = @"
#!/bin/bash
set -e

echo "💾 Setting up backup system..."

# Create backup directory
mkdir -p $DEPLOY_PATH/backups

# Create backup script
cat > $DEPLOY_PATH/backup.sh << 'BACKUPEOF'
#!/bin/bash
BACKUP_DIR="$DEPLOY_PATH/backups"
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="aquafarm_backup_\$DATE.tar.gz"

echo "Starting backup: \$BACKUP_FILE"

# Create backup
tar -czf "\$BACKUP_DIR/\$BACKUP_FILE" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='logs' \
    --exclude='backups' \
    --exclude='uploads' \
    .

# Keep only last 7 backups
cd "\$BACKUP_DIR"
ls -t aquafarm_backup_*.tar.gz | tail -n +8 | xargs -r rm

echo "Backup completed: \$BACKUP_FILE"
BACKUPEOF

chmod +x $DEPLOY_PATH/backup.sh

# Setup cron job for daily backups at 2 AM
echo "0 2 * * * $DEPLOY_PATH/backup.sh" | crontab -

echo "✅ Backup system configured successfully"
"@
    
    $tempBackupScript = Join-Path $Script:Config.TempDir "setup-backup.sh"
    $backupScript | Out-File -FilePath $tempBackupScript -Encoding UTF8
    
    try {
        if (Invoke-SCPTransfer -LocalPath $tempBackupScript -RemotePath "/tmp/setup-backup.sh") {
            Invoke-SSHCommand -Command "chmod +x /tmp/setup-backup.sh && /tmp/setup-backup.sh"
            Write-Log "Backup system configured successfully" -Level SUCCESS
            return $true
        } else {
            Write-Log "Failed to setup backup system" -Level ERROR
            return $false
        }
    } finally {
        if (Test-Path $tempBackupScript) { Remove-Item $tempBackupScript -Force }
    }
}

# =============================================================================
# Main Deployment Function
# =============================================================================

function Start-Deployment {
    Write-Section "Starting AquaFarm Pro Deployment"
    Write-Log "Deployment ID: $($Script:Config.DeploymentId)"
    Write-Log "Target Server: $SSH_USER@$SSH_HOST`:$SSH_PORT"
    Write-Log "Domain: $DOMAIN"
    Write-Log "Environment: $Environment"
    
    try {
        # Phase 1: System Requirements
        if (-not (Test-SystemRequirements)) {
            throw "System requirements check failed"
        }
        
        if (-not (Test-NetworkConnectivity)) {
            throw "Network connectivity check failed"
        }
        
        # Phase 2: Dependencies
        if (-not $SkipDependencies) {
            if (-not (Install-ServerDependencies)) {
                throw "Server dependencies installation failed"
            }
        }
        
        # Phase 3: Project Preparation
        if (-not (New-ProjectArchive)) {
            throw "Project archive creation failed"
        }
        
        # Phase 4: Environment Configuration
        if (-not (Set-EnvironmentConfiguration)) {
            throw "Environment configuration failed"
        }
        
        # Phase 5: Application Deployment
        if (-not (Start-ApplicationServices)) {
            throw "Application services startup failed"
        }
        
        # Phase 6: Health Checks
        Start-Sleep -Seconds 30  # Allow services to fully initialize
        if (-not (Test-ApplicationHealth)) {
            Write-Log "Some services failed health checks, but continuing..." -Level WARNING
        }
        
        # Phase 7: SSL Configuration
        if (-not $SkipSSL) {
            if (-not (Set-SSLCertificate)) {
                Write-Log "SSL configuration failed, but continuing..." -Level WARNING
            }
        }
        
        # Phase 8: Backup System
        if (-not (Set-BackupSystem)) {
            Write-Log "Backup system setup failed, but continuing..." -Level WARNING
        }
        
        # Phase 9: Final Verification
        Write-Section "Deployment Summary"
        Write-Log "🎉 Deployment completed successfully!" -Level SUCCESS
        Write-Log "🌐 Application URL: http://$DOMAIN" -Level SUCCESS
        Write-Log "🔒 HTTPS URL: https://$DOMAIN" -Level SUCCESS
        Write-Log "📊 Monitoring URLs:" -Level SUCCESS
        Write-Log "   - Prometheus: http://$DOMAIN`:9090" -Level SUCCESS
        Write-Log "   - Grafana: http://$DOMAIN`:9091" -Level SUCCESS
        Write-Log "🔧 Management Commands:" -Level SUCCESS
        Write-Log "   - View logs: ssh $SSH_USER@$SSH_HOST `"cd $DEPLOY_PATH; docker-compose -f docker-compose.hostinger.yml logs -f`"" -Level SUCCESS
        Write-Log "   - Restart services: ssh $SSH_USER@$SSH_HOST `"cd $DEPLOY_PATH; docker-compose -f docker-compose.hostinger.yml restart`"" -Level SUCCESS
        Write-Log "   - Run backup: ssh $SSH_USER@$SSH_HOST `"$DEPLOY_PATH/backup.sh`"" -Level SUCCESS
        
        return $true
        
    } catch {
        Write-Log "Deployment failed: $($_.Exception.Message)" -Level ERROR
        return $false
    } finally {
        # Cleanup
        if (Test-Path $Script:Config.ArchiveName) {
            Remove-Item $Script:Config.ArchiveName -Force
            Write-Log "Cleaned up temporary archive" -Level DEBUG
        }
    }
}

# =============================================================================
# Script Execution
# =============================================================================

if ($MyInvocation.InvocationName -ne ".") {
    Write-Section "AquaFarm Pro Professional Deployment System"
    Write-Log "Version: $($Script:Config.Version)"
    Write-Log "Deployment ID: $($Script:Config.DeploymentId)"
    
    $deploymentSuccess = Start-Deployment
    
    if ($deploymentSuccess) {
        Write-Log "🎉 Deployment completed successfully!" -Level SUCCESS
        exit 0
    } else {
        Write-Log "❌ Deployment failed!" -Level ERROR
        exit 1
    }
}
