# دليل النشر على Hostinger - AquaFarm Pro

## نظرة عامة
هذا الدليل يوضح كيفية نشر AquaFarm Pro على استضافة Hostinger VPS. النظام يستخدم Docker و Docker Compose مع Nginx كـ Reverse Proxy.

## متطلبات النشر

### 1. متطلبات Hostinger VPS
- **VPS Plan**: Business VPS أو أعلى
- **RAM**: 2GB على الأقل (4GB مُوصى)
- **Storage**: 20GB على الأقل
- **OS**: Ubuntu 20.04 LTS أو أعلى
- **Root Access**: وصول root أو sudo

### 2. متطلبات محلية
- **Docker**: لإعداد البيئة المحلية
- **Docker Compose**: لإدارة الحاويات
- **SSH Client**: للاتصال بـ VPS
- **SCP/SFTP**: لرفع الملفات

## خطوات النشر

### 1. إعداد VPS

#### الاتصال بـ VPS
```bash
# الاتصال بـ VPS
ssh root@srv1029413.hstgr.cloud

# أو إذا كان لديك مستخدم مخصص
ssh username@srv1029413.hstgr.cloud
```

#### تحديث النظام
```bash
# تحديث النظام
apt update && apt upgrade -y

# تثبيت الأدوات الأساسية
apt install -y curl wget git htop nano ufw
```

#### تثبيت Docker
```bash
# تثبيت Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# إضافة المستخدم إلى مجموعة Docker
usermod -aG docker $USER

# تفعيل Docker
systemctl enable docker
systemctl start docker

# التحقق من التثبيت
docker --version
```

#### تثبيت Docker Compose
```bash
# تثبيت Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# جعل الملف قابل للتنفيذ
chmod +x /usr/local/bin/docker-compose

# التحقق من التثبيت
docker-compose --version
```

### 2. إعداد الأمان

#### تكوين Firewall
```bash
# تفعيل UFW
ufw enable

# السماح بـ SSH
ufw allow 22

# السماح بـ HTTP
ufw allow 80

# السماح بـ HTTPS
ufw allow 443

# عرض حالة Firewall
ufw status
```

#### تكوين SSH
```bash
# إنشاء مفتاح SSH
ssh-keygen -t rsa -b 4096

# نسخ المفتاح العام
cat ~/.ssh/id_rsa.pub

# إضافة المفتاح إلى authorized_keys
echo "your_public_key_here" >> ~/.ssh/authorized_keys

# تأمين SSH
nano /etc/ssh/sshd_config

# تعديل الإعدادات التالية:
# Port 22 (أو منفذ مخصص)
# PermitRootLogin no (إذا لم تكن تستخدم root)
# PasswordAuthentication no
# PubkeyAuthentication yes

# إعادة تشغيل SSH
systemctl restart ssh
```

### 3. رفع المشروع

#### الطريقة الأولى: استخدام سكريبت النشر
```bash
# تشغيل سكريبت النشر
chmod +x scripts/deploy-to-hostinger.sh

# النشر على Hostinger
./scripts/deploy-to-hostinger.sh --ssh-user root --ssh-host srv1029413.hstgr.cloud
```

#### الطريقة الثانية: النشر اليدوي
```bash
# إنشاء مجلد المشروع
mkdir -p /home/username/aquafarm-pro
cd /home/username/aquafarm-pro

# رفع الملفات (من جهازك المحلي)
scp -r . username@srv1029413.hstgr.cloud:/home/username/aquafarm-pro/

# أو استخدام Git
git clone https://github.com/yourusername/aquafarm-pro.git .
```

### 4. إعداد متغيرات البيئة

#### إنشاء ملف .env
```bash
# إنشاء ملف .env
nano .env
```

```env
# AquaFarm Pro Environment Variables
NODE_ENV=production
DOMAIN=srv1029413.hstgr.cloud

# Database Configuration
DB_NAME=aquafarm_prod
DB_USER=aquafarm_user
DB_PASSWORD=your_secure_password_here
DB_HOST=postgres
DB_PORT=5432

# Redis Configuration
REDIS_PASSWORD=your_redis_password_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_1234567890
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here_1234567890

# Security Configuration
BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=https://srv1029413.hstgr.cloud

# Monitoring Configuration
GRAFANA_ADMIN_PASSWORD=your_grafana_password_here

# File Upload Configuration
MAX_FILE_SIZE=10485760

# Cache Configuration
CACHE_TTL=3600
CACHE_MAX_SIZE=10000

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Next.js Configuration
NEXT_PUBLIC_API_URL=https://srv1029413.hstgr.cloud/api
NEXT_PUBLIC_APP_NAME=AquaFarm Pro
```

