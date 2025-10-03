# 🚀 AquaFarm Pro - GitHub Setup

<div dir="rtl">

## 🎯 نظرة سريعة

هذا الدليل يوضح كيفية رفع مشروع AquaFarm Pro على [GitHub](https://github.com) وإعداده للعمل مع CI/CD pipeline.

</div>

## 📋 المتطلبات

- حساب GitHub
- Git مثبت على الجهاز
- مشروع AquaFarm Pro جاهز

## 🚀 الخطوات السريعة

### 1. إنشاء Repository على GitHub

```bash
# عبر GitHub CLI (الأسرع)
gh repo create aquafarm-pro --public --description "🐟 AquaFarm Pro - نظام إدارة المزارع السمكية الذكي"

# أو عبر الواجهة
# اذهب إلى https://github.com/new
# اسم Repository: aquafarm-pro
# وصف: 🐟 AquaFarm Pro - نظام إدارة المزارع السمكية الذكي
# عام: Public
# ✅ MIT License
```

### 2. إعداد Git في المشروع

#### للويندوز (PowerShell):
```powershell
# تشغيل الملف الجاهز
.\git-setup-commands.ps1
```

#### للماك/لينكس (Bash):
```bash
# تشغيل الملف الجاهز
chmod +x git-setup-commands.sh
./git-setup-commands.sh
```

#### يدوياً:
```bash
# تهيئة Git
git init

# إضافة remote
git remote add origin https://github.com/yourusername/aquafarm-pro.git

# إعداد المستخدم
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# إضافة الملفات
git add .

# إنشاء commit
git commit -m "feat: initial project setup with complete CI/CD pipeline"

# رفع المشروع
git push -u origin main
```

### 3. إعداد GitHub Actions Secrets

بعد رفع المشروع، اذهب إلى:
**Settings** → **Secrets and variables** → **Actions**

أضف الـ secrets التالية:

```bash
# للـ deployment (اختياري)
STAGING_HOST=your-staging-server.com
STAGING_USER=deploy-user
STAGING_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----...

PRODUCTION_HOST=your-production-server.com
PRODUCTION_USER=deploy-user
PRODUCTION_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----...

# للتحسينات (اختياري)
SONAR_TOKEN=your-sonarcloud-token
SLACK_WEBHOOK=https://hooks.slack.com/services/...
```

## 🔧 الاستخدام اليومي

### رفع التغييرات السريع:
```bash
# للويندوز
quick-git-update.bat

# أو يدوياً
git add .
git commit -m "your commit message"
git push
```

### إدارة Branches:
```bash
# إنشاء branch جديد
git checkout -b feature/new-feature

# رفع branch
git push -u origin feature/new-feature

# العودة للـ main
git checkout main
```

## 📊 مراقبة المشروع

بعد الرفع، يمكنك مراقبة:

- **Actions**: حالة CI/CD pipeline
- **Insights**: إحصائيات المشروع
- **Issues**: تتبع المشاكل والمهام
- **Pull Requests**: مراجعة الكود

## 🎯 الخطوات التالية

1. ✅ **اختبار CI/CD**: راقب GitHub Actions tab
2. ✅ **إعداد Secrets**: أضف الـ secrets المطلوبة
3. ✅ **Branch Protection**: حماية main branch
4. ✅ **Issues Templates**: إنشاء templates للمشاكل
5. ✅ **Documentation**: تحديث README.md

## 📖 الملفات المرجعية

- [GITHUB_SETUP_GUIDE.md](GITHUB_SETUP_GUIDE.md) - دليل مفصل
- [CONTRIBUTING.md](CONTRIBUTING.md) - دليل المساهمة
- [README.md](README.md) - وثائق المشروع الرئيسية
- [CI_CD_FINAL_FIXES_REPORT.md](CI_CD_FINAL_FIXES_REPORT.md) - تقرير CI/CD

## 🆘 استكشاف الأخطاء

### مشكلة: Permission denied
```bash
# حل: إعداد SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"
# أضف المفتاح العام إلى GitHub Settings → SSH Keys
```

### مشكلة: Repository not found
```bash
# تأكد من صحة URL
git remote -v
# تصحيح URL إذا لزم الأمر
git remote set-url origin https://github.com/yourusername/aquafarm-pro.git
```

### مشكلة: Large files
```bash
# استخدام Git LFS للملفات الكبيرة
git lfs install
git lfs track "*.psd"
git add .gitattributes
```

## 🎉 النتيجة النهائية

بعد اتباع هذه الخطوات:

- ✅ مشروعك على GitHub
- ✅ CI/CD pipeline يعمل
- ✅ Documentation شامل
- ✅ جاهز للمساهمة والتعاون

---

<div dir="rtl">

## 🌟 المميزات

- **رفع سريع**: أوامر جاهزة للاستخدام
- **CI/CD جاهز**: GitHub Actions مُعد مسبقاً
- **Documentation شامل**: جميع الملفات المطلوبة
- **أمان متقدم**: إعدادات أمان مُحسنة
- **دعم متعدد المنصات**: Windows, macOS, Linux

</div>

**🚀 استمتع بالتعاون على GitHub!**
