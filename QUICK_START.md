# Quick Start - AquaFarm Pro Production Deployment

## Prerequisites

- ✅ Hostinger VPS: srv1029413.hstgr.cloud
- ✅ Domain: aquafarm.cloud  
- ✅ API Key: RO6wIcLPWssb6SAtTCCLxWFtgPF4twQWsHEMqD2U1a099004

## Step 1: Get VPS IP Address

Run this script to get your VPS IP:

```bash
./scripts/get-vps-ip.sh
```

Or manually:

```bash
dig +short srv1029413.hstgr.cloud
```

### 3. تكوين متغيرات البيئة

```bash
# انسخ ملف المتغيرات
cp .env.example .env

# تحديث مفتاح Hostinger API (مُعد مسبقاً)
echo "HOSTINGER_API_KEY=RO6wIcLPWssb6SAtTCCLxWFtgPF4twQWsHEMqD2U1a099004" >> .env
```

### 4. تشغيل البيئة التطويرية

```bash
# تشغيل جميع الخدمات
docker-compose -f docker-compose.dev.yml up -d

# أو تشغيل خدمات محددة
docker-compose -f docker-compose.dev.yml up postgres-dev redis-dev -d
```

### 5. الوصول للخدمات

| الخدمة | URL | معلومات الدخول |
|--------|-----|----------------|
| **Frontend** | http://localhost:3001 | - |
| **Backend API** | http://localhost:3000 | - |
| **API Docs** | http://localhost:3000/api/docs | - |
| **pgAdmin** | http://localhost:5050 | admin@aquafarmpro.com / admin123 |
| **Redis Commander** | http://localhost:8081 | - |
| **Mailhog** | http://localhost:8025 | - |
| **Documentation** | http://localhost:8080 | - |

### 6. اختبار Hostinger API

```bash
# التحقق من صحة الاتصال
curl -H "Authorization: Bearer <JWT_TOKEN>" \
     http://localhost:3000/api/hostinger/health

# الحصول على معلومات VPS
curl -H "Authorization: Bearer <JWT_TOKEN>" \
     http://localhost:3000/api/hostinger/vps

# مراقبة موارد الخادم
curl -H "Authorization: Bearer <JWT_TOKEN>" \
     http://localhost:3000/api/hostinger/vps/{vps-id}/resources
```

### 7. البيانات الأولية

#### إنشاء مستخدم أولي

```bash
# داخل container الـ backend
docker exec -it aquafarm-backend-dev npm run seed:users
```

#### تحميل بيانات تجريبية

## تحميل مزارع تجريبية

docker exec -it aquafarm-backend-dev npm run seed:farms

## تحميل أحواض تجريبية

docker exec -it aquafarm-backend-dev npm run seed:ponds

```text

### 8. التطوير المحلي

#### Backend (NestJS)
```bash
cd backend
npm install
npm run start:dev
```

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

### 9. الأوامر المفيدة

```bash
# عرض logs الخدمات
docker-compose -f docker-compose.dev.yml logs -f backend-dev

# إعادة تشغيل خدمة محددة
docker-compose -f docker-compose.dev.yml restart backend-dev

# الدخول لـ shell خدمة
docker exec -it aquafarm-backend-dev sh

# تنظيف البيانات
docker-compose -f docker-compose.dev.yml down -v

# تحديث images
docker-compose -f docker-compose.dev.yml pull
```

### 10. النشر على Hostinger VPS

#### إعداد VPS

```bash
# الاتصال بـ VPS
ssh root@your-vps-ip

# تثبيت Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# تثبيت Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### نشر التطبيق

```bash
# نسخ الملفات للخادم
scp -r . root@your-vps-ip:/opt/aquafarm-pro/

# الاتصال بالخادم
ssh root@your-vps-ip

# الانتقال لمجلد التطبيق
cd /opt/aquafarm-pro

# تحديث متغيرات البيئة للإنتاج
cp .env.example .env.production
nano .env.production

# تشغيل التطبيق
docker-compose -f docker-compose.yml up -d
```

### 11. المراقبة والصحة

```bash
# فحص حالة جميع الخدمات
docker-compose ps

# فحص موارد النظام
docker stats

# فحص logs الأخطاء
docker-compose logs --tail=100 backend

# فحص صحة قاعدة البيانات
docker exec aquafarm-postgres pg_isready
```

### 12. النسخ الاحتياطية

#### النسخ الاحتياطي اليدوي

```bash
# نسخ احتياطي لقاعدة البيانات
docker exec aquafarm-postgres pg_dump -U postgres aquapro > backup_$(date +%Y%m%d_%H%M%S).sql

# نسخ احتياطي عبر Hostinger API
curl -X POST -H "Authorization: Bearer <JWT_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"name":"manual-backup"}' \
     http://localhost:3000/api/hostinger/vps/{vps-id}/backup
```

#### استعادة النسخ الاحتياطية

```bash
# استعادة قاعدة البيانات
docker exec -i aquafarm-postgres psql -U postgres aquapro < backup_file.sql

# استعادة عبر Hostinger API
curl -X POST -H "Authorization: Bearer <JWT_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"backupId":"backup-id"}' \
     http://localhost:3000/api/hostinger/vps/{vps-id}/restore
```

### 13. استكشاف الأخطاء

#### مشاكل شائعة

1. **فشل اتصال قاعدة البيانات**

   ```bash
   docker-compose restart postgres-dev
   docker-compose logs postgres-dev
   ```

2.**مشكلة في Hostinger API**

   ```bash
   # فحص مفتاح API
   echo $HOSTINGER_API_KEY
   
   # اختبار الاتصال
   curl -H "Authorization: Bearer $HOSTINGER_API_KEY" \
        https://api.hostinger.com/v1/ping
   ```

3.**مشاكل الذاكرة**

   ```bash
   # فحص استخدام الذاكرة
   docker stats --no-stream
   
   # زيادة memory limit
   docker-compose -f docker-compose.dev.yml up -d --scale backend-dev=1
   ```

### 14. الموارد المفيدة

- [Hostinger API Documentation](./docs/hostinger-api-guide.md)
- [Database Schema](./docs/db/schema.sql)
- [API Documentation](http://localhost:3000/api/docs)
- [Project Architecture](./docs/architecture.md)
- [Deployment Guide](./docs/deployment.md)

### 15. الدعم

- **البريد الإلكتروني**: dev@aquafarmpro.com
- **الوثائق**: ./docs/
- **Issues**: GitHub Issues
- **Hostinger Support**: console.hostinger.com

---

## 🎯 التحقق من التشغيل الصحيح

بعد التشغيل، تأكد من:

- ✅ Frontend يعمل على http://localhost:3001
- ✅ Backend API يعمل على http://localhost:3000
- ✅ قاعدة البيانات متصلة
- ✅ Redis يعمل بشكل صحيح
- ✅ Hostinger API يستجيب
- ✅ جميع health checks تمر بنجاح

**🚀 أهلاً وسهلاً بك في AquaFarm Pro!
