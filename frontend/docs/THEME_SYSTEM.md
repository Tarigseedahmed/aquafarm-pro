# نظام الثيمات في AquaFarm Pro

## نظرة عامة

نظام الثيمات في AquaFarm Pro يوفر تجربة مستخدم قابلة للتخصيص مع دعم كامل للوضع الفاتح والداكن وثيمات ألوان متعددة.

## المكونات الأساسية

### 1. ThemeProvider
```typescript
// src/components/providers/ThemeProvider.tsx
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem
      disableTransitionOnChange={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
```

### 2. ThemeToggle
```typescript
// src/components/ui/theme-toggle.tsx
export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  // يدعم: light, dark, system
}
```

### 3. ThemeSettings
```typescript
// src/components/ui/theme-settings.tsx
export default function ThemeSettings({ isOpen, onClose }: ThemeSettingsProps) {
  // واجهة مستخدم متقدمة لاختيار الثيمات
}
```

## متغيرات الألوان

### الثيمات المتاحة

#### 1. Aqua Green (الافتراضي)
```css
:root[data-theme="aqua"] {
  --primary: 14 184 166; /* aqua-500 */
  --primary-foreground: 255 255 255;
  --secondary: 240 253 250; /* aqua-50 */
  --accent: 45 212 191; /* aqua-400 */
  /* ... المزيد من المتغيرات */
}
```

#### 2. Ocean Blue
```css
:root[data-theme="ocean"] {
  --primary: 14 165 233; /* blue-500 */
  --primary-foreground: 255 255 255;
  --secondary: 240 249 255; /* blue-50 */
  --accent: 59 130 246; /* blue-500 */
  /* ... المزيد من المتغيرات */
}
```

#### 3. Forest Green
```css
:root[data-theme="forest"] {
  --primary: 34 197 94; /* green-500 */
  --primary-foreground: 255 255 255;
  --secondary: 240 253 244; /* green-50 */
  --accent: 74 222 128; /* green-400 */
  /* ... المزيد من المتغيرات */
}
```

### متغيرات الوضع الداكن

```css
.dark[data-theme="aqua"] {
  --background: 15 23 42; /* slate-900 */
  --foreground: 240 253 250; /* aqua-50 */
  --card: 30 41 59; /* slate-800 */
  /* ... المزيد من المتغيرات */
}
```

## الاستخدام

### 1. تطبيق الثيمات في المكونات

```typescript
// استخدام متغيرات CSS
<div className="bg-background text-foreground">
  <h1 className="text-primary">عنوان</h1>
  <p className="text-muted-foreground">نص</p>
</div>

// استخدام ألوان مخصصة
<div className="bg-primary text-primary-foreground">
  زر أساسي
</div>
```

### 2. التبديل بين الثيمات

```typescript
import { useTheme } from 'next-themes';

function MyComponent() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme('dark')}>
      تفعيل الوضع الداكن
    </button>
  );
}
```

### 3. تطبيق ثيمات الألوان

```typescript
// تطبيق ثيم Aqua Green
document.documentElement.setAttribute('data-theme', 'aqua');

// تطبيق ثيم Ocean Blue
document.documentElement.setAttribute('data-theme', 'ocean');

// تطبيق ثيم Forest Green
document.documentElement.setAttribute('data-theme', 'forest');
```

## أفضل الممارسات

### 1. استخدام متغيرات CSS
```css
/* ✅ صحيح */
.my-component {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}

/* ❌ خطأ */
.my-component {
  background-color: #ffffff;
  color: #000000;
}
```

### 2. دعم الوضع الداكن
```css
/* ✅ صحيح */
.my-component {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}

/* ❌ خطأ */
.my-component {
  background-color: white;
  color: black;
}
```

### 3. انتقالات سلسة
```css
/* ✅ صحيح */
* {
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

## اختبار الثيمات

### 1. اختبار التبديل
```typescript
// اختبار تبديل سريع
const switchTime = performance.now();
setTheme('dark');
// قياس الوقت المستغرق
```

### 2. اختبار FOUC
```typescript
// اكتشاف وميض FOUC
const foucDetected = switchDuration > 100; // أكثر من 100ms
```

### 3. اختبار الاستجابة
```typescript
// اختبار على أحجام شاشات مختلفة
const testDevices = [
  { width: 375, height: 667 }, // Mobile
  { width: 768, height: 1024 }, // Tablet
  { width: 1920, height: 1080 } // Desktop
];
```

## استكشاف الأخطاء

### 1. مشكلة FOUC
```typescript
// الحل: إضافة suppressHydrationWarning
<html suppressHydrationWarning>
  <body>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </body>
</html>
```

### 2. مشكلة التحميل البطيء
```typescript
// الحل: تحسين الانتقالات
.dark {
  transition: none; // إزالة الانتقالات عند التحميل
}
```

### 3. مشكلة الحفظ
```typescript
// الحل: التحقق من localStorage
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  setTheme(savedTheme);
}
```

## الأدوات المساعدة

### 1. ResponsiveTestTool
```typescript
// اختبار الاستجابة على أجهزة مختلفة
<ResponsiveTestTool />
```

### 2. ThemeTestTool
```typescript
// اختبار الثيمات وعدم وجود FOUC
<ThemeTestTool />
```

## التطوير المستقبلي

### 1. ثيمات إضافية
- يمكن إضافة ثيمات جديدة بسهولة
- دعم الألوان المخصصة
- ثيمات موسمية

### 2. تحسينات الأداء
- تحميل أسرع للثيمات
- انتقالات محسنة
- دعم أفضل للهواتف

### 3. ميزات متقدمة
- ثيمات متدرجة
- تأثيرات بصرية
- دعم الوضع الليلي التلقائي

## الدعم

للحصول على المساعدة في نظام الثيمات:
1. راجع هذا التوثيق
2. استخدم أدوات الاختبار المدمجة
3. تحقق من console للأخطاء
4. تأكد من تحديث المتصفح