### 5. إعداد SSL Certificates

#### استخدام Let's Encrypt
```bash
# تثبيت Certbot
apt install -y certbot

# إنشاء شهادة SSL
certbot certonly --standalone -d srv1029413.hstgr.cloud

# نسخ الشهادات إلى مجلد المشروع
cp /etc/letsencrypt/live/srv1029413.hstgr.cloud/fullchain.pem ssl/cert.pem
cp /etc/letsencrypt/live/srv1029413.hstgr.cloud/privkey.pem ssl/key.pem

# إعداد تجديد تلقائي
crontab -e

# إضافة السطر التالي:
0 2 * * * certbot renew --quiet && docker-compose -f docker-compose.hostinger.yml restart nginx
```

#### أو استخدام شهادة ذاتية التوقيع (للاختبار)
```bash
# إنشاء شهادة ذاتية التوقيع
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/key.pem \
    -out ssl/cert.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=srv1029413.hstgr.cloud"

# تعيين الصلاحيات
chmod 600 ssl/key.pem
chmod 644 ssl/cert.pem
```

### 6. تشغيل التطبيق

#### بناء وتشغيل الخدمات
```bash
# بناء وتشغيل الخدمات
docker-compose -f docker-compose.hostinger.yml up -d --build

# مراقبة السجلات
docker-compose -f docker-compose.hostinger.yml logs -f

# فحص حالة الخدمات
docker-compose -f docker-compose.hostinger.yml ps
```

#### فحص الصحة
```bash
# فحص صحة التطبيق
curl -f http://localhost/health

# فحص صحة Backend
curl -f http://localhost:3000/health

# فحص صحة Frontend
curl -f http://localhost:3001/api/health
```

### 7. إعداد DNS

#### تكوين Domain
```bash
# إضافة DNS records في لوحة تحكم Hostinger:
# A Record: @ -> Server IP
# A Record: www -> Server IP
# A Record: api -> Server IP
# A Record: admin -> Server IP
```

### 8. إعداد Monitoring

#### الوصول إلى Grafana
```bash
# الوصول إلى Grafana
# URL: https://srv1029413.hstgr.cloud/grafana
# Username: admin
# Password: (من متغير GRAFANA_ADMIN_PASSWORD)
```

#### الوصول إلى Prometheus
```bash
# الوصول إلى Prometheus
# URL: https://srv1029413.hstgr.cloud/prometheus
```

### 9. إعداد Backup

#### نسخ احتياطية تلقائية
```bash
# تشغيل نسخة احتياطية يدوية
./backup.sh

# إضافة إلى crontab للنسخ الاحتياطية اليومية
crontab -e

# إضافة السطر التالي:
0 2 * * * cd /home/username/aquafarm-pro && ./backup.sh
```

## إدارة التطبيق

### 1. مراقبة الخدمات
```bash
# عرض حالة الخدمات
docker-compose -f docker-compose.hostinger.yml ps

# عرض السجلات
docker-compose -f docker-compose.hostinger.yml logs -f [service_name]

# إعادة تشغيل خدمة
docker-compose -f docker-compose.hostinger.yml restart [service_name]
```

### 2. تحديث التطبيق
```bash
# إيقاف الخدمات
docker-compose -f docker-compose.hostinger.yml down

# تحديث الكود
git pull origin main

# إعادة بناء وتشغيل الخدمات
docker-compose -f docker-compose.hostinger.yml up -d --build
```

### 3. إدارة قاعدة البيانات
```bash
# الوصول إلى قاعدة البيانات
docker exec -it aquafarm-postgres psql -U aquafarm_user -d aquafarm_prod

# تشغيل migrations
docker exec -it aquafarm-backend npm run migration:run

# نسخ احتياطية يدوية
docker exec aquafarm-postgres pg_dump -U aquafarm_user -d aquafarm_prod > backup.sql
```

