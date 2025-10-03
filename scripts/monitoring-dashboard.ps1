# =============================================================================
# AquaFarm Pro - Advanced Monitoring Dashboard
# Real-time monitoring and alerting system
# =============================================================================

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$SSH_HOST = "72.60.187.58",
    
    [Parameter(Mandatory = $false)]
    [string]$SSH_USER = "root",
    
    [Parameter(Mandatory = $false)]
    [int]$SSH_PORT = 22,
    
    [Parameter(Mandatory = $false)]
    [string]$DEPLOY_PATH = "/home/root/aquafarm-pro",
    
    [Parameter(Mandatory = $false)]
    [int]$RefreshInterval = 30,
    
    [Parameter(Mandatory = $false)]
    [switch]$Continuous,
    
    [Parameter(Mandatory = $false)]
    [switch]$ExportToFile
)

# =============================================================================
# Configuration
# =============================================================================

$Script:Config = @{
    SSH_HOST = $SSH_HOST
    SSH_USER = $SSH_USER
    SSH_PORT = $SSH_PORT
    DEPLOY_PATH = $DEPLOY_PATH
    RefreshInterval = $RefreshInterval
    ExportFile = "monitoring-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    Metrics = @{
        CPU_THRESHOLD = 80
        MEMORY_THRESHOLD = 85
        DISK_THRESHOLD = 90
        RESPONSE_TIME_THRESHOLD = 5000
        ERROR_RATE_THRESHOLD = 5
    }
}

# =============================================================================
# Utility Functions
# =============================================================================

function Write-MonitoringLog {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message,
        
        [Parameter(Mandatory = $false)]
        [ValidateSet("INFO", "SUCCESS", "WARNING", "CRITICAL", "ERROR")]
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    switch ($Level) {
        "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
        "WARNING" { Write-Host $logEntry -ForegroundColor Yellow }
        "CRITICAL" { Write-Host $logEntry -ForegroundColor Red -BackgroundColor Yellow }
        "ERROR" { Write-Host $logEntry -ForegroundColor Red }
        default { Write-Host $logEntry -ForegroundColor Cyan }
    }
}

function Invoke-SSHCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command,
        
        [Parameter(Mandatory = $false)]
        [int]$TimeoutSeconds = 30
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
        $result = & ssh @sshArgs 2>&1
        return $result
    } catch {
        return $null
    }
}

# =============================================================================
# Monitoring Functions
# =============================================================================

function Get-SystemMetrics {
    $metricsCommand = @"
#!/bin/bash
# System Metrics Collection

# CPU Usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
echo "CPU_USAGE:$CPU_USAGE"

# Memory Usage
MEMORY_TOTAL=$(free | grep Mem | awk '{print $2}')
MEMORY_USED=$(free | grep Mem | awk '{print $3}')
MEMORY_PERCENT=$(echo "scale=2; $MEMORY_USED * 100 / $MEMORY_TOTAL" | bc)
echo "MEMORY_USAGE:$MEMORY_PERCENT"

# Disk Usage
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
echo "DISK_USAGE:$DISK_USAGE"

# Load Average
LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
echo "LOAD_AVERAGE:$LOAD_AVG"

# Network Connections
NET_CONNECTIONS=$(netstat -an | grep ESTABLISHED | wc -l)
echo "NETWORK_CONNECTIONS:$NET_CONNECTIONS"

# Uptime
UPTIME=$(uptime -p)
echo "UPTIME:$UPTIME"

# Timestamp
TIMESTAMP=$(date +%s)
echo "TIMESTAMP:$TIMESTAMP"
"@
    
    $result = Invoke-SSHCommand -Command $metricsCommand
    
    if ($result) {
        $metrics = @{}
        $result | ForEach-Object {
            if ($_ -match "(.+):(.+)") {
                $metrics[$matches[1]] = $matches[2]
            }
        }
        return $metrics
    }
    
    return $null
}

