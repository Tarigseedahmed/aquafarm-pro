@echo off
chcp 65001 >nul
echo 🐟 AquaFarm Pro - Quick Git Update
echo ====================================

echo 📁 إضافة الملفات...
git add .

echo 💾 إنشاء commit...
set /p commit_message="أدخل رسالة الـ commit (أو اضغط Enter للرسالة الافتراضية): "
if "%commit_message%"=="" (
    git commit -m "update: project changes"
) else (
    git commit -m "%commit_message%"
)

echo 🚀 رفع التغييرات...
git push

echo ✅ تم بنجاح!
echo.
echo 📋 الحالة الحالية:
git status

pause
