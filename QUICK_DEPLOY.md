# 🚀 دليل النشر السريع - AquaFarm Pro

## 📋 المتطلبات الأساسية

### 1.VPS Hostinger

- **VPS**: srv1029413.hstgr.cloud
- **النطاق**: aquafarm.cloud
- **نظام التشغيل**: Ubuntu 20.04+

### 2. المتطلبات التقنية

```bash
# Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## 🎯 النشر في 5 خطوات

### الخطوة 1: رفع الملفات

```bash
# من الجهاز المحلي
scp -r "F:/Aqua Pro" root@srv1029413.hstgr.cloud:/opt/aquafarm/
```

### الخطوة 2: الاتصال بـ VPS

```bash
ssh root@srv1029413.hstgr.cloud
cd /opt/aquafarm
```

### الخطوة 3: إعداد البيئة

```bash
# نسخ ملف البيئة
cp env.production .env

# إعطاء صلاحيات التنفيذ
chmod +x scripts/*.sh
```

### الخطوة 4: تشغيل النشر

```bash
# تشغيل سكريبت النشر التلقائي
./scripts/deploy.sh
```

### الخطوة 5: التحقق من النشر

```bash
# فحص الخدمات
docker-compose -f docker-compose.production.yml ps

# فحص السجلات
docker-compose -f docker-compose.production.yml logs -f
```

## 🌐 تكوين DNS

### في لوحة تحكم Hostinger

1.اذهب إلى **Domains** → **aquafarm.cloud** → **DNS Zone**
2. أضف السجلات التالية:

```text
Type    Name                    Value
A       aquafarm.cloud          YOUR_VPS_IP
A       www.aquafarm.cloud      YOUR_VPS_IP
A       api.aquafarm.cloud      YOUR_VPS_IP
A       admin.aquafarm.cloud    YOUR_VPS_IP
```

## 🔒 إعداد SSL

### تلقائي (مُوصى به)

```bash
# تثبيت Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# طلب الشهادات
sudo certbot --nginx -d aquafarm.cloud -d api.aquafarm.cloud -d admin.aquafarm.cloud
```

### يدوي

```bash
# إنشاء مجلد SSL
mkdir -p /opt/aquafarm/infra/nginx/ssl

# نسخ الشهادات إلى المجلد
cp /etc/letsencrypt/live/aquafarm.cloud/fullchain.pem /opt/aquafarm/infra/nginx/ssl/aquafarm.cloud.crt
cp /etc/letsencrypt/live/aquafarm.cloud/privkey.pem /opt/aquafarm/infra/nginx/ssl/aquafarm.cloud.key
```

## 📊 المراقبة

### لوحة تحكم Grafana

- **الرابط**: https://aquafarm.cloud:3002
- **المستخدم**: admin
- **كلمة المرور**: AquaFarm2025GrafanaPassword

### Prometheus

- **الرابط**: https://aquafarm.cloud:9090

## 🔧 الأوامر المفيدة

### إدارة الخدمات

```bash
# بدء الخدمات
docker-compose -f docker-compose.production.yml up -d

# إيقاف الخدمات
docker-compose -f docker-compose.production.yml down

# إعادة تشغيل خدمة معينة
docker-compose -f docker-compose.production.yml restart backend

# عرض السجلات
docker-compose -f docker-compose.production.yml logs -f backend
```

### النسخ الاحتياطي

```bash
# نسخ احتياطي يدوي
./scripts/backup.sh

# استعادة من نسخة احتياطية
./scripts/restore.sh /opt/aquafarm/backups/aquafarm_backup_YYYYMMDD_HHMMSS.tar.gz
```

### التحديثات

```bash
# تحديث التطبيق
git pull origin main
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d
```

## 🌐 الروابط النهائية

بعد النشر الناجح، ستكون هذه الروابط متاحة:

- **الموقع الرئيسي**: https://aquafarm.cloud
- **API**: https://api.aquafarm.cloud
- **API Health**: https://api.aquafarm.cloud/health
- **API Docs**: https://api.aquafarm.cloud/api
- **Admin Panel**: https://admin.aquafarm.cloud
- **Monitoring**: https://aquafarm.cloud:3002

## 🔐 معلومات الإدارة

- **Admin Email**: admin@aquafarm.cloud
- **Admin Password**: AquaFarm2025AdminPassword
- **Database**: aquafarm_prod
- **Redis**: aquafarm_redis

## 🆘 استكشاف الأخطاء

### مشاكل شائعة

1. **الخدمات لا تبدأ**

   ```bash
   docker-compose -f docker-compose.production.yml logs
   ```

2.**مشاكل SSL**

   ```bash
   sudo certbot renew --force-renewal
   ```

3.**مشاكل قاعدة البيانات**

   ```bash
   docker-compose -f docker-compose.production.yml exec postgres psql -U aquafarm_user -d aquafarm_prod
   ```

4.**مشاكل الذاكرة**

   ```bash
   docker system prune -f
   ```

## 📞 الدعم

- **VPS**: تواصل مع دعم Hostinger
- **النطاق**: استخدم إدارة النطاقات في Hostinger
- **التطبيق**: راجع السجلات والوثائق

---

**🎉 تهانينا! تم نشر AquaFarm Pro بنجاح!**


