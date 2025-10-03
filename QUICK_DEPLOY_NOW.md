# 🚀 نشر AquaFarm Pro الآن - تعليمات سريعة

## ⚡ النشر السريع (5 خطوات)

### 1️⃣ رفع الملفات إلى VPS

```bash
# افتح Command Prompt أو PowerShell
cd "F:\Aqua Pro"

# ارفع الملفات (سيطلب كلمة المرور: Tariq2024Tariq2026@#)
scp -r "F:\Aqua Pro Deploy" root@72.60.187.58:/opt/aquafarm/
```

### 2️⃣ الاتصال بـ VPS

```bash
# الاتصال (كلمة المرور: Tariq2024Tariq2026@#)
ssh root@72.60.187.58
```

### 3️⃣ تشغيل النشر

```bash
# في VPS
cd /opt/aquafarm
chmod +x scripts/deploy-simple.sh
./scripts/deploy-simple.sh
```

### 4️⃣ التحقق من النشر

```bash
# فحص الحاويات
docker-compose -f docker-compose.hostinger.yml ps

# فحص الصحة
curl http://localhost/health
```

### 5️⃣ الوصول للتطبيق

- **الموقع**: http://72.60.187.58
- **API**: http://72.60.187.58/api
- **API Docs**: http://72.60.187.58/api/docs

---

## 🔧 معلومات VPS

- **Host**: srv1029413.hstgr.cloud
- **IP**: 72.60.187.58
- **User**: root
- **Password**: Tariq2024Tariq2026@#

---

## 🆘 في حالة المشاكل

```bash
# فحص السجلات
docker-compose -f docker-compose.hostinger.yml logs -f backend

# إعادة تشغيل
docker-compose -f docker-compose.hostinger.yml restart

# إيقاف وإعادة تشغيل
docker-compose -f docker-compose.hostinger.yml down
docker-compose -f docker-compose.hostinger.yml up -d
```

---

## 📱 البديل: استخدام FileZilla

إذا واجهت مشاكل مع SCP:

1. **حمل FileZilla**: https://filezilla-project.org/
2. **اتصل بـ VPS**:
   - Host: srv1029413.hstgr.cloud
   - Username: root
   - Password: Tariq2024Tariq2026@#
   - Port: 22
3. **ارفع مجلد**: "F:\Aqua Pro Deploy" إلى `/opt/aquafarm/`

---

**🎯 الوقت المتوقع**: 10-15 دقيقة  
**🎉 النتيجة**: تطبيق AquaFarm Pro يعمل على VPS!