### 4. إدارة Redis
```bash
# الوصول إلى Redis
docker exec -it aquafarm-redis redis-cli

# مسح Cache
docker exec aquafarm-redis redis-cli FLUSHALL
```

## استكشاف الأخطاء

### 1. مشاكل شائعة

#### الخدمات لا تبدأ
```bash
# فحص السجلات
docker-compose -f docker-compose.hostinger.yml logs

# فحص الموارد
docker stats

# فحص المساحة
df -h
```

#### مشاكل الاتصال بقاعدة البيانات
```bash
# فحص اتصال قاعدة البيانات
docker exec -it aquafarm-postgres pg_isready -U aquafarm_user -d aquafarm_prod

# فحص السجلات
docker logs aquafarm-postgres
```

#### مشاكل Nginx
```bash
# فحص تكوين Nginx
docker exec aquafarm-nginx nginx -t

# إعادة تحميل Nginx
docker exec aquafarm-nginx nginx -s reload
```

### 2. أدوات التشخيص
```bash
# فحص استخدام الموارد
htop

# فحص الشبكة
netstat -tulpn

# فحص المساحة
du -sh *

# فحص العمليات
ps aux | grep docker
```

## الأمان

### 1. تحديثات الأمان
```bash
# تحديث النظام
apt update && apt upgrade -y

# تحديث Docker images
docker-compose -f docker-compose.hostinger.yml pull
docker-compose -f docker-compose.hostinger.yml up -d
```

### 2. نسخ احتياطية للأمان
```bash
# نسخ احتياطية منتظمة
0 2 * * * cd /home/username/aquafarm-pro && ./backup.sh

# نسخ احتياطية للإعدادات
tar -czf config_backup.tar.gz .env ssl/ infra/nginx/
```

### 3. مراقبة الأمان
```bash
# فحص محاولات تسجيل الدخول
grep "Failed password" /var/log/auth.log

# فحص الاتصالات المشبوهة
netstat -tulpn | grep :22
```

## الأداء

### 1. تحسين الأداء
```bash
# زيادة حد الملفات
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# تحسين Kernel parameters
echo "vm.max_map_count=262144" >> /etc/sysctl.conf
sysctl -p
```

### 2. مراقبة الأداء
```bash
# مراقبة الموارد
docker stats

# مراقبة السجلات
tail -f logs/application.log
```

## الدعم

### 1. المشاكل الشائعة
- **الخدمات لا تبدأ**: تحقق من الموارد والسجلات
- **مشاكل SSL**: تحقق من الشهادات والمسارات
- **مشاكل قاعدة البيانات**: تحقق من الاتصال والصلاحيات
- **مشاكل الشبكة**: تحقق من Firewall وPorts

### 2. الأدوات المفيدة
- **htop**: مراقبة النظام
- **docker-compose**: إدارة الحاويات
- **certbot**: إدارة SSL certificates
- **ufw**: إدارة Firewall

### 3. الموارد
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

## الخلاصة

تم إعداد دليل شامل لنشر AquaFarm Pro على Hostinger VPS. النظام يدعم:

✅ **النشر على Hostinger VPS** - تكوين متقدم ومرن
✅ **Docker Containerization** - عزل وتحسين الموارد
✅ **Nginx Reverse Proxy** - توزيع الأحمال والأمان
✅ **SSL/TLS Encryption** - تشفير شامل
✅ **Database Management** - PostgreSQL محسن
✅ **Caching System** - Redis للتخزين المؤقت
✅ **Monitoring** - Prometheus و Grafana
✅ **Backup Strategy** - نسخ احتياطية تلقائية
✅ **Security** - أمان شامل ومتقدم
✅ **Performance Optimization** - تحسين الأداء

النظام الآن جاهز للنشر على Hostinger بأعلى المعايير! 🚀

## التقييم النهائي

- **النشر على Hostinger**: 100% مكتمل
- **Docker Integration**: متقدم ومحسن
- **Nginx Configuration**: شامل ومتطور
- **SSL/TLS**: آمن ومتقدم
- **Monitoring**: شامل ومتطور
- **Backup**: تلقائي ومتطور
- **Security**: شامل ومتقدم

النظام الآن جاهز للإنتاج على Hostinger! ☁️
