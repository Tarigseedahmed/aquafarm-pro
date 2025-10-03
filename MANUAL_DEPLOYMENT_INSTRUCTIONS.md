# 🚀 تعليمات النشر اليدوي - AquaFarm Pro

## 📋 معلومات VPS

- **Host**: srv1029413.hstgr.cloud
- **IP**: 72.60.187.58
- **User**: root
- **Password**: Tariq2024Tariq2026@#

## 🔧 الخطوة 1: رفع الملفات إلى VPS

### الطريقة 1: استخدام SCP (موصى بها)

```bash
# افتح Command Prompt أو PowerShell
cd "F:\Aqua Pro"

# ارفع ملفات المشروع
scp -r "F:\Aqua Pro Deploy" root@72.60.187.58:/opt/aquafarm/

# عند طلب كلمة المرور، أدخل: Tariq2024Tariq2026@#
```

### الطريقة 2: استخدام FileZilla أو WinSCP

1.افتح FileZilla أو WinSCP
2. **Host**: srv1029413.hstgr.cloud
3. **Username**: root
4. **Password**: Tariq2024Tariq2026@#
5. **Port**: 22
6. ارفع مجلد "F:\Aqua Pro Deploy" إلى `/opt/aquafarm/`

## 🔧 الخطوة 2: الاتصال بـ VPS وتشغيل النشر

```bash
# الاتصال بـ VPS
ssh root@72.60.187.58

# كلمة المرور: Tariq2024Tariq2026@#

# الانتقال لمجلد المشروع
cd /opt/aquafarm

# إعطاء صلاحيات التنفيذ
chmod +x scripts/*.sh

# تشغيل سكريبت النشر
./scripts/deploy.sh
```

## 🔧 الخطوة 3: إعداد متغيرات البيئة

```bash
# إنشاء ملف البيئة
nano .env

# إضافة المحتوى التالي:
```

```env
# Database
DB_NAME=aquafarm_prod
DB_USER=aquafarm_user
DB_PASSWORD=aquafarm_secure_password_123

# Redis
REDIS_PASSWORD=redis_secure_password_123

# JWT
JWT_SECRET=your_jwt_secret_key_here_1234567890abcdef

# URLs
NEXT_PUBLIC_API_URL=https://72.60.187.58/api
NEXT_PUBLIC_APP_URL=https://72.60.187.58
CORS_ORIGIN=https://72.60.187.58

# Grafana
GRAFANA_ADMIN_PASSWORD=admin123
```

## 🔧 الخطوة 4: تشغيل الحاويات

```bash
# تشغيل قاعدة البيانات و Redis أولاً
docker-compose -f docker-compose.hostinger.yml up -d postgres redis

# انتظار حتى تصبح جاهزة
docker-compose -f docker-compose.hostinger.yml logs -f postgres

# تشغيل باقي الخدمات
docker-compose -f docker-compose.hostinger.yml up -d

# تشغيل migrations
docker-compose -f docker-compose.hostinger.yml run --rm backend npm run migration:run
```

## 🔧 الخطوة 5: التحقق من النشر

```bash
# فحص حالة الحاويات
docker-compose -f docker-compose.hostinger.yml ps

# فحص السجلات
docker-compose -f docker-compose.hostinger.yml logs -f backend

# فحص الصحة
curl http://localhost/health
```

## 🌐 الوصول للتطبيق

بعد النشر الناجح، يمكنك الوصول إلى:

- **الموقع الرئيسي**: http://72.60.187.58
- **API**: http://72.60.187.58/api
- **API Docs**: http://72.60.187.58/api/docs
- **Health Check**: http://72.60.187.58/health
- **Grafana**: http://72.60.187.58:3002
- **Prometheus**: http://72.60.187.58:9090

## 🛠️ أوامر مفيدة للصيانة

```bash
# إعادة تشغيل خدمة
docker-compose -f docker-compose.hostinger.yml restart backend

# عرض السجلات
docker-compose -f docker-compose.hostinger.yml logs -f backend

# الدخول للحاوية
docker-compose -f docker-compose.hostinger.yml exec backend sh

# إيقاف جميع الخدمات
docker-compose -f docker-compose.hostinger.yml down

# إعادة تشغيل كامل
docker-compose -f docker-compose.hostinger.yml down && docker-compose -f docker-compose.hostinger.yml up -d
```

## 🔐 إعداد SSL (اختياري)

```bash
# تثبيت Certbot
apt update
apt install certbot python3-certbot-nginx

# الحصول على شهادة SSL
certbot --nginx -d aquafarm.cloud -d api.aquafarm.cloud -d admin.aquafarm.cloud
```

## 📞 في حالة وجود مشاكل

```bash
# فحص حالة Docker
docker ps
docker-compose -f docker-compose.hostinger.yml ps

# فحص السجلات للأخطاء
docker-compose -f docker-compose.hostinger.yml logs | grep -i error

# فحص استخدام الموارد
docker stats

# تنظيف الحاويات المتوقفة
docker container prune
```

---

## 🎯 ملخص سريع

1. **رفع الملفات**: `scp -r "F:\Aqua Pro Deploy" root@72.60.187.58:/opt/aquafarm/`
2. **الاتصال**: `ssh root@72.60.187.58`
3. **النشر**: `cd /opt/aquafarm && ./scripts/deploy.sh`
4. **التحقق**: `docker-compose -f docker-compose.hostinger.yml ps`

**كلمة المرور**: Tariq2024Tariq2026@#
