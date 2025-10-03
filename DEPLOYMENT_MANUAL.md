# دليل النشر المتقدم - AquaFarm Pro

## نظرة عامة

هذا دليل شامل لنشر وإدارة AquaFarm Pro على خادم Hostinger VPS باستخدام نظام نشر متقدم ومتعدد المراحل.

## المتطلبات

### المتطلبات المحلية
- Windows 10/11 مع PowerShell 5.0+
- Git for Windows أو WSL
- اتصال إنترنت مستقر
- مساحة قرص فارغة: 2GB على الأقل

### متطلبات الخادم
- Ubuntu 24.04 LTS
- 2GB RAM على الأقل
- 20GB مساحة تخزين على الأقل
- اتصال إنترنت عالي السرعة

## النظام المتقدم

### 1. نظام النشر المتقدم (`deploy-system.ps1`)

نظام نشر احترافي متعدد المراحل مع التحقق الشامل والمراقبة المتقدمة.

#### الاستخدام الأساسي:
```powershell
# النشر الكامل
.\scripts\deploy-system.ps1

# النشر مع خيارات مخصصة
.\scripts\deploy-system.ps1 -SSH_HOST "72.60.187.58" -DOMAIN "srv1029413.hstgr.cloud" -Environment "production"

# النشر مع تخطي بعض المراحل
.\scripts\deploy-system.ps1 -SkipSSL -SkipMonitoring
```

#### المراحل التسع للنشر:

1. **التحقق من المتطلبات**: فحص النظام والأدوات المطلوبة
2. **التحقق من الشبكة**: اختبار الاتصال بالخادم
3. **تثبيت التبعيات**: تثبيت Docker وأدوات النظام
4. **إعداد المشروع**: إنشاء أرشيف المشروع
5. **تكوين البيئة**: إعداد متغيرات البيئة
6. **نشر التطبيق**: بناء وتشغيل الخدمات
7. **فحص الصحة**: التحقق من عمل جميع الخدمات
8. **إعداد SSL**: تكوين شهادات الأمان
9. **نظام النسخ الاحتياطي**: إعداد النسخ التلقائي

#### الميزات المتقدمة:

- **تسجيل مفصل**: تسجيل جميع العمليات مع الطوابع الزمنية
- **التحقق من الصحة**: فحص شامل لجميع الخدمات
- **إدارة الأخطاء**: معالجة متقدمة للأخطاء مع إعادة المحاولة
- **المراقبة المتقدمة**: مراقبة الموارد والأداء
- **النسخ الاحتياطي التلقائي**: نسخ احتياطي يومي تلقائي

### 2. نظام إدارة الخادم (`server-manager.ps1`)

نظام إدارة شامل للخادم مع أدوات متقدمة للصيانة والمراقبة.

#### الأوامر المتاحة:

```powershell
# فحص حالة الخدمات
.\scripts\server-manager.ps1 -Action status

# عرض سجلات الخدمات
.\scripts\server-manager.ps1 -Action logs -Service backend -Lines 100

# إعادة تشغيل الخدمات
.\scripts\server-manager.ps1 -Action restart -Service backend -Force

# إنشاء نسخة احتياطية
.\scripts\server-manager.ps1 -Action backup

# تحديث التطبيق
.\scripts\server-manager.ps1 -Action update -Force

# مراقبة النظام
.\scripts\server-manager.ps1 -Action monitor

# فحص الصحة الشامل
.\scripts\server-manager.ps1 -Action health

# تحديث شهادات SSL
.\scripts\server-manager.ps1 -Action ssl

# تنظيف النظام
.\scripts\server-manager.ps1 -Action cleanup -Force

# فحص الأمان
.\scripts\server-manager.ps1 -Action security
```

#### الميزات المتقدمة:

- **مراقبة الموارد**: مراقبة CPU والذاكرة والقرص
- **إدارة الحاويات**: إدارة شاملة لحاويات Docker
- **مراقبة الشبكة**: مراقبة الاتصالات والمنافذ
- **فحص الأمان**: فحص شامل لإعدادات الأمان
- **إدارة السجلات**: عرض وتحليل سجلات النظام

### 3. لوحة المراقبة المتقدمة (`monitoring-dashboard.ps1`)

نظام مراقبة متقدم في الوقت الفعلي مع التنبيهات التلقائية.

#### الاستخدام:

```powershell
# مراقبة لمرة واحدة
.\scripts\monitoring-dashboard.ps1

# مراقبة مستمرة
.\scripts\monitoring-dashboard.ps1 -Continuous -RefreshInterval 30

# تصدير البيانات
.\scripts\monitoring-dashboard.ps1 -ExportToFile
```

#### المقاييس المراقبة:

- **مقاييس النظام**: CPU، الذاكرة، القرص، الحمل
- **مقاييس Docker**: حالة الحاويات، استخدام الموارد
- **مقاييس التطبيق**: صحة API، اتصالات قاعدة البيانات
- **مقاييس الشبكة**: الاتصالات، الاستجابة
- **مقاييس الأمان**: شهادات SSL، محاولات الدخول

#### نظام التنبيهات:

- **تنبيهات حرجة**: CPU > 80%، الذاكرة > 85%
- **تنبيهات الأمان**: محاولات دخول فاشلة، شهادات منتهية الصلاحية
- **تنبيهات الخدمة**: خدمات غير صحية، أخطاء في السجلات

## إجراءات النشر المتقدمة

### النشر الأولي

1. **تحضير البيئة المحلية**:
```powershell
# فحص المتطلبات
.\scripts\deploy-system.ps1 -SkipDependencies -SkipSSL -SkipMonitoring
```

