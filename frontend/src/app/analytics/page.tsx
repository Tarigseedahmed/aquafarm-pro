'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  Scatter,
  ScatterChart,
  ComposedChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Fish, 
  Droplets, 
  Thermometer, 
  Activity,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock data
const productionData = [
  { month: 'يناير', production: 1200, target: 1000, efficiency: 85 },
  { month: 'فبراير', production: 1350, target: 1100, efficiency: 88 },
  { month: 'مارس', production: 1500, target: 1200, efficiency: 92 },
  { month: 'أبريل', production: 1650, target: 1300, efficiency: 95 },
  { month: 'مايو', production: 1800, target: 1400, efficiency: 98 },
  { month: 'يونيو', production: 1950, target: 1500, efficiency: 100 },
];

const waterQualityData = [
  { date: '2024-01-01', ph: 7.2, oxygen: 8.5, temperature: 24.5, ammonia: 0.3 },
  { date: '2024-01-02', ph: 7.1, oxygen: 8.2, temperature: 24.8, ammonia: 0.4 },
  { date: '2024-01-03', ph: 7.3, oxygen: 8.8, temperature: 25.1, ammonia: 0.2 },
  { date: '2024-01-04', ph: 7.0, oxygen: 7.9, temperature: 24.2, ammonia: 0.5 },
  { date: '2024-01-05', ph: 7.4, oxygen: 8.6, temperature: 25.3, ammonia: 0.3 },
  { date: '2024-01-06', ph: 7.2, oxygen: 8.3, temperature: 24.9, ammonia: 0.4 },
];

const fishGrowthData = [
  { week: 1, weight: 0.1, length: 2.5 },
  { week: 2, weight: 0.2, length: 3.2 },
  { week: 3, weight: 0.4, length: 4.1 },
  { week: 4, weight: 0.7, length: 5.0 },
  { week: 5, weight: 1.1, length: 6.2 },
  { week: 6, weight: 1.6, length: 7.5 },
  { week: 7, weight: 2.2, length: 8.8 },
  { week: 8, weight: 2.9, length: 10.1 },
];

const costAnalysisData = [
  { category: 'العلف', amount: 45000, percentage: 45 },
  { category: 'الأدوية', amount: 15000, percentage: 15 },
  { category: 'الكهرباء', amount: 20000, percentage: 20 },
  { category: 'العمالة', amount: 15000, percentage: 15 },
  { category: 'الصيانة', amount: 5000, percentage: 5 },
];

const speciesDistribution = [
  { name: 'البلطي', value: 45, color: '#0ea5e9' },
  { name: 'السلمون', value: 25, color: '#14b8a6' },
  { name: 'القرموط', value: 20, color: '#f59e0b' },
  { name: 'التراوت', value: 10, color: '#ef4444' },
];

const ChartCard = ({ title, description, children, className = "" }: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

export default function AnalyticsPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('6m');
  const [selectedPond, setSelectedPond] = useState('all');
  const [chartType, setChartType] = useState('line');
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '1m': return 'آخر شهر';
      case '3m': return 'آخر 3 أشهر';
      case '6m': return 'آخر 6 أشهر';
      case '1y': return 'آخر سنة';
      default: return 'آخر 6 أشهر';
    }
  };

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
                التحليلات والإحصائيات
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                تحليل شامل لأداء المزرعة ومؤشرات الإنتاج
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3 rtl:space-x-reverse">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                تصدير
              </Button>
              <Button size="sm">
                <Filter className="h-4 w-4 mr-2" />
                فلترة
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                الفترة الزمنية
              </label>
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">آخر شهر</SelectItem>
                  <SelectItem value="3m">آخر 3 أشهر</SelectItem>
                  <SelectItem value="6m">آخر 6 أشهر</SelectItem>
                  <SelectItem value="1y">آخر سنة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                الحوض
              </label>
              <Select value={selectedPond} onValueChange={setSelectedPond}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأحواض</SelectItem>
                  <SelectItem value="1">الحوض الرئيسي</SelectItem>
                  <SelectItem value="2">حوض التربية</SelectItem>
                  <SelectItem value="3">حوض الحضانة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                نوع الرسم البياني
              </label>
              <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg">
                <Button
                  variant={chartType === 'line' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setChartType('line')}
                  className="rounded-r-none"
                >
                  <LineChartIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={chartType === 'bar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setChartType('bar')}
                  className="rounded-l-none"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                إجمالي الإنتاج
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">12,450</div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+12.5%</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">من الشهر الماضي</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                معدل النمو
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">2.3%</div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+0.3%</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">من الأسبوع الماضي</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                كفاءة التغذية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">1.8</div>
              <div className="flex items-center mt-2">
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-sm text-red-600">-0.1</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">من الشهر الماضي</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                معدل البقاء
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">94.2%</div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+1.2%</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">من الشهر الماضي</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts */}
        <div className="space-y-8">
          {/* Production Chart */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <ChartCard
              title="إنتاج المزرعة"
              description="مقارنة الإنتاج الفعلي مع الأهداف المحددة"
            >
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={productionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="production" fill="#0ea5e9" name="الإنتاج الفعلي" />
                  <Line type="monotone" dataKey="target" stroke="#ef4444" strokeWidth={2} name="الهدف" />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>
          </motion.div>

          {/* Water Quality Chart */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <ChartCard
              title="جودة الماء"
              description="مراقبة مؤشرات جودة الماء على مدار الوقت"
            >
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={waterQualityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="ph" stroke="#0ea5e9" strokeWidth={2} name="الأس الهيدروجيني" />
                  <Line type="monotone" dataKey="oxygen" stroke="#14b8a6" strokeWidth={2} name="الأكسجين" />
                  <Line type="monotone" dataKey="temperature" stroke="#f59e0b" strokeWidth={2} name="درجة الحرارة" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </motion.div>

          {/* Fish Growth Chart */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <ChartCard
              title="نمو الأسماك"
              description="تتبع نمو الأسماك من حيث الوزن والطول"
            >
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={fishGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" name="الأسبوع" />
                  <YAxis dataKey="weight" name="الوزن (كغ)" />
                  <Tooltip />
                  <Scatter dataKey="weight" fill="#0ea5e9" />
                </ScatterChart>
              </ResponsiveContainer>
            </ChartCard>
          </motion.div>

          {/* Cost Analysis and Species Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <ChartCard
                title="تحليل التكاليف"
                description="توزيع التكاليف حسب الفئة"
              >
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={costAnalysisData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="amount"
                    >
                      {costAnalysisData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 72}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {costAnalysisData.map((item, index) => (
                    <div key={index} className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: `hsl(${index * 72}, 70%, 50%)` }}
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.category}: {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <ChartCard
                title="توزيع أنواع الأسماك"
                description="نسبة كل نوع من الأسماك في المزرعة"
              >
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={speciesDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {speciesDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {speciesDistribution.map((item, index) => (
                    <div key={index} className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.name}: {item.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
