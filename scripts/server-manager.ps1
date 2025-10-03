# =============================================================================
# AquaFarm Pro - Advanced Server Management System
# Professional server administration and monitoring tools
# =============================================================================

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("status", "logs", "restart", "backup", "update", "monitor", "health", "ssl", "cleanup", "security")]
    [string]$Action,
    
    [Parameter(Mandatory = $false)]
    [string]$SSH_HOST = "72.60.187.58",
    
    [Parameter(Mandatory = $false)]
    [string]$SSH_USER = "root",
    
    [Parameter(Mandatory = $false)]
    [int]$SSH_PORT = 22,
    
    [Parameter(Mandatory = $false)]
    [string]$DEPLOY_PATH = "/home/root/aquafarm-pro",
    
    [Parameter(Mandatory = $false)]
    [string]$Service,
    
    [Parameter(Mandatory = $false)]
    [int]$Lines = 50,
    
    [Parameter(Mandatory = $false)]
    [switch]$Follow,
    
    [Parameter(Mandatory = $false)]
    [switch]$Force
)

# =============================================================================
# Configuration
# =============================================================================

$Script:Config = @{
    SSH_HOST = $SSH_HOST
    SSH_USER = $SSH_USER
    SSH_PORT = $SSH_PORT
    DEPLOY_PATH = $DEPLOY_PATH
    Services = @("backend", "frontend", "postgres", "redis", "nginx", "prometheus", "grafana")
    LogFile = "server-management-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
}

# =============================================================================
# Utility Functions
# =============================================================================

function Write-Log {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message,
        
        [Parameter(Mandatory = $false)]
        [ValidateSet("INFO", "SUCCESS", "WARNING", "ERROR", "DEBUG")]
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    switch ($Level) {
        "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
        "WARNING" { Write-Host $logEntry -ForegroundColor Yellow }
        "ERROR" { Write-Host $logEntry -ForegroundColor Red }
        "DEBUG" { Write-Host $logEntry -ForegroundColor Gray }
        default { Write-Host $logEntry -ForegroundColor Cyan }
    }
    
    Add-Content -Path $Script:Config.LogFile -Value $logEntry -Encoding UTF8
}

function Invoke-SSHCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command,
        
        [Parameter(Mandatory = $false)]
        [int]$TimeoutSeconds = 60
    )
    
    $sshArgs = @(
        "-o", "ConnectTimeout=10",
        "-o", "StrictHostKeyChecking=no",
        "-o", "UserKnownHostsFile=/dev/null",
        "-p", $SSH_PORT,
        "$SSH_USER@$SSH_HOST",
        $Command
    )
    
    try {
        Write-Log "Executing: $Command" -Level DEBUG
        $result = & ssh @sshArgs 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            return $result
        } else {
            Write-Log "Command failed with exit code: $LASTEXITCODE" -Level ERROR
            return $null
        }
    } catch {
        Write-Log "SSH command failed: $($_.Exception.Message)" -Level ERROR
        return $null
    }
}

# =============================================================================
# Management Functions
# =============================================================================

function Get-ServiceStatus {
    Write-Log "Checking service status..." -Level INFO
    
    $statusCommand = "cd $DEPLOY_PATH && docker-compose -f docker-compose.hostinger.yml ps"
    $result = Invoke-SSHCommand -Command $statusCommand
    
    if ($result) {
        Write-Log "Service Status:" -Level INFO
        $result | ForEach-Object { Write-Log $_ -Level INFO }
        
        # Check for unhealthy containers
        $unhealthyContainers = $result | Where-Object { $_ -match "unhealthy|exited|dead" }
        if ($unhealthyContainers) {
            Write-Log "Warning: Unhealthy containers detected" -Level WARNING
            $unhealthyContainers | ForEach-Object { Write-Log $_ -Level WARNING }
        } else {
            Write-Log "All services are healthy" -Level SUCCESS
        }
    }
    
    # System resource usage
    Write-Log "System Resource Usage:" -Level INFO
    $resourceCommand = "df -h && free -h && uptime"
    $resourceResult = Invoke-SSHCommand -Command $resourceCommand
    if ($resourceResult) {
        $resourceResult | ForEach-Object { Write-Log $_ -Level INFO }
    }
}

function Get-ServiceLogs {
    param(
        [string]$ServiceName = "",
        [int]$LogLines = 50,
        [switch]$FollowLogs
    )
    
    Write-Log "Retrieving logs for service: $ServiceName" -Level INFO
    
    if ($ServiceName -and $ServiceName -in $Script:Config.Services) {
        $logCommand = "cd $DEPLOY_PATH && docker-compose -f docker-compose.hostinger.yml logs --tail=$LogLines"
        if ($FollowLogs) {
            $logCommand += " -f"
        }
        $logCommand += " $ServiceName"
    } else {
        $logCommand = "cd $DEPLOY_PATH && docker-compose -f docker-compose.hostinger.yml logs --tail=$LogLines"
        if ($FollowLogs) {
            $logCommand += " -f"
        }
    }
    
    $result = Invoke-SSHCommand -Command $logCommand
    
    if ($result) {
        Write-Log "Logs:" -Level INFO
        $result | ForEach-Object { Write-Log $_ -Level INFO }
    }
}

