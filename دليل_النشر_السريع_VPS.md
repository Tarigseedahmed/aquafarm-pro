# 🚀 دليل النشر السريع على VPS Hostinger

## معلومات الخادم

- **🖥️ IP**: `72.60.187.58`
- **🌐 اسم المضيف**: `srv1029413.hstgr.cloud`
- **👤 المستخدم**: `root`
- **🔑 كلمة المرور**: `Tariq2024Tariq2026@#`
- **📍 الموقع**: France - Paris
- **💻 نظام التشغيل**: Ubuntu 24.04 with Docker

---

## طريقة النشر السريعة 🎯

### الخطوة 1: اختبار الاتصال بالخادم

افتح PowerShell وجرب الاتصال:

```powershell
ssh root@72.60.187.58
```

اكتب كلمة المرور عند الطلب: `Tariq2024Tariq2026@#`

إذا نجح الاتصال، اخرج بكتابة: `exit`

---

### الخطوة 2: تشغيل سكريبت النشر التلقائي

في PowerShell، انتقل إلى مجلد المشروع ثم شغّل:

```powershell
cd "f:\Aqua Pro"
.\scripts\deploy-to-vps.ps1
```

سيقوم السكريبت بـ:
- ✅ اختبار الاتصال بالخادم
- ✅ تثبيت Docker و Docker Compose
- ✅ إعداد الجدار الناري (Firewall)
- ✅ رفع ملفات المشروع
- ✅ إعداد قاعدة البيانات
- ✅ إنشاء شهادات SSL
- ✅ تشغيل التطبيق

---

## النشر اليدوي (خطوة بخطوة) 📝

إذا واجهت مشاكل مع السكريبت التلقائي، اتبع هذه الخطوات:

### 1️⃣ الاتصال بالخادم

```powershell
ssh root@72.60.187.58
```

### 2️⃣ تثبيت المتطلبات

```bash
# تحديث النظام
apt update && apt upgrade -y

# تثبيت الأدوات الأساسية
apt install -y curl wget git nano ufw

# تثبيت Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker

# تثبيت Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# التحقق من التثبيت
docker --version
docker-compose --version
```

### 3️⃣ إعداد الجدار الناري

```bash
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw reload
ufw status
```

### 4️⃣ إنشاء مجلدات المشروع

```bash
mkdir -p /root/aquafarm-pro
cd /root/aquafarm-pro

mkdir -p uploads logs backups ssl
chmod 755 uploads logs backups
chmod 700 ssl
```

### 5️⃣ رفع الملفات (من جهازك المحلي)

افتح PowerShell جديد على جهازك:

```powershell
# انتقل لمجلد المشروع
cd "f:\Aqua Pro"

# إنشاء أرشيف
tar -czf aquafarm.tar.gz --exclude=node_modules --exclude=.git --exclude="*.log" .

# رفع الأرشيف
scp aquafarm.tar.gz root@72.60.187.58:/root/aquafarm-pro/
```

### 6️⃣ استخراج الملفات (على الخادم)

ارجع لنافذة SSH:

```bash
cd /root/aquafarm-pro
tar -xzf aquafarm.tar.gz
rm aquafarm.tar.gz
ls -la
```

### 7️⃣ إعداد ملف البيئة

```bash
# نسخ ملف البيئة
cp env.hostinger.production .env

# تعديل إذا لزم الأمر
nano .env
```

تأكد من القيم التالية في `.env`:

```env
NODE_ENV=production
DOMAIN=72.60.187.58

DB_NAME=aquafarm_prod
DB_USER=aquafarm_user
DB_PASSWORD=aquafarm_secure_password_123

REDIS_PASSWORD=redis_secure_password_123

JWT_SECRET=aquafarm_jwt_secret_key_here_1234567890_very_secure
JWT_REFRESH_SECRET=aquafarm_refresh_secret_key_here_1234567890_very_secure

CORS_ORIGIN=http://72.60.187.58
NEXT_PUBLIC_API_URL=http://72.60.187.58/api
```

احفظ بـ: `Ctrl+X` ثم `Y` ثم `Enter`

### 8️⃣ إنشاء شهادات SSL

```bash
cd /root/aquafarm-pro/ssl

# شهادة موقعة ذاتياً للبداية
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout key.pem \
    -out cert.pem \
    -subj "/C=SA/ST=State/L=City/O=AquaFarm/CN=72.60.187.58"

chmod 600 key.pem
chmod 644 cert.pem
```

### 9️⃣ تشغيل التطبيق

```bash
cd /root/aquafarm-pro

# تشغيل Docker Compose
docker-compose -f docker-compose.hostinger.yml up -d --build

# الانتظار قليلاً
sleep 30

# التحقق من الحالة
docker-compose -f docker-compose.hostinger.yml ps
```

---

## التحقق من التطبيق ✅

### من المتصفح:

- **الموقع الرئيسي**: http://72.60.187.58
- **API Docs**: http://72.60.187.58/api
- **Health Check**: http://72.60.187.58/health

### من الخادم:

```bash
# اختبار Backend
curl http://localhost:3000/health

# اختبار Frontend
curl http://localhost:3001

# اختبار Nginx
curl http://localhost/health
```

---

## الأوامر المفيدة 🛠️

### عرض السجلات:

