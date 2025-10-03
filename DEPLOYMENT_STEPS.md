# خطوات النشر للإنتاج - AquaFarm Pro

**التاريخ:** 1 أكتوبر 2025  
**الحالة:** جاهز للتنفيذ بعد DNS  
**المتطلب:** DNS Configuration يجب أن يكون مكتملاً

---

## 📋 نظرة عامة

هذا الدليل يوضح الخطوات التفصيلية لنشر AquaFarm Pro إلى الإنتاج على Hostinger VPS.

### المعلومات الأساسية
- **VPS IP:** 72.60.187.58
- **Hostname:** srv1029413.hstgr.cloud
- **Domain:** aquafarm.cloud
- **OS:** Ubuntu 22.04 LTS (افتراضي)
- **Docker:** نعم
- **Docker Compose:** نعم

---

## ✅ المتطلبات المسبقة

قبل البدء، تأكد من:
- [x] DNS configuration مكتمل (انظر `docs/dns-setup-guide.md`)
- [x] DNS propagation انتهى (24-48 ساعة)
- [x] الوصول SSH إلى VPS
- [x] ملفات `.env.production` محضرة
- [ ] نسخة احتياطية من البيانات الحالية (إن وجدت)

---

## 🚀 المرحلة 1: الاتصال والإعداد الأولي

### 1.1 الاتصال بالـ VPS

```bash
# Windows (PowerShell)
ssh root@72.60.187.58

# Mac/Linux
ssh root@72.60.187.58
```

**أول مرة؟** ستحتاج كلمة مرور Root من لوحة تحكم Hostinger.

### 1.2 تحديث النظام

```bash
# تحديث قائمة الحزم
apt update

# ترقية الحزم المثبتة
apt upgrade -y

# تثبيت الأدوات الأساسية
apt install -y git curl wget nano htop ufw
```

### 1.3 إعداد Firewall

```bash
# السماح بـ SSH
ufw allow 22/tcp

# السماح بـ HTTP و HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# تفعيل Firewall
ufw enable

# التحقق من الحالة
ufw status
```

---

## 🐳 المرحلة 2: إعداد Docker

### 2.1 تثبيت Docker (إذا لم يكن مثبتاً)

```bash
# تثبيت Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# تفعيل Docker
systemctl enable docker
systemctl start docker

# التحقق
docker --version
```

### 2.2 تثبيت Docker Compose

```bash
# تحميل Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# إعطاء صلاحيات التنفيذ
chmod +x /usr/local/bin/docker-compose

# التحقق
docker-compose --version
```

---

## 📁 المرحلة 3: نسخ المشروع

### 3.1 إنشاء مجلد المشروع

```bash
# إنشاء مجلد التطبيقات
mkdir -p /opt/aquafarm

# الانتقال للمجلد
cd /opt/aquafarm
```

### 3.2 استنساخ المستودع

```bash
# استنساخ المشروع (استبدل بـ repo الفعلي)
git clone https://github.com/YOUR_USERNAME/aquafarm-pro.git .

# أو رفع الملفات يدوياً باستخدام SCP/SFTP
```

**بديل: رفع الملفات من جهازك المحلي**

```bash
# من جهازك المحلي (Windows PowerShell)
scp -r F:\Aqua Pro\* root@72.60.187.58:/opt/aquafarm/

# أو استخدام FileZilla/WinSCP
```

---

## ⚙️ المرحلة 4: إعداد متغيرات البيئة

### 4.1 إنشاء ملف .env.production

```bash
cd /opt/aquafarm

# نسخ من المثال
cp env.production.example .env.production

# تحرير الملف
nano .env.production
```

### 4.2 المتغيرات المطلوبة

```env
# Database
DATABASE_URL=postgresql://aquapro_user:STRONG_PASSWORD_HERE@postgres:5432/aquapro_production
DB_TYPE=postgres
DB_HOST=postgres
DB_PORT=5432
DB_NAME=aquapro_production
DB_USER=aquapro_user
DB_PASSWORD=STRONG_PASSWORD_HERE

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=GENERATE_STRONG_SECRET_HERE
JWT_EXPIRATION=24h

# Node Environment
NODE_ENV=production

# API
API_URL=https://api.aquafarm.cloud
FRONTEND_URL=https://aquafarm.cloud

# Tenant
DEFAULT_TENANT_CODE=default
DEFAULT_TENANT_NAME=AquaFarm Pro

# Email (إذا كان مُعداً)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@aquafarm.cloud
SMTP_PASSWORD=email_password_here

# Stripe (للدفع)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Observability
SERVICE_NAME=aquafarm-backend
LOG_LEVEL=info

# Hostinger API
HOSTINGER_API_KEY=RO6wIcLPWssb6SAtTCCLxWFtgPF4twQWsHEMqD2U1a099004
```