function Restart-Services {
    param(
        [string]$ServiceName = "",
        [switch]$ForceRestart
    )
    
    if (-not $ForceRestart -and -not $Force) {
        Write-Log "This will restart services. Use -Force to confirm." -Level WARNING
        return
    }
    
    Write-Log "Restarting services..." -Level INFO
    
    if ($ServiceName -and $ServiceName -in $Script:Config.Services) {
        $restartCommand = "cd $DEPLOY_PATH && docker-compose -f docker-compose.hostinger.yml restart $ServiceName"
        Write-Log "Restarting specific service: $ServiceName" -Level INFO
    } else {
        $restartCommand = "cd $DEPLOY_PATH && docker-compose -f docker-compose.hostinger.yml restart"
        Write-Log "Restarting all services" -Level INFO
    }
    
    $result = Invoke-SSHCommand -Command $restartCommand
    
    if ($result) {
        Write-Log "Services restarted successfully" -Level SUCCESS
        Write-Log "Restart output:" -Level INFO
        $result | ForEach-Object { Write-Log $_ -Level INFO }
        
        # Wait and check status
        Start-Sleep -Seconds 10
        Get-ServiceStatus
    }
}

function Start-Backup {
    Write-Log "Starting backup process..." -Level INFO
    
    $backupCommand = "$DEPLOY_PATH/backup.sh"
    $result = Invoke-SSHCommand -Command $backupCommand
    
    if ($result) {
        Write-Log "Backup completed successfully" -Level SUCCESS
        $result | ForEach-Object { Write-Log $_ -Level INFO }
        
        # List available backups
        $listBackupsCommand = "ls -la $DEPLOY_PATH/backups/"
        $backupList = Invoke-SSHCommand -Command $listBackupsCommand
        if ($backupList) {
            Write-Log "Available backups:" -Level INFO
            $backupList | ForEach-Object { Write-Log $_ -Level INFO }
        }
    }
}

function Update-Application {
    param([switch]$ForceUpdate)
    
    if (-not $ForceUpdate -and -not $Force) {
        Write-Log "This will update the application. Use -Force to confirm." -Level WARNING
        return
    }
    
    Write-Log "Starting application update..." -Level INFO
    
    # Pull latest changes
    $pullCommand = "cd $DEPLOY_PATH && git pull origin main || echo 'Git pull failed - continuing with current version'"
    Invoke-SSHCommand -Command $pullCommand
    
    # Rebuild and restart services
    $updateCommand = "cd $DEPLOY_PATH && docker-compose -f docker-compose.hostinger.yml down && docker-compose -f docker-compose.hostinger.yml up -d --build"
    $result = Invoke-SSHCommand -Command $updateCommand
    
    if ($result) {
        Write-Log "Application updated successfully" -Level SUCCESS
        $result | ForEach-Object { Write-Log $_ -Level INFO }
        
        # Wait and check health
        Start-Sleep -Seconds 30
        Test-ApplicationHealth
    }
}

function Start-Monitoring {
    Write-Log "Starting monitoring dashboard..." -Level INFO
    
    # System monitoring
    $monitorCommand = @"
echo "=== System Monitoring ==="
echo "Timestamp: $(date)"
echo ""
echo "=== Docker Services ==="
docker-compose -f $DEPLOY_PATH/docker-compose.hostinger.yml ps
echo ""
echo "=== System Resources ==="
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1"%"}'
echo ""
echo "Memory Usage:"
free -h
echo ""
echo "Disk Usage:"
df -h
echo ""
echo "=== Network Connections ==="
netstat -tuln | grep -E ":(3000|3001|5432|6379|9090|9091|80|443)"
echo ""
echo "=== Recent Logs ==="
docker-compose -f $DEPLOY_PATH/docker-compose.hostinger.yml logs --tail=10
"@
    
    $result = Invoke-SSHCommand -Command $monitorCommand
    
    if ($result) {
        $result | ForEach-Object { Write-Log $_ -Level INFO }
    }
}

function Test-ApplicationHealth {
    Write-Log "Running comprehensive health checks..." -Level INFO
    
    $healthChecks = @(
        @{ Name = "Backend API"; Port = 3001; Path = "/api/health" },
        @{ Name = "Frontend"; Port = 3000; Path = "/" },
        @{ Name = "PostgreSQL"; Port = 5432; Path = "" },
        @{ Name = "Redis"; Port = 6379; Path = "" },
        @{ Name = "Nginx"; Port = 80; Path = "/" },
        @{ Name = "Prometheus"; Port = 9090; Path = "/api/v1/status/config" },
        @{ Name = "Grafana"; Port = 9091; Path = "/api/health" }
    )
    
    $allHealthy = $true
    
    foreach ($check in $healthChecks) {
        $healthCommand = @"
if curl -f -s "http://localhost:$($check.Port)$($check.Path)" > /dev/null 2>&1; then
    echo "✅ $($check.Name) is healthy"
else
    echo "❌ $($check.Name) is unhealthy"
    exit 1
fi
"@
        
        $result = Invoke-SSHCommand -Command $healthCommand -IgnoreErrors
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "$($check.Name) health check passed" -Level SUCCESS
        } else {
            Write-Log "$($check.Name) health check failed" -Level ERROR
            $allHealthy = $false
        }
    }
    
    if ($allHealthy) {
        Write-Log "All health checks passed" -Level SUCCESS
    } else {
        Write-Log "Some health checks failed" -Level WARNING
    }
    
    return $allHealthy
}