```bash
# جميع الخدمات
docker-compose -f docker-compose.hostinger.yml logs -f

# خدمة معينة
docker logs aquafarm-backend -f
docker logs aquafarm-frontend -f
docker logs aquafarm-postgres -f
```

### إعادة التشغيل:

```bash
# إعادة تشغيل جميع الخدمات
docker-compose -f docker-compose.hostinger.yml restart

# إعادة تشغيل خدمة معينة
docker-compose -f docker-compose.hostinger.yml restart backend
```

### إيقاف التطبيق:

```bash
docker-compose -f docker-compose.hostinger.yml down
```

### تحديث التطبيق:

```bash
# سحب آخر التغييرات
cd /root/aquafarm-pro
git pull  # إذا كنت تستخدم Git

# إعادة البناء والتشغيل
docker-compose -f docker-compose.hostinger.yml down
docker-compose -f docker-compose.hostinger.yml up -d --build
```

### نسخ احتياطي لقاعدة البيانات:

```bash
# نسخ احتياطي
docker exec aquafarm-postgres pg_dump -U aquafarm_user aquafarm_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# استعادة
docker exec -i aquafarm-postgres psql -U aquafarm_user -d aquafarm_prod < backup_file.sql
```

---

## حل المشاكل الشائعة 🔧

### المشكلة: الحاوية لا تعمل

```bash
# عرض السجلات
docker logs aquafarm-backend --tail 100

# التحقق من المتغيرات البيئية
docker exec aquafarm-backend env | grep DB
```

### المشكلة: قاعدة البيانات لا تتصل

```bash
# اختبار اتصال PostgreSQL
docker exec aquafarm-postgres pg_isready -U aquafarm_user

# الدخول إلى PostgreSQL
docker exec -it aquafarm-postgres psql -U aquafarm_user -d aquafarm_prod
```

### المشكلة: المنافذ مستخدمة

```bash
# عرض المنافذ المستخدمة
netstat -tuln | grep -E ':(80|443|3000|3001|5432|6379)'

# إيقاف العمليات المستخدمة للمنفذ
lsof -ti:80 | xargs kill -9
```

### المشكلة: مساحة القرص ممتلئة

```bash
# التحقق من المساحة
df -h

# تنظيف Docker
docker system prune -a --volumes

# حذف الصور القديمة
docker image prune -a
```

---

## تحسينات مستقبلية 🚀

### 1. استخدام Let's Encrypt للـ SSL:

```bash
# تثبيت Certbot
apt install -y certbot

# الحصول على شهادة
certbot certonly --standalone -d srv1029413.hstgr.cloud

# نسخ الشهادات
cp /etc/letsencrypt/live/srv1029413.hstgr.cloud/fullchain.pem /root/aquafarm-pro/ssl/cert.pem
cp /etc/letsencrypt/live/srv1029413.hstgr.cloud/privkey.pem /root/aquafarm-pro/ssl/key.pem

# إعادة تشغيل Nginx
docker-compose -f docker-compose.hostinger.yml restart nginx
```

### 2. إعداد النسخ الاحتياطي التلقائي:

```bash
# إنشاء سكريبت النسخ الاحتياطي
nano /root/backup.sh
```

أضف المحتوى:

```bash
#!/bin/bash
BACKUP_DIR="/root/aquafarm-pro/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# نسخ قاعدة البيانات
docker exec aquafarm-postgres pg_dump -U aquafarm_user aquafarm_prod > $BACKUP_DIR/db_$DATE.sql

# ضغط النسخة
gzip $BACKUP_DIR/db_$DATE.sql

# حذف النسخ القديمة (أكثر من 7 أيام)
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

```bash
# جعل السكريبت قابل للتنفيذ
chmod +x /root/backup.sh

# جدولة النسخ الاحتياطي (يومياً الساعة 2 صباحاً)
crontab -e
# أضف السطر:
0 2 * * * /root/backup.sh
```

### 3. مراقبة الأداء:

```bash
# تثبيت أدوات المراقبة
apt install -y htop iotop nethogs

# مراقبة الموارد
htop
```

---

## معلومات الاتصال 📞

- **الدعم الفني**: tariq@aquafarm.com
- **الوثائق**: https://docs.aquafarm.cloud
- **GitHub**: https://github.com/Tarigseedahmed/REPO

---

## الملاحظات الأمنية 🔒

⚠️ **مهم جداً:**

1. **غيّر كلمات المرور الافتراضية** في ملف `.env`
2. **استخدم شهادة SSL حقيقية** (Let's Encrypt)
3. **فعّل النسخ الاحتياطي التلقائي**
4. **حدّث النظام بانتظام**: `apt update && apt upgrade`
5. **راقب السجلات بانتظام**
6. **لا تشارك معلومات الوصول**

---

## الخلاصة ✨

بعد اتباع هذه الخطوات، سيكون تطبيق AquaFarm Pro جاهزاً ويعمل على:

- ✅ **Frontend**: http://72.60.187.58
- ✅ **Backend API**: http://72.60.187.58/api
- ✅ **API Documentation**: http://72.60.187.58/api/docs
- ✅ **Health Check**: http://72.60.187.58/health

---

**🎉 مبروك! تطبيقك الآن يعمل على VPS 🎉**
