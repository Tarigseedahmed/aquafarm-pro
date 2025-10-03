# دليل تشغيل AquaFarm Pro على Docker Desktop

## 🐳 نظرة عامة

تم تشغيل **AquaFarm Pro** بنجاح على Docker Desktop! التطبيق الآن يعمل في حاويات منفصلة مع قاعدة بيانات PostgreSQL و Redis.

## 📊 حالة الخدمات

### ✅ الخدمات النشطة

| الخدمة | الحاوية | المنفذ | الحالة |
|--------|---------|--------|--------|
| **Frontend** | aquafarm-frontend | 3001 | ✅ يعمل |
| **PostgreSQL** | aquafarm-postgres | 5432 | ✅ يعمل |
| **Redis** | aquafarm-redis | 6379 | ✅ يعمل |

## 🌐 الوصول للتطبيق

### رابط التطبيق الرئيسي
```
http://localhost:3001
```

### روابط إضافية
- **Frontend**: http://localhost:3001
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 🎯 الميزات المتاحة

### 1. **لوحة التحكم الرئيسية**
- بطاقات المؤشرات الرئيسية (KPI)
- رسوم بيانية تفاعلية
- تنبيهات ذكية
- إحصائيات فورية

### 2. **إدارة الأحواض**
- عرض شبكي للأحواض
- فلترة وبحث متقدم
- تفاصيل شاملة لكل حوض
- إضافة أحواض جديدة

### 3. **خريطة المزرعة**
- خريطة تفاعلية للمزرعة
- شبكة أحواض قابلة للنقر
- عرض تفاصيل الحوض
- إضافة أحواض جديدة

### 4. **التحليلات والإحصائيات**
- رسوم بيانية متقدمة
- تحليل الإنتاج
- مؤشرات الأداء
- تقارير مفصلة

### 5. **معرض المكونات**
- عرض جميع المكونات
- أمثلة تفاعلية
- دليل الاستخدام

## 🛠️ إدارة الحاويات

### عرض الحاويات النشطة
```bash
docker ps
```

### عرض سجلات التطبيق
```bash
# سجلات الفرونت إند
docker logs aquafarm-frontend

# سجلات قاعدة البيانات
docker logs aquafarm-postgres

# سجلات Redis
docker logs aquafarm-redis
```

### إيقاف التطبيق
```bash
docker-compose -f docker-compose.simple.yml down
```

### إعادة تشغيل التطبيق
```bash
docker-compose -f docker-compose.simple.yml up -d
```

### إعادة بناء التطبيق
```bash
docker-compose -f docker-compose.simple.yml up --build -d
```

## 🔧 إدارة قاعدة البيانات

### الاتصال بقاعدة البيانات
```bash
# استخدام psql
docker exec -it aquafarm-postgres psql -U aquafarm -d aquafarm_dev

# أو استخدام أي عميل قاعدة بيانات
Host: localhost
Port: 5432
Database: aquafarm_dev
Username: aquafarm
Password: aquafarm123
```

### إدارة Redis
```bash
# الاتصال بـ Redis
docker exec -it aquafarm-redis redis-cli
```

## 📁 هيكل الملفات

```
Aqua Pro/
├── docker-compose.simple.yml    # ملف Docker Compose المبسط
├── frontend/
│   ├── Dockerfile.dev          # Dockerfile للتطوير
│   ├── src/                    # كود الفرونت إند
│   └── package.json            # تبعيات الفرونت إند
├── backend/                    # كود الباك إند
└── infra/                      # ملفات البنية التحتية
```

## 🎨 الميزات التقنية

### **التقنيات المستخدمة**
- **React 19** مع TypeScript
- **Next.js 15.5.4** مع Turbopack
- **Tailwind CSS** للتصميم
- **Framer Motion** للرسوم المتحركة
- **Recharts** للرسوم البيانية
- **shadcn/ui** للمكونات
- **PostgreSQL** لقاعدة البيانات
- **Redis** للتخزين المؤقت

### **الميزات المتقدمة**
- ✅ دعم RTL/LTR كامل
- ✅ الوضع المظلم/الفاتح
- ✅ رسوم متحركة سلسة
- ✅ تصميم متجاوب
- ✅ بحث ذكي
- ✅ فلترة متقدمة
- ✅ تنبيهات ذكية
- ✅ مراقبة جودة الماء

## 🚀 الصفحات المتاحة

### 1. **الصفحة الرئيسية**
```
http://localhost:3001/
```

### 2. **لوحة التحكم**
```
http://localhost:3001/dashboard
```

### 3. **إدارة الأحواض**
```
http://localhost:3001/ponds
```

### 4. **خريطة المزرعة**
```
http://localhost:3001/farm-map
```

### 5. **التحليلات**
```
http://localhost:3001/analytics
```

### 6. **معرض المكونات**
```
http://localhost:3001/demo
```

## 🔍 استكشاف الأخطاء

### مشاكل شائعة وحلولها

#### 1. **التطبيق لا يعمل**
```bash
# تحقق من حالة الحاويات
docker ps

# تحقق من السجلات
docker logs aquafarm-frontend
```

#### 2. **مشاكل في قاعدة البيانات**
```bash
# إعادة تشغيل قاعدة البيانات
docker restart aquafarm-postgres

# فحص الاتصال
docker exec -it aquafarm-postgres pg_isready
```

#### 3. **مشاكل في Redis**
```bash
# إعادة تشغيل Redis
docker restart aquafarm-redis

# فحص الاتصال
docker exec -it aquafarm-redis redis-cli ping
```

#### 4. **مشاكل في الفرونت إند**
```bash
# إعادة بناء الفرونت إند
docker-compose -f docker-compose.simple.yml up --build -d frontend
```

## 📊 مراقبة الأداء

### استخدام موارد النظام
```bash
# مراقبة استخدام الموارد
docker stats

# مراقبة مساحة القرص
docker system df
```

### تنظيف النظام
```bash
# تنظيف الحاويات المتوقفة
docker container prune

# تنظيف الصور غير المستخدمة
docker image prune

# تنظيف شامل
docker system prune
```

## 🎯 الخطوات التالية

### 1. **استكشاف التطبيق**
- زيارة http://localhost:3001
- تجربة جميع الصفحات
- اختبار الميزات التفاعلية

### 2. **تخصيص التطبيق**
- تعديل الألوان في `tailwind.config.ts`
- إضافة مكونات جديدة
- تخصيص الرسوم المتحركة

### 3. **التطوير**
- إضافة ميزات جديدة
- تحسين الأداء
- إضافة اختبارات

## 🎉 تهانينا!

تم تشغيل **AquaFarm Pro** بنجاح على Docker Desktop! 

التطبيق الآن جاهز للاستخدام مع جميع الميزات المتقدمة:
- واجهة مستخدم حديثة ومتجاوبة
- دعم كامل للغة العربية
- رسوم متحركة سلسة
- رسوم بيانية تفاعلية
- إدارة شاملة للأحواض
- تحليلات متقدمة

استمتع باستخدام نظام إدارة مزارع الأسماك المتقدم! 🐟✨