2. **النشر الكامل**:
```powershell
# النشر مع جميع الميزات
.\scripts\deploy-system.ps1 -Environment production
```

3. **التحقق من النشر**:
```powershell
# فحص الصحة
.\scripts\server-manager.ps1 -Action health

# مراقبة النظام
.\scripts\monitoring-dashboard.ps1
```

### الصيانة اليومية

1. **فحص النظام**:
```powershell
.\scripts\server-manager.ps1 -Action status
```

2. **مراقبة الأداء**:
```powershell
.\scripts\monitoring-dashboard.ps1 -Continuous
```

3. **النسخ الاحتياطي**:
```powershell
.\scripts\server-manager.ps1 -Action backup
```

### الصيانة الأسبوعية

1. **تنظيف النظام**:
```powershell
.\scripts\server-manager.ps1 -Action cleanup -Force
```

2. **فحص الأمان**:
```powershell
.\scripts\server-manager.ps1 -Action security
```

3. **تحديث التطبيق**:
```powershell
.\scripts\server-manager.ps1 -Action update -Force
```

## استكشاف الأخطاء

### مشاكل شائعة وحلولها

1. **فشل الاتصال SSH**:
   - تأكد من صحة عنوان IP وكلمة المرور
   - فحص إعدادات الجدار الناري
   - التأكد من تشغيل خدمة SSH

2. **فشل بناء Docker**:
   - فحص مساحة القرص المتاحة
   - التأكد من اتصال الإنترنت
   - فحص سجلات Docker

3. **خدمات غير صحية**:
   - فحص سجلات الخدمات
   - التحقق من متغيرات البيئة
   - إعادة تشغيل الخدمات

### أدوات التشخيص

```powershell
# فحص شامل للنظام
.\scripts\server-manager.ps1 -Action monitor

# فحص الصحة التفصيلي
.\scripts\server-manager.ps1 -Action health

# عرض سجلات مفصلة
.\scripts\server-manager.ps1 -Action logs -Service backend -Lines 200
```

## الأمان المتقدم

### إعدادات الأمان

1. **الجدار الناري**:
   - منافذ مفتوحة: 22, 80, 443, 3000, 3001, 5432, 6379, 9090, 9091
   - منع الوصول المباشر لقاعدة البيانات

2. **SSL/TLS**:
   - شهادات Let's Encrypt تلقائية
   - تجديد تلقائي للشهادات
   - إعادة توجيه HTTP إلى HTTPS

3. **مراقبة الأمان**:
   - مراقبة محاولات الدخول الفاشلة
   - تنبيهات الأمان التلقائية
   - سجلات أمان مفصلة

### فحص الأمان

```powershell
# فحص شامل للأمان
.\scripts\server-manager.ps1 -Action security

# مراقبة محاولات الدخول
.\scripts\monitoring-dashboard.ps1 -Continuous
```

## النسخ الاحتياطي والاستعادة

### النسخ الاحتياطي التلقائي

- **جدولة**: يومياً في الساعة 2:00 صباحاً
- **الاحتفاظ**: آخر 7 نسخ احتياطية
- **التخزين**: مجلد `/home/root/aquafarm-pro/backups/`

### النسخ الاحتياطي اليدوي

```powershell
# إنشاء نسخة احتياطية فورية
.\scripts\server-manager.ps1 -Action backup
```

### استعادة البيانات

```powershell
# استعادة من النسخة الاحتياطية
ssh root@72.60.187.58 "cd /home/root/aquafarm-pro && tar -xzf backups/aquafarm_backup_YYYYMMDD_HHMMSS.tar.gz"
```

## المراقبة المتقدمة

### مقاييس الأداء

- **استجابة API**: < 5 ثوان
- **استخدام CPU**: < 80%
- **استخدام الذاكرة**: < 85%
- **استخدام القرص**: < 90%

### التنبيهات التلقائية

- **تنبيهات حرجة**: إشعارات فورية
- **تنبيهات تحذيرية**: إشعارات يومية
- **تقارير دورية**: تقارير أسبوعية

## الدعم والصيانة

### معلومات الاتصال

- **خادم الإنتاج**: srv1029413.hstgr.cloud
- **عنوان IP**: 72.60.187.58
- **مستخدم SSH**: root
- **منفذ SSH**: 22

### أوامر مفيدة

```powershell
# الدخول للخادم
ssh root@72.60.187.58

# عرض حالة الخدمات
docker-compose -f /home/root/aquafarm-pro/docker-compose.hostinger.yml ps

# عرض سجلات مفصلة
docker-compose -f /home/root/aquafarm-pro/docker-compose.hostinger.yml logs -f

# إعادة تشغيل الخدمات
docker-compose -f /home/root/aquafarm-pro/docker-compose.hostinger.yml restart
```

### ملفات مهمة

- **ملف البيئة**: `/home/root/aquafarm-pro/.env`
- **ملف Docker Compose**: `/home/root/aquafarm-pro/docker-compose.hostinger.yml`
- **سجلات النظام**: `/home/root/aquafarm-pro/logs/`
- **النسخ الاحتياطية**: `/home/root/aquafarm-pro/backups/`

---

## خلاصة

هذا النظام المتقدم يوفر:

✅ **نشر آمن ومتدرج** مع التحقق الشامل
✅ **إدارة شاملة للخادم** مع أدوات متقدمة
✅ **مراقبة في الوقت الفعلي** مع تنبيهات تلقائية
✅ **نسخ احتياطي تلقائي** مع استعادة سريعة
✅ **أمان متقدم** مع فحص دوري
✅ **صيانة تلقائية** مع تنظيف دوري

النظام مصمم ليكون **احترافياً ومتكاملاً** ولا يتطلب حلول مؤقتة أو مبسطة.
