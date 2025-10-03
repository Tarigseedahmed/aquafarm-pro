# AquaFarm Pro - دليل المكونات والواجهات

## نظرة عامة

AquaFarm Pro هو نظام إدارة مزارع الأسماك المتقدم الذي يوفر واجهة مستخدم حديثة ومتجاوبة مع دعم كامل للغة العربية والإنجليزية. تم تطوير النظام باستخدام أحدث التقنيات:

- **React 19** مع TypeScript
- **Tailwind CSS** للتصميم
- **shadcn/ui** للمكونات الأساسية
- **Framer Motion** للرسوم المتحركة
- **Recharts** للرسوم البيانية
- **Radix UI** للوصولية

## المكونات الأساسية

### 1. التخطيط الرئيسي (Layout)

#### Header Component
- شريط علوي متجاوب مع دعم RTL/LTR
- شريط بحث ذكي مع اقتراحات
- تبديل الوضع المظلم/الفاتح
- قائمة المستخدم مع إعدادات
- إشعارات تفاعلية

#### Sidebar Component
- شريط جانبي قابل للطي
- قائمة تنقل مع أيقونات
- إجراءات سريعة
- مؤشرات الحالة
- دعم RTL كامل

#### Footer Component
- معلومات الإصدار
- حالة النظام
- حقوق النشر

### 2. الصفحات الرئيسية

#### Dashboard Page
- بطاقات المؤشرات الرئيسية (KPI)
- رسوم بيانية تفاعلية
- تنبيهات ذكية
- إحصائيات فورية

#### Ponds Page
- عرض شبكي للأحواض
- بطاقات تفاعلية للأحواض
- فلترة وبحث متقدم
- تفاصيل شاملة لكل حوض

#### Farm Map Page
- خريطة تفاعلية للمزرعة
- شبكة أحواض قابلة للنقر
- عرض تفاصيل الحوض
- إضافة أحواض جديدة

#### Analytics Page
- رسوم بيانية متقدمة
- تحليل الإنتاج
- مؤشرات الأداء
- تقارير مفصلة

### 3. المكونات المشتركة

#### SmartAlertBanner
```tsx
<SmartAlertBanner
  alerts={alerts}
  maxAlerts={5}
  autoHide={false}
  onAlertClick={handleAlertClick}
  onAlertDismiss={handleAlertDismiss}
/>
```

**الميزات:**
- تنبيهات ذكية مع أولوية
- تصنيف حسب النوع (نجاح، تحذير، خطأ، معلومات)
- إغلاق تفاعلي
- رسوم متحركة سلسة

#### WaterQualityWidget
```tsx
<WaterQualityWidget
  data={waterQualityData}
  showTrends={true}
  compact={false}
  onParameterClick={handleParameterClick}
/>
```

**الميزات:**
- مراقبة جودة الماء في الوقت الفعلي
- مؤشرات ملونة للحالة
- وضع مضغوط ووضع مفصل
- تفاعل مع المعاملات

#### SearchInput
```tsx
<SearchInput
  placeholder="البحث في المزرعة..."
  suggestions={suggestions}
  showFilters={true}
  onSearch={handleSearch}
  onSuggestionClick={handleSuggestionClick}
/>
```

**الميزات:**
- بحث ذكي مع اقتراحات
- فلترة متقدمة
- تصنيف النتائج
- واجهة تفاعلية

#### DataTable
```tsx
<DataTable
  data={tableData}
  columns={columns}
  searchable={true}
  sortable={true}
  filterable={true}
  pagination={true}
  onRowClick={handleRowClick}
  onExport={handleExport}
/>
```

**الميزات:**
- جدول تفاعلي متقدم
- بحث وفلترة
- ترتيب الأعمدة
- تصدير البيانات
- ترقيم الصفحات

### 4. مكونات shadcn/ui

تم تخصيص جميع مكونات shadcn/ui لدعم RTL واللغة العربية:

#### Button
```tsx
<Button variant="default" size="lg">
  زر أساسي
</Button>
```

#### Card
```tsx
<Card>
  <CardHeader>
    <CardTitle>عنوان البطاقة</CardTitle>
    <CardDescription>وصف البطاقة</CardDescription>
  </CardHeader>
  <CardContent>
    محتوى البطاقة
  </CardContent>
</Card>
```

#### Dialog
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>فتح الحوار</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>عنوان الحوار</DialogTitle>
      <DialogDescription>وصف الحوار</DialogDescription>
    </DialogHeader>
    محتوى الحوار
  </DialogContent>
</Dialog>
```

#### Tabs
```tsx
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">التبويب الأول</TabsTrigger>
    <TabsTrigger value="tab2">التبويب الثاني</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">محتوى التبويب الأول</TabsContent>
  <TabsContent value="tab2">محتوى التبويب الثاني</TabsContent>