**مهم:** 
- غيّر جميع كلمات المرور
- استخدم `openssl rand -base64 32` لتوليد أسرار قوية
- احفظ الملف بعد التعديل (Ctrl+X ثم Y ثم Enter)

---

## 🏗️ المرحلة 5: بناء ونشر التطبيق

### 5.1 بناء الـ Images

```bash
cd /opt/aquafarm

# بناء جميع الخدمات
docker-compose -f docker-compose.yml build

# التحقق من الـ images
docker images
```

### 5.2 تشغيل قاعدة البيانات أولاً

```bash
# تشغيل PostgreSQL و Redis
docker-compose up -d postgres redis

# الانتظار 10 ثواني
sleep 10

# التحقق من التشغيل
docker ps
```

### 5.3 تنفيذ Migrations

```bash
# الدخول إلى Backend container
docker-compose run --rm backend npm run migration:run

# أو تشغيل مباشرة
cd backend
npm run migration:run
```

### 5.4 إنشاء Bootstrap Data

```bash
# إنشاء tenant وmستخدم افتراضي
docker-compose run --rm backend npm run bootstrap

# سيُنشئ:
# - Default tenant
# - Admin user (email: admin@aquafarm.cloud)
```

**احفظ بيانات الدخول!**

---

## 🌐 المرحلة 6: إعداد Nginx

### 6.1 نسخ ملف الإعداد

```bash
# نسخ ملف Nginx config
cp infra/nginx/aquafarm.conf /etc/nginx/sites-available/aquafarm.conf

# إنشاء symbolic link
ln -s /etc/nginx/sites-available/aquafarm.conf /etc/nginx/sites-enabled/

# حذف default config
rm /etc/nginx/sites-enabled/default

# اختبار الإعداد
nginx -t
```

### 6.2 إصدار SSL Certificates

```bash
# تثبيت Certbot
apt install -y certbot python3-certbot-nginx

# إصدار certificates
certbot --nginx -d aquafarm.cloud -d www.aquafarm.cloud -d api.aquafarm.cloud -d admin.aquafarm.cloud --email support@aquafarm.cloud --agree-tos --non-interactive

# التحقق من النجاح
certbot certificates
```

### 6.3 إعادة تشغيل Nginx

```bash
# إعادة تحميل الإعداد
nginx -s reload

# أو إعادة التشغيل
systemctl restart nginx

# التحقق من الحالة
systemctl status nginx
```

---

## 🚀 المرحلة 7: تشغيل جميع الخدمات

### 7.1 تشغيل الخدمات

```bash
cd /opt/aquafarm

# تشغيل جميع الخدمات
docker-compose up -d

# التحقق من الحالة
docker-compose ps

# مشاهدة الـ logs
docker-compose logs -f
```

### 7.2 التحقق من الخدمات

```bash
# Backend Health Check
curl http://localhost:3001/health

# Frontend
curl http://localhost:3000

# Database connection
docker-compose exec postgres psql -U aquapro_user -d aquapro_production -c "SELECT version();"
```

---

## ✅ المرحلة 8: اختبار النشر

### 8.1 اختبارات من الخادم

```bash
# Health check
curl https://api.aquafarm.cloud/health

# API documentation
curl https://api.aquafarm.cloud/api

# Frontend
curl https://aquafarm.cloud
```

### 8.2 اختبارات من المتصفح

افتح المتصفح وتحقق من:
- ✅ https://aquafarm.cloud (Frontend)
- ✅ https://api.aquafarm.cloud/health (Health Check)
- ✅ https://api.aquafarm.cloud/api (API Docs)
- ✅ تسجيل الدخول يعمل

### 8.3 اختبار تسجيل الدخول

```bash
# تسجيل دخول Admin
curl -X POST https://api.aquafarm.cloud/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@aquafarm.cloud",
    "password": "YOUR_ADMIN_PASSWORD"
  }'
```

---

## 📊 المرحلة 9: إعداد المراقبة

### 9.1 تشغيل Prometheus & Grafana

```bash
cd /opt/aquafarm

# تشغيل خدمات المراقبة
docker-compose -f docker-compose.dev.yml up -d prometheus grafana

# التحقق
docker ps | grep -E "prometheus|grafana"
```

### 9.2 الوصول إلى Grafana

- **URL:** http://72.60.187.58:3002
- **Username:** admin
- **Password:** admin123 (غيّرها فوراً!)

### 9.3 استيراد Dashboard

1. افتح Grafana
2. اذهب إلى **Configuration** > **Data Sources**
3. أضف **Prometheus**: http://prometheus:9090
4. اذهب إلى **Dashboards** > **Import**
5. استورد: `infra/grafana/dashboards/aquafarm-observability.json`

