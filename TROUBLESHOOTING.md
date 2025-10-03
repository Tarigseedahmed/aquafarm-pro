# 🆘 دليل استكشاف الأخطاء - AquaFarm Pro

## 🔍 المشاكل الشائعة وحلولها

### 1. مشاكل الاتصال بـ VPS

#### المشكلة: فشل الاتصال بـ SSH

```bash
# فحص الاتصال
ping srv1029413.hstgr.cloud

# فحص SSH
ssh -v root@srv1029413.hstgr.cloud
```

#### الحلول

- تأكد من أن VPS يعمل
- تحقق من إعدادات الجدار الناري
- تأكد من صحة مفاتيح SSH

### 2. مشاكل رفع الملفات

#### المشكلة: فشل في رفع الملفات

```bash
# فحص المساحة المتاحة
ssh root@srv1029413.hstgr.cloud "df -h"

# فحص الصلاحيات
ssh root@srv1029413.hstgr.cloud "ls -la /opt/"
```

#### حلول مشاكل الاتصال بـ SSH

- تحقق من المساحة المتاحة
- تأكد من الصلاحيات
- استخدم `rsync` بدلاً من `scp`

### 3. مشاكل Docker

#### المشكلة: Docker لا يعمل

```bash
# فحص حالة Docker
ssh root@srv1029413.hstgr.cloud "systemctl status docker"

# إعادة تشغيل Docker
ssh root@srv1029413.hstgr.cloud "systemctl restart docker"
```

#### حلول مشاكل رفع الملفات

- تثبيت Docker إذا لم يكن مثبتاً
- إعادة تشغيل الخدمة
- فحص السجلات

### 4. مشاكل قاعدة البيانات

#### المشكلة: قاعدة البيانات لا تبدأ

```bash
# فحص سجلات PostgreSQL
ssh root@srv1029413.hstgr.cloud "docker-compose -f /opt/aquafarm/docker-compose.production.yml logs postgres"

# فحص الاتصال
ssh root@srv1029413.hstgr.cloud "docker-compose -f /opt/aquafarm/docker-compose.production.yml exec postgres psql -U aquafarm_user -d aquafarm_prod"
```

#### حلول مشاكل Docker

- تحقق من متغيرات البيئة
- فحص السجلات
- إعادة تشغيل الخدمة

### 5. مشاكل SSL

#### المشكلة: شهادات SSL لا تعمل

```bash
# فحص الشهادات
ssh root@srv1029413.hstgr.cloud "sudo certbot certificates"

# تجديد الشهادات
ssh root@srv1029413.hstgr.cloud "sudo certbot renew --force-renewal"
```

#### حلول مشاكل قاعدة البيانات

- تثبيت Certbot
- طلب شهادات جديدة
- تحديث تكوين Nginx

## 🛠️ أوامر التشخيص

### فحص الخدمات

```bash
# فحص حالة الحاويات
ssh root@srv1029413.hstgr.cloud "cd /opt/aquafarm && docker-compose -f docker-compose.production.yml ps"

# فحص السجلات
ssh root@srv1029413.hstgr.cloud "cd /opt/aquafarm && docker-compose -f docker-compose.production.yml logs -f"

# فحص الموارد
ssh root@srv1029413.hstgr.cloud "docker stats"
```

### فحص الشبكة

```bash
# فحص المنافذ
ssh root@srv1029413.hstgr.cloud "netstat -tlnp"

# فحص الجدار الناري
ssh root@srv1029413.hstgr.cloud "ufw status"
```

### فحص النظام

```bash
# فحص الذاكرة
ssh root@srv1029413.hstgr.cloud "free -h"

# فحص القرص
ssh root@srv1029413.hstgr.cloud "df -h"

# فحص المعالج
ssh root@srv1029413.hstgr.cloud "top"
```

## 🔧 حلول سريعة

### إعادة تشغيل جميع الخدمات

```bash
ssh root@srv1029413.hstgr.cloud "cd /opt/aquafarm && docker-compose -f docker-compose.production.yml down && docker-compose -f docker-compose.production.yml up -d"
```

### تنظيف النظام

```bash
ssh root@srv1029413.hstgr.cloud "docker system prune -f"
```

### إعادة بناء الصور

```bash
ssh root@srv1029413.hstgr.cloud "cd /opt/aquafarm && docker-compose -f docker-compose.production.yml build --no-cache"
```

## 📞 الدعم

### معلومات الاتصال

- **VPS**: srv1029413.hstgr.cloud
- **النطاق**: aquafarm.cloud
- **دعم Hostinger**: [https://support.hostinger.com](https://support.hostinger.com)

### ملفات السجلات المهمة

- `/opt/aquafarm/logs/` - سجلات التطبيق
- `/var/log/nginx/` - سجلات Nginx
- `/var/log/docker/` - سجلات Docker

---

**💡 نصيحة**: احتفظ بنسخة احتياطية من التكوين قبل إجراء أي تغييرات!


