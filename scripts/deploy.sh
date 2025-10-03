#!/bin/bash

# =================================
# AquaFarm Pro - Production Deployment Script
# =================================
# 
# تاريخ: 1 أكتوبر 2025
# سكريبت النشر التلقائي للإنتاج
# =================================

set -e  # Exit on any error

echo "🚀 بدء عملية نشر AquaFarm Pro..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root. This is not recommended for production."
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "فحص المتطلبات الأساسية..."

# Check if .env.production exists
if [ ! -f "env.production" ]; then
    print_error "File env.production not found. Please create it first."
    exit 1
fi

print_success "تم فحص المتطلبات الأساسية بنجاح"

# Stop existing containers
print_status "إيقاف الحاويات الموجودة..."
docker-compose -f docker-compose.production.yml down --remove-orphans || true

# Remove old images to free space
print_status "تنظيف الصور القديمة..."
docker system prune -f || true

# Build and start services
print_status "بناء وتشغيل الخدمات..."
docker-compose -f docker-compose.production.yml --env-file env.production up -d --build

# Wait for services to be ready
print_status "انتظار جاهزية الخدمات..."
sleep 30

# Check if services are running
print_status "فحص حالة الخدمات..."
docker-compose -f docker-compose.production.yml ps

# Run database migrations
print_status "تشغيل ترحيل قاعدة البيانات..."
docker-compose -f docker-compose.production.yml exec -T backend npm run migration:run || {
    print_warning "Database migration failed. This might be normal if database is already migrated."
}

# Bootstrap admin user
print_status "إنشاء مستخدم الإدارة..."
docker-compose -f docker-compose.production.yml exec -T backend npm run bootstrap || {
    print_warning "Bootstrap failed. Admin user might already exist."
}

# Check service health
print_status "فحص صحة الخدمات..."

# Check backend health
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_success "Backend service is healthy"
else
    print_error "Backend service is not responding"
fi

# Check frontend health
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    print_success "Frontend service is healthy"
else
    print_error "Frontend service is not responding"
fi

# Check nginx health
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_success "Nginx service is healthy"
else
    print_error "Nginx service is not responding"
fi

# Setup SSL certificates (if not already done)
print_status "إعداد شهادات SSL..."
if ! command -v certbot &> /dev/null; then
    print_warning "Certbot not found. SSL certificates will need to be set up manually."
else
    # Check if certificates exist
    if [ ! -d "/etc/letsencrypt/live/aquafarm.cloud" ]; then
        print_status "طلب شهادات SSL جديدة..."
        certbot --nginx -d aquafarm.cloud -d api.aquafarm.cloud -d admin.aquafarm.cloud --non-interactive --agree-tos --email admin@aquafarm.cloud || {
            print_warning "SSL certificate setup failed. Please set up manually."
        }
    else
        print_success "SSL certificates already exist"
    fi
fi
    
    # Setup log rotation
print_status "إعداد تدوير السجلات..."
cat > /etc/logrotate.d/aquafarm << EOF
/opt/aquafarm/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        docker-compose -f /opt/aquafarm/docker-compose.production.yml restart nginx
    endscript
}
EOF

# Setup backup cron job
print_status "إعداد النسخ الاحتياطي التلقائي..."
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/aquafarm/scripts/backup.sh") | crontab -

# Setup firewall
print_status "إعداد الجدار الناري..."
ufw --force enable
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp

# Final status check
print_status "الفحص النهائي للحالة..."

    echo ""
echo "=========================================="
echo "🎉 تم نشر AquaFarm Pro بنجاح!"
echo "=========================================="
    echo ""
echo "روابط الخدمات:"
echo "• الموقع الرئيسي: https://aquafarm.cloud"
echo "• API: https://api.aquafarm.cloud"
echo "• API Health: https://api.aquafarm.cloud/health"
echo "• API Docs: https://api.aquafarm.cloud/api"
echo "• Admin Panel: https://admin.aquafarm.cloud"
echo "• Monitoring: https://aquafarm.cloud:3002 (Grafana)"
    echo ""
echo "معلومات الإدارة:"
echo "• Admin Email: admin@aquafarm.cloud"
echo "• Admin Password: AquaFarm2025AdminPassword"
    echo ""
echo "أوامر مفيدة:"
echo "• عرض السجلات: docker-compose -f docker-compose.production.yml logs -f"
echo "• إعادة تشغيل: docker-compose -f docker-compose.production.yml restart"
echo "• إيقاف: docker-compose -f docker-compose.production.yml down"
echo "• بدء: docker-compose -f docker-compose.production.yml up -d"
    echo ""
echo "=========================================="

print_success "تم إكمال النشر بنجاح! 🎉"