---

## 🔒 المرحلة 10: تأمين النظام

### 10.1 تقوية SSH

```bash
# تحرير SSH config
nano /etc/ssh/sshd_config

# غيّر هذه الإعدادات:
# PermitRootLogin no  # بعد إنشاء user آخر
# PasswordAuthentication no  # استخدم SSH keys
# Port 2222  # غيّر المنفذ الافتراضي

# إعادة تشغيل SSH
systemctl restart sshd
```

### 10.2 إعداد Fail2Ban

```bash
# تثبيت Fail2Ban
apt install -y fail2ban

# نسخ الإعداد الافتراضي
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# تفعيل وتشغيل
systemctl enable fail2ban
systemctl start fail2ban

# التحقق
fail2ban-client status
```

### 10.3 إعداد النسخ الاحتياطية التلقائية

```bash
# إنشاء مجلد النسخ الاحتياطية
mkdir -p /opt/backups

# إنشاء cron job
crontab -e

# إضافة هذا السطر (نسخة احتياطية يومياً في 2 صباحاً)
0 2 * * * /opt/aquafarm/scripts/backup-postgres.sh localhost 5432 aquapro_production aquapro_user /opt/backups
```

---

## 📝 المرحلة 11: التوثيق والتسليم

### 11.1 توثيق المعلومات

أنشئ ملف بمعلومات النشر:

```bash
cat > /opt/aquafarm/DEPLOYMENT_INFO.md << EOF
# AquaFarm Pro - Production Deployment Info

**Deployment Date:** $(date)
**Server IP:** 72.60.187.58
**Domain:** aquafarm.cloud

## URLs
- Frontend: https://aquafarm.cloud
- API: https://api.aquafarm.cloud
- API Docs: https://api.aquafarm.cloud/api
- Admin: https://admin.aquafarm.cloud
- Grafana: http://72.60.187.58:3002

## Admin Access
- Email: admin@aquafarm.cloud
- Password: [STORED SECURELY]

## Database
- Host: localhost (postgres container)
- Port: 5432
- Database: aquapro_production
- User: aquapro_user

## SSL Certificates
- Issuer: Let's Encrypt
- Auto-renewal: Enabled (certbot timer)

## Monitoring
- Prometheus: http://localhost:9090
- Grafana: http://72.60.187.58:3002

## Backup
- Location: /opt/backups
- Schedule: Daily at 2 AM
- Retention: 30 days

## Support
- DevOps: [CONTACT]
- Emergency: [CONTACT]
EOF
```

### 11.2 Checklist النهائي

```bash
# تشغيل سكريبت التحقق
cd /opt/aquafarm
./scripts/check-dns.sh

# التحقق من الخدمات
./scripts/health-check.sh
```

---

## 🚨 استكشاف الأخطاء

### مشكلة: Database connection failed

```bash
# التحقق من PostgreSQL
docker-compose logs postgres

# إعادة تشغيل
docker-compose restart postgres

# التحقق من الاتصال
docker-compose exec postgres psql -U aquapro_user -d aquapro_production
```

### مشكلة: Frontend لا يعمل

```bash
# التحقق من logs
docker-compose logs frontend

# إعادة البناء
docker-compose build frontend
docker-compose up -d frontend
```

### مشكلة: SSL certificates فشلت

```bash
# التحقق من DNS
nslookup aquafarm.cloud

# محاولة يدوية
certbot certonly --standalone -d aquafarm.cloud

# مراجعة logs
cat /var/log/letsencrypt/letsencrypt.log
```

---

## 📞 الدعم والمساعدة

### جهات الاتصال
- **DevOps Lead:** [اسم + رقم]
- **Backend Lead:** [اسم + رقم]
- **Emergency Hotline:** [رقم]

### الموارد
- **Documentation:** /opt/aquafarm/docs/
- **Logs:** /opt/aquafarm/logs/ or `docker-compose logs`
- **Backups:** /opt/backups/

---

## ✅ النجاح!

إذا وصلت هنا ونجحت جميع الاختبارات:

🎉 **تهانينا! AquaFarm Pro الآن في الإنتاج!**

### الخطوات التالية:
1. ✅ إشعار الفريق بالنشر الناجح
2. ✅ بدء مراقبة المقاييس في Grafana
3. ✅ جدولة اجتماع Review بعد أسبوع
4. ✅ تحضير للـ Pilot customers onboarding

---

**آخر تحديث:** 1 أكتوبر 2025  
**الحالة:** جاهز للتنفيذ  
**Next:** انتقل إلى [خطة الـ Pilot Customers](docs/pilot-customer-selection.md)