</Tabs>
```

### 5. الرسوم المتحركة

تم استخدام Framer Motion لإنشاء رسوم متحركة سلسة:

#### الانتقالات الأساسية
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  محتوى متحرك
</motion.div>
```

#### الرسوم المتحركة التفاعلية
```tsx
<motion.div
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", stiffness: 300 }}
>
  عنصر تفاعلي
</motion.div>
```

#### الانتقالات المتسلسلة
```tsx
<AnimatePresence>
  {items.map((item, index) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.1 }}
    >
      {item.content}
    </motion.div>
  ))}
</AnimatePresence>
```

### 6. الرسوم البيانية

تم استخدام Recharts لإنشاء رسوم بيانية تفاعلية:

#### Line Chart
```tsx
<LineChart data={data}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Line type="monotone" dataKey="value" stroke="#0ea5e9" />
</LineChart>
```

#### Pie Chart
```tsx
<PieChart>
  <Pie
    data={data}
    cx="50%"
    cy="50%"
    innerRadius={60}
    outerRadius={100}
    dataKey="value"
  >
    {data.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={entry.color} />
    ))}
  </Pie>
  <Tooltip />
</PieChart>
```

### 7. دعم RTL/LTR

تم تطبيق دعم كامل للغة العربية والإنجليزية:

#### CSS Classes
```css
/* RTL Support */
.rtl\:space-x-reverse > :not([hidden]) ~ :not([hidden]) {
  --tw-space-x-reverse: 1;
}

.rtl\:ml-0 {
  margin-left: 0;
}

.rtl\:mr-3 {
  margin-right: 0.75rem;
}
```

#### JavaScript Logic
```tsx
const isRTL = locale === 'ar';
const direction = isRTL ? 'rtl' : 'ltr';

<div dir={direction} className={isRTL ? 'rtl:space-x-reverse' : ''}>
  محتوى متجاوب
</div>
```

### 8. الوضع المظلم

دعم كامل للوضع المظلم:

#### Tailwind Classes
```tsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  محتوى متجاوب مع الوضع المظلم
</div>
```

#### JavaScript Toggle
```tsx
const [isDarkMode, setIsDarkMode] = useState(false);

const toggleDarkMode = () => {
  setIsDarkMode(!isDarkMode);
  document.documentElement.classList.toggle('dark');
};
```

### 9. الاستجابة (Responsive Design)

تصميم متجاوب لجميع أحجام الشاشات:

#### Breakpoints
- `sm`: 640px+
- `md`: 768px+
- `lg`: 1024px+
- `xl`: 1280px+
- `2xl`: 1536px+

#### Grid System
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  محتوى شبكي متجاوب
</div>
```

### 10. إدارة الحالة

تم استخدام React hooks لإدارة الحالة:

#### useState
```tsx
const [isLoading, setIsLoading] = useState(false);
const [data, setData] = useState([]);
```

#### useEffect
```tsx
useEffect(() => {
  fetchData();
}, [dependency]);
```

### 11. الأداء والتحسين

#### Lazy Loading
```tsx
const LazyComponent = lazy(() => import('./Component'));
```

#### Memoization
```tsx
const MemoizedComponent = memo(Component);
```

#### Virtual Scrolling
```tsx
// للقوائم الطويلة
const VirtualizedList = ({ items }) => {
  // تنفيذ القائمة الافتراضية
};
```

### 12. إمكانية الوصول

تم تطبيق معايير إمكانية الوصول:

#### ARIA Labels
```tsx
<button aria-label="إغلاق النافذة">
  <X className="h-4 w-4" />
</button>
```

#### Keyboard Navigation
```tsx
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    handleClick();
  }
};
```

#### Focus Management
```tsx
const focusElement = useRef<HTMLInputElement>(null);

useEffect(() => {
  focusElement.current?.focus();
}, []);
```

## الاستخدام

### تثبيت التبعيات
```bash
npm install framer-motion recharts @radix-ui/react-dialog @radix-ui/react-dropdown-menu
```

### تشغيل المشروع
```bash
npm run dev
```

### البناء للإنتاج
```bash
npm run build
```

## التخصيص

### الألوان
```tsx
// tailwind.config.ts
colors: {
  primary: {
    50: '#f0f9ff',
    500: '#0ea5e9',
    900: '#0c4a6e',
  },
  aqua: {
    50: '#f0fdfa',
    500: '#14b8a6',
    900: '#134e4a',
  }
}
```

### الخطوط
```tsx
// layout.tsx
const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cairo',
});
```

## الدعم والمساهمة

للمساهمة في المشروع أو الإبلاغ عن مشاكل، يرجى مراجعة:
- [دليل المساهمة](CONTRIBUTING.md)
- [كود السلوك](CODE_OF_CONDUCT.md)
- [الأمان](SECURITY.md)

## الترخيص

هذا المشروع مرخص تحت رخصة MIT. راجع ملف [LICENSE](LICENSE) للتفاصيل.
