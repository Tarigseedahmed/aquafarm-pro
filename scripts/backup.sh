#!/bin/bash

# =================================
# AquaFarm Pro - Backup Script
# =================================
# 
# تاريخ: 1 أكتوبر 2025
# سكريبت النسخ الاحتياطي لقاعدة البيانات والملفات
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

# Configuration
BACKUP_DIR="/opt/aquafarm/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="aquafarm_backup_${DATE}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

print_status "بدء عملية النسخ الاحتياطي..."

# Create backup directory for this backup
mkdir -p "$BACKUP_PATH"

# Database backup
print_status "نسخ احتياطي لقاعدة البيانات..."
docker-compose -f /opt/aquafarm/docker-compose.production.yml exec -T postgres pg_dump -U aquafarm_user aquafarm_prod > "$BACKUP_PATH/database.sql"

if [ $? -eq 0 ]; then
    print_success "تم نسخ قاعدة البيانات بنجاح"
else
    print_error "فشل في نسخ قاعدة البيانات"
    exit 1
fi

# Application files backup
print_status "نسخ احتياطي لملفات التطبيق..."
cp -r /opt/aquafarm/uploads "$BACKUP_PATH/" 2>/dev/null || print_warning "No uploads directory found"
cp -r /opt/aquafarm/logs "$BACKUP_PATH/" 2>/dev/null || print_warning "No logs directory found"

# Configuration files backup
print_status "نسخ احتياطي لملفات التكوين..."
cp /opt/aquafarm/env.production "$BACKUP_PATH/" 2>/dev/null || print_warning "No env.production file found"
cp /opt/aquafarm/docker-compose.production.yml "$BACKUP_PATH/" 2>/dev/null || print_warning "No docker-compose file found"

# Create backup info file
cat > "$BACKUP_PATH/backup_info.txt" << EOF
AquaFarm Pro Backup Information
==============================
Backup Date: $(date)
Backup Name: $BACKUP_NAME
Database: aquafarm_prod
Files Included:
- database.sql (PostgreSQL dump)
- uploads/ (User uploaded files)
- logs/ (Application logs)
- env.production (Environment configuration)
- docker-compose.production.yml (Docker configuration)

Restore Instructions:
1. Stop services: docker-compose down
2. Restore database: docker-compose exec postgres psql -U aquafarm_user -d aquafarm_prod < database.sql
3. Restore files: cp -r uploads/ /opt/aquafarm/ && cp -r logs/ /opt/aquafarm/
4. Start services: docker-compose up -d
EOF

# Compress backup
print_status "ضغط النسخة الاحتياطية..."
cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"

# Keep only last 7 days of backups
print_status "تنظيف النسخ القديمة..."
find "$BACKUP_DIR" -name "aquafarm_backup_*.tar.gz" -mtime +7 -delete

# Check backup size
BACKUP_SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
print_success "تم إنشاء النسخة الاحتياطية: ${BACKUP_NAME}.tar.gz (الحجم: $BACKUP_SIZE)"

# Send notification (if configured)
if [ ! -z "$BACKUP_NOTIFICATION_EMAIL" ]; then
    print_status "إرسال إشعار النسخ الاحتياطي..."
    echo "AquaFarm Pro Backup Completed Successfully

Backup Details:
- Name: $BACKUP_NAME
- Size: $BACKUP_SIZE
- Date: $(date)
- Location: $BACKUP_DIR/${BACKUP_NAME}.tar.gz

The backup has been compressed and stored successfully." | mail -s "AquaFarm Pro Backup - $DATE" "$BACKUP_NOTIFICATION_EMAIL" || print_warning "Failed to send notification email"
fi

print_success "تم إكمال النسخ الاحتياطي بنجاح! 🎉"


