#!/bin/bash

# =================================
# AquaFarm Pro - Restore Script
# =================================
# 
# تاريخ: 1 أكتوبر 2025
# سكريبت استعادة النسخ الاحتياطية
# =================================

set -e  # Exit on any error

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

# Check if backup file is provided
if [ -z "$1" ]; then
    print_error "Usage: $0 <backup_file.tar.gz>"
    print_status "Available backups:"
    ls -la /opt/aquafarm/backups/ | grep "aquafarm_backup_" || print_warning "No backups found"
    exit 1
fi

BACKUP_FILE="$1"
BACKUP_DIR="/opt/aquafarm/backups"
RESTORE_DIR="/tmp/aquafarm_restore_$(date +%s)"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    print_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

print_status "بدء عملية الاستعادة من: $BACKUP_FILE"

# Create restore directory
mkdir -p "$RESTORE_DIR"

# Extract backup
print_status "استخراج النسخة الاحتياطية..."
tar -xzf "$BACKUP_FILE" -C "$RESTORE_DIR"

# Get backup name from extracted directory
BACKUP_NAME=$(ls "$RESTORE_DIR" | head -1)
RESTORE_PATH="$RESTORE_DIR/$BACKUP_NAME"

if [ ! -d "$RESTORE_PATH" ]; then
    print_error "Invalid backup format"
    exit 1
fi

print_success "تم استخراج النسخة الاحتياطية بنجاح"

# Stop services
print_status "إيقاف الخدمات..."
docker-compose -f /opt/aquafarm/docker-compose.production.yml down

# Wait for services to stop
sleep 10

# Restore database
if [ -f "$RESTORE_PATH/database.sql" ]; then
    print_status "استعادة قاعدة البيانات..."
    
    # Start only database service
    docker-compose -f /opt/aquafarm/docker-compose.production.yml up -d postgres
    
    # Wait for database to be ready
    print_status "انتظار جاهزية قاعدة البيانات..."
    sleep 30
    
    # Restore database
    docker-compose -f /opt/aquafarm/docker-compose.production.yml exec -T postgres psql -U aquafarm_user -d aquafarm_prod < "$RESTORE_PATH/database.sql"
    
    if [ $? -eq 0 ]; then
        print_success "تم استعادة قاعدة البيانات بنجاح"
    else
        print_error "فشل في استعادة قاعدة البيانات"
        exit 1
    fi
else
    print_warning "No database backup found in restore file"
fi

# Restore application files
if [ -d "$RESTORE_PATH/uploads" ]; then
    print_status "استعادة ملفات التطبيق..."
    cp -r "$RESTORE_PATH/uploads" /opt/aquafarm/ 2>/dev/null || print_warning "Failed to restore uploads"
    print_success "تم استعادة ملفات التطبيق"
fi

if [ -d "$RESTORE_PATH/logs" ]; then
    print_status "استعادة ملفات السجلات..."
    cp -r "$RESTORE_PATH/logs" /opt/aquafarm/ 2>/dev/null || print_warning "Failed to restore logs"
    print_success "تم استعادة ملفات السجلات"
fi

# Restore configuration files (optional)
if [ -f "$RESTORE_PATH/env.production" ]; then
    print_status "استعادة ملفات التكوين..."
    cp "$RESTORE_PATH/env.production" /opt/aquafarm/ 2>/dev/null || print_warning "Failed to restore env.production"
    print_success "تم استعادة ملفات التكوين"
fi

# Start all services
print_status "تشغيل جميع الخدمات..."
docker-compose -f /opt/aquafarm/docker-compose.production.yml up -d

# Wait for services to be ready
print_status "انتظار جاهزية الخدمات..."
sleep 30

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

# Cleanup restore directory
print_status "تنظيف الملفات المؤقتة..."
rm -rf "$RESTORE_DIR"

print_success "تم إكمال الاستعادة بنجاح! 🎉"

echo ""
echo "=========================================="
echo "✅ تم استعادة AquaFarm Pro بنجاح!"
echo "=========================================="
echo ""
echo "الخدمات المتاحة:"
echo "• الموقع الرئيسي: https://aquafarm.cloud"
echo "• API: https://api.aquafarm.cloud"
echo "• API Health: https://api.aquafarm.cloud/health"
echo ""
echo "=========================================="