function Get-DockerMetrics {
    $dockerCommand = @"
#!/bin/bash
# Docker Metrics Collection

cd $DEPLOY_PATH

# Container Status
echo "=== CONTAINER_STATUS ==="
docker-compose -f docker-compose.hostinger.yml ps --format "table {{.Name}}\t{{.State}}\t{{.Status}}"

# Container Resource Usage
echo "=== CONTAINER_RESOURCES ==="
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"

# Container Health
echo "=== CONTAINER_HEALTH ==="
docker-compose -f docker-compose.hostinger.yml ps | grep -E "(unhealthy|exited|dead)" || echo "All containers healthy"

# Log Errors (last 10 minutes)
echo "=== RECENT_ERRORS ==="
docker-compose -f docker-compose.hostinger.yml logs --since 10m | grep -i error | tail -5 || echo "No recent errors"

# Service Response Times
echo "=== SERVICE_RESPONSE_TIMES ==="
for service in backend frontend; do
    if curl -s -o /dev/null -w "%{time_total}" "http://localhost:3001/api/health" 2>/dev/null; then
        echo "$service: $(curl -s -o /dev/null -w "%{time_total}" "http://localhost:3001/api/health")s"
    else
        echo "$service: N/A"
    fi
done
"@
    
    $result = Invoke-SSHCommand -Command $dockerCommand
    
    if ($result) {
        $dockerMetrics = @{
            ContainerStatus = @()
            ContainerResources = @()
            ContainerHealth = @()
            RecentErrors = @()
            ResponseTimes = @()
        }
        
        $currentSection = ""
        $result | ForEach-Object {
            if ($_ -match "=== (.+) ===") {
                $currentSection = $matches[1]
            } elseif ($_ -and $currentSection) {
                switch ($currentSection) {
                    "CONTAINER_STATUS" { $dockerMetrics.ContainerStatus += $_ }
                    "CONTAINER_RESOURCES" { $dockerMetrics.ContainerResources += $_ }
                    "CONTAINER_HEALTH" { $dockerMetrics.ContainerHealth += $_ }
                    "RECENT_ERRORS" { $dockerMetrics.RecentErrors += $_ }
                    "SERVICE_RESPONSE_TIMES" { $dockerMetrics.ResponseTimes += $_ }
                }
            }
        }
        
        return $dockerMetrics
    }
    
    return $null
}

