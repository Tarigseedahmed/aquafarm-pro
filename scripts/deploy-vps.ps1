# AquaFarm Pro - VPS Deployment Script
# Automated deployment to Hostinger VPS

param(
    [switch]$SkipBackup = $false,
    [switch]$SkipBuild = $false
)

# Configuration
$VPS_IP = "72.60.187.58"
$VPS_USER = "root"
$VPS_HOSTNAME = "srv1029413.hstgr.cloud"
$DEPLOY_PATH = "/root/aquafarm-pro"

# Helper functions
function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Blue }
function Write-Success($msg) { Write-Host "[SUCCESS] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "[WARNING] $msg" -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }

# Test SSH connection
function Test-Connection {
    Write-Info "Testing VPS connection..."
    $result = ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_IP}" "echo OK" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Connected to VPS successfully"
        return $true
    }
    Write-Err "Connection failed"
    return $false
}

# Setup server
function Setup-Server {
    Write-Info "Setting up server environment..."

    $script = "#!/bin/bash`nset -e`napt update -y && apt upgrade -y`napt install -y curl wget git nano`n"
    $script += "if ! command -v docker &> /dev/null; then`n"
    $script += "  curl -fsSL https://get.docker.com | sh`n"
    $script += "  systemctl enable docker`n"
    $script += "  systemctl start docker`n"
    $script += "fi`n"
    $script += "if ! command -v docker-compose &> /dev/null; then`n"
    $script += "  COMPOSE_URL=https://github.com/docker/compose/releases/latest/download/docker-compose-Linux-x86_64`n"
    $script += "  curl -L `$COMPOSE_URL -o /usr/local/bin/docker-compose`n"
    $script += "  chmod +x /usr/local/bin/docker-compose`n"
    $script += "fi`n"
    $script += "mkdir -p /root/aquafarm-pro/uploads`n"
    $script += "mkdir -p /root/aquafarm-pro/logs`n"
    $script += "mkdir -p /root/aquafarm-pro/backups`n"
    $script += "mkdir -p /root/aquafarm-pro/ssl`n"
    $script += "chmod 755 /root/aquafarm-pro`n"
    $script += "chmod 700 /root/aquafarm-pro/ssl`n"

    $script | ssh "${VPS_USER}@${VPS_IP}" "bash -s"
    return ($LASTEXITCODE -eq 0)
}

# Prepare files
function Prepare-Files {
    Write-Info "Preparing deployment files..."

    $tempDir = "$PSScriptRoot\..\deploy-temp"
    if (Test-Path $tempDir) { Remove-Item -Path $tempDir -Recurse -Force }
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

    $items = @("docker-compose.hostinger.yml", "env.hostinger.production", "backend", "frontend", "infra", "scripts")
    foreach ($item in $items) {
        $src = Join-Path $PSScriptRoot "..\$item"
        if (Test-Path $src) {
            Copy-Item -Path $src -Destination (Join-Path $tempDir $item) -Recurse -Force -ErrorAction SilentlyContinue
            Write-Info "  Copied: $item"
        }
    }

    $archive = Join-Path $PSScriptRoot "deploy.tar.gz"
    if (Test-Path $archive) { Remove-Item -Path $archive -Force }

    try {
        Push-Location $tempDir
        & tar -czf $archive * 2>&1 | Out-Null
        Pop-Location
        Remove-Item -Path $tempDir -Recurse -Force

        if (Test-Path $archive) {
            Write-Success "Archive created: $archive"
            return $archive
        }
    }
    catch {
        Pop-Location
        Write-Err "Failed to create archive: $_"
        return $null
    }

    return $null
}# Upload files
function Upload-Files($archive) {
    Write-Info "Uploading files..."
    scp -o StrictHostKeyChecking=no "$archive" "${VPS_USER}@${VPS_IP}:${DEPLOY_PATH}/deploy.tar.gz"

    if ($LASTEXITCODE -eq 0) {
        ssh "${VPS_USER}@${VPS_IP}" "cd ${DEPLOY_PATH} && tar -xzf deploy.tar.gz && rm deploy.tar.gz"
        return ($LASTEXITCODE -eq 0)
    }
    return $false
}

# Setup environment
function Setup-Env {
    Write-Info "Setting up environment..."
    $script = "cd ${DEPLOY_PATH}`n"
    $script += "if [ -f env.hostinger.production ]; then`n"
    $script += "  cp env.hostinger.production .env`n"
    $script += "fi`n"

    $script | ssh "${VPS_USER}@${VPS_IP}" "bash -s"
    return ($LASTEXITCODE -eq 0)
}

# Setup SSL
function Setup-SSL {
    Write-Info "Setting up SSL..."
    $script = "cd ${DEPLOY_PATH}/ssl`n"
    $script += "openssl req -x509 -nodes -days 365 -newkey rsa:2048 \"
    $script += "-keyout key.pem -out cert.pem \"
    $script += "-subj '/C=SA/ST=State/L=City/O=AquaFarm/CN=${VPS_HOSTNAME}'`n"
    $script += "chmod 600 key.pem`n"
    $script += "chmod 644 cert.pem`n"

    $script | ssh "${VPS_USER}@${VPS_IP}" "bash -s"
    return ($LASTEXITCODE -eq 0)
}

# Deploy application
function Deploy-App {
    Write-Info "Deploying application..."
    $script = "cd ${DEPLOY_PATH}`n"
    $script += "docker-compose -f docker-compose.hostinger.yml down || true`n"
    $script += "docker system prune -f`n"
    $script += "docker-compose -f docker-compose.hostinger.yml up -d --build`n"
    $script += "sleep 30`n"
    $script += "docker-compose -f docker-compose.hostinger.yml ps`n"
    $script += "docker logs aquafarm-backend --tail 20`n"

    $script | ssh "${VPS_USER}@${VPS_IP}" "bash -s"
    return ($LASTEXITCODE -eq 0)
}

# Main deployment
Write-Info "=========================================="
Write-Info "   AquaFarm Pro - VPS Deployment"
Write-Info "=========================================="

if (-not (Test-Connection)) {
    Write-Err "Connection failed. Exiting."
    exit 1
}

if (-not (Setup-Server)) {
    Write-Err "Server setup failed. Exiting."
    exit 1
}

$archive = Prepare-Files
if (-not $archive -or -not (Test-Path $archive)) {
    Write-Err "File preparation failed. Exiting."
    exit 1
}

if (-not (Upload-Files $archive)) {
    Write-Err "Upload failed. Exiting."
    exit 1
}

Setup-Env | Out-Null
Setup-SSL | Out-Null

if (-not (Deploy-App)) {
    Write-Err "Deployment failed. Exiting."
    exit 1
}

if (Test-Path $archive) { Remove-Item -Path $archive -Force }

Write-Success "=========================================="
Write-Success "   Deployment Successful!"
Write-Success "=========================================="
Write-Info ""
Write-Info "Access URLs:"
Write-Info "  Website: http://${VPS_IP}"
Write-Info "  API: http://${VPS_IP}/api"
Write-Info "  Docs: http://${VPS_IP}/api/docs"
Write-Info "  Health: http://${VPS_IP}/health"
Write-Info ""
Write-Info "SSH: ssh ${VPS_USER}@${VPS_IP}"
Write-Success "=========================================="
