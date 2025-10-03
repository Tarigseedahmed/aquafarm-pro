# 🚀 AquaFarm Pro - Git Setup Commands (PowerShell)
# هذا الملف يحتوي على جميع الأوامر المطلوبة لإعداد ورفع المشروع على GitHub

Write-Host "🐟 AquaFarm Pro - Git Setup Script" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# التحقق من وجود Git
try {
    $gitVersion = git --version
    Write-Host "✅ Git موجود: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git غير مثبت. يرجى تثبيت Git أولاً." -ForegroundColor Red
    Write-Host "يمكنك تحميله من: https://git-scm.com/downloads" -ForegroundColor Yellow
    exit 1
}

# التحقق من وجود المجلد
if (-not (Test-Path ".git")) {
    Write-Host "📁 تهيئة Git repository..." -ForegroundColor Yellow
    git init
} else {
    Write-Host "✅ Git repository موجود بالفعل" -ForegroundColor Green
}

# إضافة remote origin
Write-Host "🔗 إعداد remote origin..." -ForegroundColor Yellow
Write-Host "يرجى استبدال 'yourusername' باسم المستخدم الحقيقي على GitHub" -ForegroundColor Magenta

# إزالة origin إذا كان موجود
try {
    git remote remove origin 2>$null
} catch {
    # Origin غير موجود، لا مشكلة
}

# إضافة origin جديد
git remote add origin https://github.com/yourusername/aquafarm-pro.git

Write-Host "📋 إعداد Git user..." -ForegroundColor Yellow
$userName = Read-Host "اسمك الكامل"
$userEmail = Read-Host "بريدك الإلكتروني"

git config --global user.name $userName
git config --global user.email $userEmail

Write-Host "✅ تم إعداد Git user: $userName <$userEmail>" -ForegroundColor Green

# إضافة جميع الملفات
Write-Host "📁 إضافة الملفات إلى Git..." -ForegroundColor Yellow
git add .

# إنشاء commit أولي
Write-Host "💾 إنشاء commit أولي..." -ForegroundColor Yellow
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

Write-Host "🚀 رفع المشروع إلى GitHub..." -ForegroundColor Yellow
Write-Host "تحذير: تأكد من إنشاء repository على GitHub أولاً!" -ForegroundColor Red

# رفع إلى GitHub
git push -u origin main

Write-Host ""
Write-Host "🎉 تم رفع المشروع بنجاح!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 الخطوات التالية:" -ForegroundColor Cyan
Write-Host "1. اذهب إلى repository على GitHub" -ForegroundColor White
Write-Host "2. إعداد GitHub Actions secrets (راجع GITHUB_SETUP_GUIDE.md)" -ForegroundColor White
Write-Host "3. اختبار CI/CD pipeline" -ForegroundColor White
Write-Host "4. إعداد branch protection rules" -ForegroundColor White
Write-Host ""
Write-Host "📖 للمزيد من التفاصيل، راجع: GITHUB_SETUP_GUIDE.md" -ForegroundColor Yellow

# إنشاء ملف batch للاستخدام السريع
$batchContent = @"
@echo off
echo 🐟 AquaFarm Pro - Quick Git Commands
echo ====================================

echo 📁 إضافة الملفات...
git add .

echo 💾 إنشاء commit...
git commit -m "update: project changes"

echo 🚀 رفع التغييرات...
git push

echo ✅ تم بنجاح!
pause
"@

$batchContent | Out-File -FilePath "quick-git-update.bat" -Encoding UTF8

Write-Host ""
Write-Host "🔧 تم إنشاء ملف quick-git-update.bat للاستخدام السريع" -ForegroundColor Green
