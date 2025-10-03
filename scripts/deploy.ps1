# =================================
# AquaFarm Pro - Production Deployment Script (PowerShell)
# =================================
# 
# تاريخ: 1 أكتوبر 2025
# سكريبت النشر التلقائي للإنتاج (Windows)
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

Write-Status "🚀 بدء عملية نشر AquaFarm Pro..."

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

Write-Status "فحص المتطلبات الأساسية..."

# Upload project files to VPS
Write-Status "رفع ملفات المشروع إلى VPS..."
$UploadCommand = "scp -r `"$LocalPath`" ${VpsUser}@${VpsHost}:/opt/aquafarm/"
Write-Status "تنفيذ الأمر: $UploadCommand"

try {
    Invoke-Expression $UploadCommand
    Write-Success "تم رفع الملفات بنجاح"
} catch {
    Write-Error "فشل في رفع الملفات: $_"
    exit 1
}

# Connect to VPS and run deployment
Write-Status "الاتصال بـ VPS وتشغيل النشر..."
$DeployCommand = @"
ssh ${VpsUser}@${VpsHost} "
cd /opt/aquafarm &&
chmod +x scripts/*.sh &&
./scripts/deploy.sh
"
"@

Write-Status "تنفيذ النشر على VPS..."
Write-Host "=========================================="
Write-Host "سيتم الآن تشغيل النشر على VPS"
Write-Host "قد يستغرق هذا عدة دقائق..."
Write-Host "=========================================="

try {
    Invoke-Expression $DeployCommand
    Write-Success "تم النشر بنجاح على VPS"
} catch {
    Write-Error "فشل في النشر على VPS: $_"
    Write-Warning "يرجى التحقق من الاتصال بـ VPS وتشغيل النشر يدوياً"
}

# Final status
Write-Host ""
Write-Host "=========================================="
Write-Host "🎉 تم إكمال عملية النشر!"
Write-Host "=========================================="
Write-Host ""
Write-Host "روابط الخدمات:"
Write-Host "• الموقع الرئيسي: https://aquafarm.cloud"
Write-Host "• API: https://api.aquafarm.cloud"
Write-Host "• API Health: https://api.aquafarm.cloud/health"
Write-Host "• API Docs: https://api.aquafarm.cloud/api"
Write-Host "• Admin Panel: https://admin.aquafarm.cloud"
Write-Host "• Monitoring: https://aquafarm.cloud:3002"
Write-Host ""
Write-Host "معلومات الإدارة:"
Write-Host "• Admin Email: admin@aquafarm.cloud"
Write-Host "• Admin Password: AquaFarm2025AdminPassword"
Write-Host ""
Write-Host "أوامر مفيدة:"
Write-Host "• فحص الخدمات: ssh ${VpsUser}@${VpsHost} 'cd /opt/aquafarm && docker-compose -f docker-compose.production.yml ps'"
Write-Host "• عرض السجلات: ssh ${VpsUser}@${VpsHost} 'cd /opt/aquafarm && docker-compose -f docker-compose.production.yml logs -f'"
Write-Host "• إعادة تشغيل: ssh ${VpsUser}@${VpsHost} 'cd /opt/aquafarm && docker-compose -f docker-compose.production.yml restart'"
Write-Host ""
Write-Host "=========================================="

Write-Success "تم إكمال النشر بنجاح! 🎉"
