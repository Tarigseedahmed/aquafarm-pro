#!/bin/bash

# 🚀 AquaFarm Pro - Git Setup Commands
# هذا الملف يحتوي على جميع الأوامر المطلوبة لإعداد ورفع المشروع على GitHub

echo "🐟 AquaFarm Pro - Git Setup Script"
echo "=================================="

# التحقق من وجود Git
if ! command -v git &> /dev/null; then
    echo "❌ Git غير مثبت. يرجى تثبيت Git أولاً."
    exit 1
fi

# التحقق من وجود المجلد
if [ ! -d ".git" ]; then
    echo "📁 تهيئة Git repository..."
    git init
else
    echo "✅ Git repository موجود بالفعل"
fi

# إضافة remote origin (استبدل yourusername بالاسم الحقيقي)
echo "🔗 إضافة remote origin..."
echo "يرجى استبدال 'yourusername' باسم المستخدم الحقيقي على GitHub"

# إزالة origin إذا كان موجود
git remote remove origin 2>/dev/null

# إضافة origin جديد
git remote add origin https://github.com/yourusername/aquafarm-pro.git

echo "📋 إعداد Git user (إذا لم يكن مُعد)..."
echo "يرجى إدخال معلوماتك:"
read -p "اسمك الكامل: " USER_NAME
read -p "بريدك الإلكتروني: " USER_EMAIL

git config --global user.name "$USER_NAME"
git config --global user.email "$USER_EMAIL"

echo "✅ تم إعداد Git user: $USER_NAME <$USER_EMAIL>"

# إضافة جميع الملفات
echo "📁 إضافة الملفات إلى Git..."
git add .

# إنشاء commit أولي
echo "💾 إنشاء commit أولي..."
git commit -m "feat: initial project setup with complete CI/CD pipeline

- Add comprehensive backend API (NestJS)
- Add React frontend application  
- Add React Native mobile app
- Add Docker containerization
- Add GitHub Actions CI/CD pipeline
- Add comprehensive documentation
- Add testing suites (unit, integration, e2e)
- Add security configurations
- Add multi-language support (Arabic/English)
- Add database migrations and schemas
- Add project structure and configuration files"

echo "🚀 رفع المشروع إلى GitHub..."
echo "تحذير: تأكد من إنشاء repository على GitHub أولاً!"

# رفع إلى GitHub
git push -u origin main

echo ""
echo "🎉 تم رفع المشروع بنجاح!"
echo ""
echo "📋 الخطوات التالية:"
echo "1. اذهب إلى repository على GitHub"
echo "2. إعداد GitHub Actions secrets (راجع GITHUB_SETUP_GUIDE.md)"
echo "3. اختبار CI/CD pipeline"
echo "4. إعداد branch protection rules"
echo ""
echo "📖 للمزيد من التفاصيل، راجع: GITHUB_SETUP_GUIDE.md"
