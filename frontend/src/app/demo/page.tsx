'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Fish, 
  BarChart3, 
  Map, 
  FileText,
  Settings,
  Bell,
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Activity,
  Thermometer,
  Droplets
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SmartAlertBanner from '@/components/shared/SmartAlertBanner';
import WaterQualityWidget from '@/components/shared/WaterQualityWidget';
import SearchInput from '@/components/shared/SearchInput';
import DataTable from '@/components/shared/DataTable';

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for DataTable
  const tableData = [
    { id: 1, name: 'الحوض الرئيسي', status: 'صحي', fishCount: 2500, lastUpdate: '2024-01-15' },
    { id: 2, name: 'حوض التربية', status: 'تحذير', fishCount: 1800, lastUpdate: '2024-01-14' },
    { id: 3, name: 'حوض الحضانة', status: 'خطر', fishCount: 500, lastUpdate: '2024-01-13' },
  ];

  const tableColumns = [
    { key: 'name', title: 'اسم الحوض', sortable: true, filterable: true },
    { key: 'status', title: 'الحالة', sortable: true, filterable: true, render: (value: string) => (
      <Badge className={value === 'صحي' ? 'bg-green-100 text-green-800' : 
                        value === 'تحذير' ? 'bg-orange-100 text-orange-800' : 
                        'bg-red-100 text-red-800'}>
        {value}
      </Badge>
    )},
    { key: 'fishCount', title: 'عدد الأسماك', sortable: true },
    { key: 'lastUpdate', title: 'آخر تحديث', sortable: true },
  ];

  const kpiCards = [
    {
      title: 'إجمالي الأحواض',
      value: '12',
      change: '+2',
      changeType: 'positive',
      icon: Fish,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'إجمالي الأسماك',
      value: '45,230',
      change: '+1,250',
      changeType: 'positive',
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'معدل البقاء',
      value: '94.2%',
      change: '+2.1%',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'استهلاك العلف',
      value: '1,250',
      change: '-50',
      changeType: 'negative',
      icon: TrendingDown,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                معرض المكونات
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                عرض جميع المكونات والواجهات المتاحة في AquaFarm Pro
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3 rtl:space-x-reverse">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                تصدير
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                إضافة جديد
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="components">المكونات</TabsTrigger>
            <TabsTrigger value="charts">الرسوم البيانية</TabsTrigger>
            <TabsTrigger value="tables">الجداول</TabsTrigger>
            <TabsTrigger value="forms">النماذج</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* KPI Cards */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                بطاقات المؤشرات الرئيسية
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpiCards.map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <motion.div
                      key={card.title}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ y: -5 }}
                      className="group"
                    >
                      <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {card.title}
                          </CardTitle>
                          <div className={`p-2 rounded-lg ${card.bgColor}`}>
                            <Icon className={`h-4 w-4 ${card.color}`} />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {card.value}
                          </div>
                          <div className="flex items-center mt-2">
                            {card.changeType === 'positive' ? (
                              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                            )}
                            <span className={`text-sm ${
                              card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {card.change}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">
                              من الشهر الماضي
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Water Quality Widget */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                عنصر جودة الماء
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <WaterQualityWidget showTrends={true} />
                <WaterQualityWidget compact={true} />
              </div>
            </motion.div>

            {/* Search Input */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                عنصر البحث
              </h2>
              <div className="max-w-md">
                <SearchInput 
                  placeholder="البحث في المزرعة..."
                  showFilters={true}
                />
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="components" className="space-y-8">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                المكونات الأساسية
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Buttons */}
                <Card>
                  <CardHeader>
                    <CardTitle>الأزرار</CardTitle>
                    <CardDescription>أنواع مختلفة من الأزرار</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Button>أساسي</Button>
                      <Button variant="secondary">ثانوي</Button>
                      <Button variant="outline">محدود</Button>
                      <Button variant="ghost">شبح</Button>
                      <Button variant="destructive">تدمير</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm">صغير</Button>
                      <Button size="default">عادي</Button>
                      <Button size="lg">كبير</Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Badges */}
                <Card>
                  <CardHeader>
                    <CardTitle>الشارات</CardTitle>
                    <CardDescription>أنواع مختلفة من الشارات</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge>افتراضي</Badge>
                      <Badge variant="secondary">ثانوي</Badge>
                      <Badge variant="outline">محدود</Badge>
                      <Badge variant="destructive">تدمير</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-green-100 text-green-800">صحي</Badge>
                      <Badge className="bg-orange-100 text-orange-800">تحذير</Badge>
                      <Badge className="bg-red-100 text-red-800">خطر</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle>شريط التقدم</CardTitle>
                    <CardDescription>أشرطة التقدم المختلفة</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>التقدم الأساسي</span>
                        <span>75%</span>
                      </div>
                      <Progress value={75} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>التقدم المتقدم</span>
                        <span>90%</span>
                      </div>
                      <Progress value={90} className="h-3" />
                    </div>
                  </CardContent>
                </Card>

                {/* Inputs */}
                <Card>
                  <CardHeader>
                    <CardTitle>حقول الإدخال</CardTitle>
                    <CardDescription>أنواع مختلفة من حقول الإدخال</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input placeholder="حقل إدخال عادي" />
                    <Input placeholder="حقل إدخال مع خطأ" className="border-red-500" />
                    <Input placeholder="حقل إدخال معقود" disabled />
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="charts" className="space-y-8">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                الرسوم البيانية
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>مخطط دائري</CardTitle>
                    <CardDescription>توزيع أنواع الأسماك</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">مخطط دائري</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>مخطط خطي</CardTitle>
                    <CardDescription>تطور درجة الحرارة</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-center">
                        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">مخطط خطي</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="tables" className="space-y-8">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                الجداول التفاعلية
              </h2>
              <DataTable
                data={tableData}
                columns={tableColumns}
                searchable={true}
                sortable={true}
                filterable={true}
                pagination={true}
                pageSize={10}
                onExport={() => console.log('Exporting data...')}
              />
            </motion.div>
          </TabsContent>

          <TabsContent value="forms" className="space-y-8">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                النماذج
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>نموذج إضافة حوض</CardTitle>
                    <CardDescription>نموذج لإضافة حوض جديد</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        اسم الحوض
                      </label>
                      <Input placeholder="أدخل اسم الحوض" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        نوع الأسماك
                      </label>
                      <Input placeholder="أدخل نوع الأسماك" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        السعة
                      </label>
                      <Input placeholder="أدخل السعة" type="number" />
                    </div>
                    <Button className="w-full">إضافة الحوض</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>نموذج إعدادات</CardTitle>
                    <CardDescription>نموذج لتعديل الإعدادات</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        اسم المزرعة
                      </label>
                      <Input placeholder="أدخل اسم المزرعة" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        البريد الإلكتروني
                      </label>
                      <Input placeholder="أدخل البريد الإلكتروني" type="email" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        رقم الهاتف
                      </label>
                      <Input placeholder="أدخل رقم الهاتف" type="tel" />
                    </div>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <Button className="flex-1">حفظ</Button>
                      <Button variant="outline" className="flex-1">إلغاء</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