function Get-ApplicationMetrics {
    $appCommand = @"
#!/bin/bash
# Application Metrics Collection

# Database Connections
DB_CONNECTIONS=$(docker exec aquafarm-pro-postgres-1 psql -U aquafarm_user -d aquafarm_production -c "SELECT count(*) FROM pg_stat_activity;" -t 2>/dev/null || echo "N/A")
echo "DB_CONNECTIONS:$DB_CONNECTIONS"

# Redis Memory Usage
REDIS_MEMORY=$(docker exec aquafarm-pro-redis-1 redis-cli info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r' 2>/dev/null || echo "N/A")
echo "REDIS_MEMORY:$REDIS_MEMORY"

# Application Log Size
LOG_SIZE=$(find $DEPLOY_PATH/logs -name "*.log" -exec du -ch {} + 2>/dev/null | tail -1 | cut -f1 || echo "0")
echo "LOG_SIZE:$LOG_SIZE"

# Backup Status
LAST_BACKUP=$(ls -t $DEPLOY_PATH/backups/*.tar.gz 2>/dev/null | head -1 | xargs -I {} basename {} || echo "No backups")
echo "LAST_BACKUP:$LAST_BACKUP"

# SSL Certificate Expiry
SSL_EXPIRY=$(openssl x509 -in /etc/letsencrypt/live/srv1029413.hstgr.cloud/fullchain.pem -noout -dates 2>/dev/null | grep notAfter | cut -d= -f2 || echo "N/A")
echo "SSL_EXPIRY:$SSL_EXPIRY"

# API Endpoint Health
API_HEALTH=$(curl -s "http://localhost:3001/api/health" | jq -r '.status' 2>/dev/null || echo "UNKNOWN")
echo "API_HEALTH:$API_HEALTH"
"@
    
    $result = Invoke-SSHCommand -Command $appCommand
    
    if ($result) {
        $appMetrics = @{}
        $result | ForEach-Object {
            if ($_ -match "(.+):(.+)") {
                $appMetrics[$matches[1]] = $matches[2].Trim()
            }
        }
        return $appMetrics
    }
    
    return $null
}

function Test-Alerts {
    param(
        [hashtable]$SystemMetrics,
        [hashtable]$DockerMetrics,
        [hashtable]$AppMetrics
    )
    
    $alerts = @()
    
    # CPU Alert
    if ($SystemMetrics.CPU_USAGE -and [double]$SystemMetrics.CPU_USAGE -gt $Script:Config.Metrics.CPU_THRESHOLD) {
        $alerts += @{
            Level = "CRITICAL"
            Message = "High CPU usage: $($SystemMetrics.CPU_USAGE)%"
            Metric = "CPU"
            Value = $SystemMetrics.CPU_USAGE
            Threshold = $Script:Config.Metrics.CPU_THRESHOLD
        }
    }
    
    # Memory Alert
    if ($SystemMetrics.MEMORY_USAGE -and [double]$SystemMetrics.MEMORY_USAGE -gt $Script:Config.Metrics.MEMORY_THRESHOLD) {
        $alerts += @{
            Level = "CRITICAL"
            Message = "High memory usage: $($SystemMetrics.MEMORY_USAGE)%"
            Metric = "Memory"
            Value = $SystemMetrics.MEMORY_USAGE
            Threshold = $Script:Config.Metrics.MEMORY_THRESHOLD
        }
    }
    
    # Disk Alert
    if ($SystemMetrics.DISK_USAGE -and [int]$SystemMetrics.DISK_USAGE -gt $Script:Config.Metrics.DISK_THRESHOLD) {
        $alerts += @{
            Level = "CRITICAL"
            Message = "High disk usage: $($SystemMetrics.DISK_USAGE)%"
            Metric = "Disk"
            Value = $SystemMetrics.DISK_USAGE
            Threshold = $Script:Config.Metrics.DISK_THRESHOLD
        }
    }
    
    # Container Health Alert
    if ($DockerMetrics.ContainerHealth -and $DockerMetrics.ContainerHealth.Count -gt 0) {
        $alerts += @{
            Level = "ERROR"
            Message = "Unhealthy containers detected: $($DockerMetrics.ContainerHealth -join ', ')"
            Metric = "Container Health"
            Value = $DockerMetrics.ContainerHealth.Count
            Threshold = 0
        }
    }
    
    # API Health Alert
    if ($AppMetrics.API_HEALTH -and $AppMetrics.API_HEALTH -ne "healthy") {
        $alerts += @{
            Level = "ERROR"
            Message = "API health check failed: $($AppMetrics.API_HEALTH)"
            Metric = "API Health"
            Value = $AppMetrics.API_HEALTH
            Threshold = "healthy"
        }
    }
    
    return $alerts
}

function Show-MonitoringDashboard {
    param(
        [hashtable]$SystemMetrics,
        [hashtable]$DockerMetrics,
        [hashtable]$AppMetrics,
        [array]$Alerts
    )
    
    # Clear screen
    Clear-Host
    
    # Header
    Write-MonitoringLog "================================================================================" -Level INFO
    Write-MonitoringLog "                    AquaFarm Pro Monitoring Dashboard" -Level INFO
    Write-MonitoringLog "================================================================================" -Level INFO
    Write-MonitoringLog "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -Level INFO
    Write-MonitoringLog "Server: $SSH_USER@$SSH_HOST`:$SSH_PORT" -Level INFO
    Write-MonitoringLog "================================================================================" -Level INFO
    
    # Alerts Section
    if ($Alerts.Count -gt 0) {
        Write-MonitoringLog "" -Level INFO
        Write-MonitoringLog "🚨 ACTIVE ALERTS" -Level INFO
        Write-MonitoringLog "================================================================================" -Level INFO
        $Alerts | ForEach-Object {
            Write-MonitoringLog "$($_.Level): $($_.Message)" -Level $_.Level
        }
    } else {
        Write-MonitoringLog "" -Level INFO
        Write-MonitoringLog "✅ NO ACTIVE ALERTS" -Level SUCCESS
    }
    
    # System Metrics Section
    Write-MonitoringLog "" -Level INFO
    Write-MonitoringLog "🖥️  SYSTEM METRICS" -Level INFO
    Write-MonitoringLog "================================================================================" -Level INFO
    if ($SystemMetrics) {
        Write-MonitoringLog "CPU Usage: $($SystemMetrics.CPU_USAGE)%" -Level INFO
        Write-MonitoringLog "Memory Usage: $($SystemMetrics.MEMORY_USAGE)%" -Level INFO
        Write-MonitoringLog "Disk Usage: $($SystemMetrics.DISK_USAGE)%" -Level INFO
        Write-MonitoringLog "Load Average: $($SystemMetrics.LOAD_AVERAGE)" -Level INFO
        Write-MonitoringLog "Network Connections: $($SystemMetrics.NETWORK_CONNECTIONS)" -Level INFO
        Write-MonitoringLog "Uptime: $($SystemMetrics.UPTIME)" -Level INFO
    } else {
        Write-MonitoringLog "❌ Unable to retrieve system metrics" -Level ERROR
    }
    
    # Docker Metrics Section
    Write-MonitoringLog "" -Level INFO
    Write-MonitoringLog "🐳 DOCKER SERVICES" -Level INFO
    Write-MonitoringLog "================================================================================" -Level INFO
    if ($DockerMetrics -and $DockerMetrics.ContainerStatus) {
        $DockerMetrics.ContainerStatus | ForEach-Object {
            if ($_ -match "(.+)\s+(.+)\s+(.+)") {
                $containerName = $matches[1].Trim()
                $state = $matches[2].Trim()
                $status = $matches[3].Trim()
                
                if ($state -eq "Up") {
                    Write-MonitoringLog "✅ $containerName - $state ($status)" -Level SUCCESS
                } else {
                    Write-MonitoringLog "❌ $containerName - $state ($status)" -Level ERROR
                }
            }
        }
    } else {
        Write-MonitoringLog "❌ Unable to retrieve container status" -Level ERROR
    }
    
    # Application Metrics Section
    Write-MonitoringLog "" -Level INFO
    Write-MonitoringLog "📱 APPLICATION METRICS" -Level INFO
    Write-MonitoringLog "================================================================================" -Level INFO
    if ($AppMetrics) {
        Write-MonitoringLog "API Health: $($AppMetrics.API_HEALTH)" -Level INFO
        Write-MonitoringLog "Database Connections: $($AppMetrics.DB_CONNECTIONS)" -Level INFO
        Write-MonitoringLog "Redis Memory: $($AppMetrics.REDIS_MEMORY)" -Level INFO
        Write-MonitoringLog "Log Size: $($AppMetrics.LOG_SIZE)" -Level INFO
        Write-MonitoringLog "Last Backup: $($AppMetrics.LAST_BACKUP)" -Level INFO
        Write-MonitoringLog "SSL Expiry: $($AppMetrics.SSL_EXPIRY)" -Level INFO
    } else {
        Write-MonitoringLog "❌ Unable to retrieve application metrics" -Level ERROR
    }
    
    # Footer
    Write-MonitoringLog "" -Level INFO
    Write-MonitoringLog "================================================================================" -Level INFO
    Write-MonitoringLog "Press Ctrl+C to exit monitoring" -Level INFO
    if ($Continuous) {
        Write-MonitoringLog "Auto-refresh every $RefreshInterval seconds" -Level INFO
    }
    Write-MonitoringLog "================================================================================" -Level INFO
}

function Export-MonitoringData {
    param(
        [hashtable]$SystemMetrics,
        [hashtable]$DockerMetrics,
        [hashtable]$AppMetrics,
        [array]$Alerts
    )
    
    $monitoringData = @{
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Server = "$SSH_USER@$SSH_HOST`:$SSH_PORT"
        SystemMetrics = $SystemMetrics
        DockerMetrics = $DockerMetrics
        ApplicationMetrics = $AppMetrics
        Alerts = $Alerts
    }
    
    $jsonData = $monitoringData | ConvertTo-Json -Depth 10
    $jsonData | Out-File -FilePath $Script:Config.ExportFile -Encoding UTF8
    Write-MonitoringLog "Monitoring data exported to: $($Script:Config.ExportFile)" -Level SUCCESS
}

# =============================================================================
# Main Monitoring Loop
# =============================================================================

function Start-Monitoring {
    Write-MonitoringLog "Starting AquaFarm Pro Monitoring Dashboard" -Level INFO
    Write-MonitoringLog "Server: $SSH_USER@$SSH_HOST`:$SSH_PORT" -Level INFO
    Write-MonitoringLog "Refresh Interval: $RefreshInterval seconds" -Level INFO
    
    do {
        try {
            # Collect metrics
            $systemMetrics = Get-SystemMetrics
            $dockerMetrics = Get-DockerMetrics
            $appMetrics = Get-ApplicationMetrics
            
            # Check for alerts
            $alerts = Test-Alerts -SystemMetrics $systemMetrics -DockerMetrics $dockerMetrics -AppMetrics $appMetrics
            
            # Display dashboard
            Show-MonitoringDashboard -SystemMetrics $systemMetrics -DockerMetrics $dockerMetrics -AppMetrics $appMetrics -Alerts $alerts
            
            # Export data if requested
            if ($ExportToFile) {
                Export-MonitoringData -SystemMetrics $systemMetrics -DockerMetrics $dockerMetrics -AppMetrics $appMetrics -Alerts $alerts
            }
            
            # Wait for next refresh
            if ($Continuous) {
                Start-Sleep -Seconds $RefreshInterval
            }
            
        } catch {
            Write-MonitoringLog "Error during monitoring: $($_.Exception.Message)" -Level ERROR
            if ($Continuous) {
                Start-Sleep -Seconds $RefreshInterval
            }
        }
    } while ($Continuous)
    
    Write-MonitoringLog "Monitoring stopped" -Level INFO
}

# =============================================================================
# Script Execution
# =============================================================================

if ($MyInvocation.InvocationName -ne '.') {
    Start-Monitoring
}
