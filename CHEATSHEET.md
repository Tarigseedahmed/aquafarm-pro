# 📝 ورقة الغش - Cheat Sheet

## 🚀 نشر سريع - Quick Deploy

```powershell
# 1. اختبار الاتصال
cd "f:\Aqua Pro"
.\scripts\test-vps-connection.ps1

# 2. النشر
.\scripts\deploy-to-vps.ps1
```

---

## 🔗 معلومات الاتصال - Connection Info

```bash
# SSH
ssh root@72.60.187.58
Password: Tariq2024Tariq2026@#

# المسار
cd /root/aquafarm-pro
```

---

## 🐳 Docker - أوامر أساسية

```bash
# عرض الحاويات
docker-compose -f docker-compose.hostinger.yml ps

# عرض السجلات
docker-compose -f docker-compose.hostinger.yml logs -f

# سجلات خدمة معينة
docker logs aquafarm-backend -f
docker logs aquafarm-frontend -f
docker logs aquafarm-postgres -f
docker logs aquafarm-nginx -f

# إعادة تشغيل
docker-compose -f docker-compose.hostinger.yml restart

# إعادة تشغيل خدمة معينة
docker-compose -f docker-compose.hostinger.yml restart backend

# إيقاف
docker-compose -f docker-compose.hostinger.yml down

# تشغيل
docker-compose -f docker-compose.hostinger.yml up -d

# إعادة بناء
docker-compose -f docker-compose.hostinger.yml up -d --build
```

---

## 🔍 فحص الحالة - Health Checks

```bash
# Backend
curl http://localhost:3000/health

# Frontend
curl http://localhost:3001

# Nginx
curl http://localhost/health

# PostgreSQL
docker exec aquafarm-postgres pg_isready -U aquafarm_user

# Redis
docker exec aquafarm-redis redis-cli ping
```

---

## 💾 النسخ الاحتياطي - Backup

```bash
# نسخ احتياطي لقاعدة البيانات
docker exec aquafarm-postgres pg_dump -U aquafarm_user aquafarm_prod > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# ضغط النسخة
gzip backups/backup_*.sql

# استعادة
gunzip backups/backup_YYYYMMDD_HHMMSS.sql.gz
docker exec -i aquafarm-postgres psql -U aquafarm_user -d aquafarm_prod < backups/backup_YYYYMMDD_HHMMSS.sql
```

---

## 🔄 تحديث التطبيق - Update

### من جهازك

```powershell
cd "f:\Aqua Pro"
.\scripts\deploy-to-vps.ps1
```

### يدوياً

```powershell
# على جهازك
cd "f:\Aqua Pro"
tar -czf aquafarm.tar.gz --exclude=node_modules --exclude=.git .
scp aquafarm.tar.gz root@72.60.187.58:/root/aquafarm-pro/
```

```bash
# على الخادم
cd /root/aquafarm-pro
docker-compose -f docker-compose.hostinger.yml down
tar -xzf aquafarm.tar.gz
rm aquafarm.tar.gz
docker-compose -f docker-compose.hostinger.yml up -d --build
```

---

## 🛠️ صيانة - Maintenance

```bash
# تنظيف Docker
docker system prune -a --volumes

# حذف الصور القديمة
docker image prune -a

# حذف الحاويات المتوقفة
docker container prune

# عرض استخدام المساحة
df -h
docker system df

# حذف السجلات القديمة
find /root/aquafarm-pro/logs -name "*.log" -mtime +7 -delete
find /root/aquafarm-pro/backups -name "*.sql.gz" -mtime +30 -delete
```

---

## 🔥 جدار الحماية - Firewall

```bash
# حالة الجدار
ufw status

# السماح بمنفذ
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp

# رفض منفذ
ufw deny 3306/tcp

# إعادة تحميل
ufw reload
```

---

## 📊 مراقبة الموارد - Monitoring

```bash
# استخدام CPU والذاكرة
htop

# استخدام المساحة
df -h

# استخدام Docker
docker stats

# عمليات النظام
ps aux | grep node
ps aux | grep postgres

# المنافذ المفتوحة
netstat -tuln | grep LISTEN

# الاتصالات النشطة
netstat -ant | grep ESTABLISHED
```

---

## 🔐 الأمان - Security

```bash
# تحديث النظام
apt update && apt upgrade -y

# عرض محاولات تسجيل الدخول الفاشلة
grep "Failed password" /var/log/auth.log

# عرض المستخدمين المتصلين
who
w

# عرض آخر تسجيلات الدخول
last
```

---

## 📝 تحرير الإعدادات - Edit Config

```bash
# ملف البيئة
nano /root/aquafarm-pro/.env

# Docker Compose
nano /root/aquafarm-pro/docker-compose.hostinger.yml

# Nginx
nano /root/aquafarm-pro/infra/nginx/nginx.hostinger.conf
```

**احفظ بـ:** `Ctrl+X` ثم `Y` ثم `Enter`

---

## 🌐 روابط الوصول - URLs

```plaintext
Application:    http://72.60.187.58
API:           http://72.60.187.58/api
API Docs:      http://72.60.187.58/api/docs
Health:        http://72.60.187.58/health
Prometheus:    http://72.60.187.58:9090
Grafana:       http://72.60.187.58:3002
```

---

## 🔑 بيانات الدخول الافتراضية - Default Credentials

```plaintext
PostgreSQL:
  Database:  aquafarm_prod
  User:      aquafarm_user
  Password:  aquafarm_secure_password_123

Redis:
  Password:  redis_secure_password_123

Grafana:
  Username:  admin
  Password:  grafana_admin_secure_password_123
```

⚠️ **غيّر كلمات المرور في الإنتاج!**

---

## 🚨 حل المشاكل السريع - Quick Troubleshooting

### التطبيق لا يعمل

```bash
docker-compose -f docker-compose.hostinger.yml ps
docker-compose -f docker-compose.hostinger.yml logs --tail 100
```

### قاعدة البيانات لا تتصل

```bash
docker exec aquafarm-postgres pg_isready -U aquafarm_user
docker logs aquafarm-postgres --tail 100
```

### منفذ مستخدم

```bash
netstat -tuln | grep -E ':(80|443|3000|3001|5432)'
docker stop $(docker ps -aq)
docker-compose -f docker-compose.hostinger.yml up -d
```

### مساحة القرص ممتلئة

```bash
df -h
docker system prune -a --volumes
find /root/aquafarm-pro/logs -name "*.log" -delete
```

---

## 📞 الدعم - Support

```plaintext
Docs:     INDEX_DEPLOYMENT.md
Arabic:   دليل_النشر_خطوة_بخطوة.md
English:  QUICK_VPS_DEPLOY.md
Scripts:  scripts/README_DEPLOYMENT.md
```

---

## ⚡ نصائح سريعة - Quick Tips

1.**دائماً اعمل نسخة احتياطية قبل التحديث**
2. **راقب السجلات بانتظام**: `docker logs -f`
3. **راقب استخدام الموارد**: `htop` و `docker stats`
4. **حدّث النظام أسبوعياً**: `apt update && apt upgrade`
5. **نظّف Docker شهرياً**: `docker system prune`

---

**آخر تحديث:** October 2, 2025
**النسخة:** 1.0.0