function Update-SSLCertificate {
    Write-Log "Updating SSL certificate..." -Level INFO
    
    $sslCommand = @"
# Renew SSL certificate
certbot renew --quiet

# Check if renewal was successful
if [ -f "/etc/letsencrypt/live/srv1029413.hstgr.cloud/fullchain.pem" ]; then
    # Copy new certificates
    cp /etc/letsencrypt/live/srv1029413.hstgr.cloud/fullchain.pem $DEPLOY_PATH/ssl/
    cp /etc/letsencrypt/live/srv1029413.hstgr.cloud/privkey.pem $DEPLOY_PATH/ssl/
    
    # Restart nginx
    cd $DEPLOY_PATH
    docker-compose -f docker-compose.hostinger.yml restart nginx
    
    echo "✅ SSL certificate updated successfully"
else
    echo "❌ SSL certificate renewal failed"
    exit 1
fi
"@
    
    $result = Invoke-SSHCommand -Command $sslCommand
    
    if ($result) {
        Write-Log "SSL certificate updated successfully" -Level SUCCESS
        $result | ForEach-Object { Write-Log $_ -Level INFO }
    }
}

function Start-Cleanup {
    param([switch]$ForceCleanup)
    
    if (-not $ForceCleanup -and -not $Force) {
        Write-Log "This will clean up system resources. Use -Force to confirm." -Level WARNING
        return
    }
    
    Write-Log "Starting system cleanup..." -Level INFO
    
    $cleanupCommand = @"
# Clean up Docker resources
docker system prune -f
docker volume prune -f
docker network prune -f

# Clean up old logs
find $DEPLOY_PATH/logs -name "*.log" -mtime +7 -delete 2>/dev/null || true

# Clean up old backups (keep last 7)
cd $DEPLOY_PATH/backups
ls -t aquafarm_backup_*.tar.gz | tail -n +8 | xargs -r rm

# Clean up system packages
apt autoremove -y
apt autoclean

echo "✅ System cleanup completed"
"@
    
    $result = Invoke-SSHCommand -Command $cleanupCommand
    
    if ($result) {
        Write-Log "System cleanup completed successfully" -Level SUCCESS
        $result | ForEach-Object { Write-Log $_ -Level INFO }
    }
}

function Test-Security {
    Write-Log "Running security audit..." -Level INFO
    
    $securityCommand = @"
echo "=== Security Audit ==="
echo "Timestamp: $(date)"
echo ""
echo "=== Firewall Status ==="
ufw status
echo ""
echo "=== Open Ports ==="
netstat -tuln | grep LISTEN
echo ""
echo "=== SSH Configuration ==="
grep -E "^(PermitRootLogin|PasswordAuthentication|PubkeyAuthentication)" /etc/ssh/sshd_config
echo ""
echo "=== Failed Login Attempts ==="
grep "Failed password" /var/log/auth.log | tail -10
echo ""
echo "=== Docker Security ==="
docker version --format "{{.Server.Version}}"
docker info --format "{{.SecurityOptions}}"
echo ""
echo "=== SSL Certificate Status ==="
if [ -f "/etc/letsencrypt/live/srv1029413.hstgr.cloud/fullchain.pem" ]; then
    openssl x509 -in /etc/letsencrypt/live/srv1029413.hstgr.cloud/fullchain.pem -text -noout | grep -A2 "Validity"
else
    echo "SSL certificate not found"
fi
"@
    
    $result = Invoke-SSHCommand -Command $securityCommand
    
    if ($result) {
        $result | ForEach-Object { Write-Log $_ -Level INFO }
    }
}

# =============================================================================
# Main Execution
# =============================================================================

Write-Log "AquaFarm Pro Server Manager" -Level INFO
Write-Log "Action: $Action" -Level INFO
Write-Log "Target: $SSH_USER@$SSH_HOST`:$SSH_PORT" -Level INFO

switch ($Action) {
    "status" { Get-ServiceStatus }
    "logs" { Get-ServiceLogs -ServiceName $Service -LogLines $Lines -FollowLogs $Follow }
    "restart" { Restart-Services -ServiceName $Service -ForceRestart $Force }
    "backup" { Start-Backup }
    "update" { Update-Application -ForceUpdate $Force }
    "monitor" { Start-Monitoring }
    "health" { Test-ApplicationHealth }
    "ssl" { Update-SSLCertificate }
    "cleanup" { Start-Cleanup -ForceCleanup $Force }
    "security" { Test-Security }
    default { Write-Log "Unknown action: $Action" -Level ERROR }
}

Write-Log "Server management action completed: $Action" -Level SUCCESS
