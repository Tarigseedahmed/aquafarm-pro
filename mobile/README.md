# AquaFarm Mobile (Expo)

تطبيق موبايل للتشغيل دون اتصال ومزامنة لاحقة (Offline-first) لمدخلات مثل قراءات جودة المياه.

## المتطلبات
- Node.js 18+
- pnpm أو npm
- Expo CLI (اختياري): npm i -g expo

## البدء (محليًا)
1. تثبيت الاعتمادات:
   - pnpm: pnpm install
   - npm: npm install
2. التشغيل:
   - pnpm start أو npm run start
3. افتح التطبيق عبر Expo Go أو محاكي iOS/Android.

## البيئة
أنشئ ملف .env على نمط .env.example يتضمن:

API_BASE_URL=https://api.aquafarm.local
TENANT_ID=

## المزايا المخطط تنفيذها
- إدخال قراءات جودة المياه أوفلاين
- تخزين محلي (AsyncStorage/SQLite) لطابور المزامنة
- خدمة مزامنة في الخلفية لرفع الطابور عند توفر الاتصال
- مصادقة باستخدام توكن JWT

## بنية المجلدات
- src/hooks/useSyncQueue.ts — خطاف إدارة طابور المزامنة
- src/storage/ — تهيئة التخزين المحلي
- App.tsx — نقطة دخول التطبيق
