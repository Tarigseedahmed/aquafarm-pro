'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Fish, 
  Droplets, 
  Thermometer, 
  AlertTriangle,
  Activity,
  Users,
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// Mock data
const temperatureData = [
  { time: '00:00', temp: 22.5 },
  { time: '04:00', temp: 21.8 },
  { time: '08:00', temp: 23.2 },
  { time: '12:00', temp: 25.1 },
  { time: '16:00', temp: 26.3 },
  { time: '20:00', temp: 24.7 },
];

const fishSpeciesData = [
  { name: 'البلطي', value: 45, color: '#0ea5e9' },
  { name: 'السلمون', value: 25, color: '#14b8a6' },
  { name: 'القرموط', value: 20, color: '#f59e0b' },
  { name: 'التراوت', value: 10, color: '#ef4444' },
];

const waterQualityData = [
  { parameter: 'pH', value: 7.2, optimal: '7.0-7.5', status: 'good' },
  { parameter: 'الأكسجين', value: 8.5, optimal: '6.0-8.0', status: 'warning' },
  { parameter: 'الأمونيا', value: 0.3, optimal: '<0.5', status: 'good' },
  { parameter: 'النترات', value: 15, optimal: '<20', status: 'good' },
];

const recentAlerts = [
  { id: 1, type: 'warning', message: 'انخفاض مستوى الأكسجين في الحوض 3', time: 'منذ 5 دقائق' },
  { id: 2, type: 'info', message: 'تم تسجيل قراءة جودة مياه جديدة', time: 'منذ 15 دقيقة' },
  { id: 3, type: 'success', message: 'تم إكمال عملية التغذية بنجاح', time: 'منذ 30 دقيقة' },
];

export default function EnhancedDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

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
      icon: Users,
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
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="status-icon text-orange-500" />;
      case 'info': return <Activity className="status-icon text-blue-500" />;
      case 'success': return <TrendingUp className="status-icon text-green-500" />;
      default: return <Activity className="status-icon text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-orange-600 bg-orange-50';
      case 'danger': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-aqua-200 border-t-aqua-600 rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل البيانات...</p>
        </motion.div>
      </div>
    );
  }

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
                لوحة التحكم
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                نظرة عامة على مزارعك ومراقبة الأداء
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3 rtl:space-x-reverse">
              <Button variant="outline" size="sm">
                تصدير التقرير
              </Button>
              <Button size="sm">
                إضافة حوض جديد
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
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
                <Card className="relative overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {card.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${card.bgColor}`}>
                      <Icon className={`kpi-icon ${card.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {card.value}
                    </div>
                    <div className="flex items-center mt-2">
                      {card.changeType === 'positive' ? (
                        <ArrowUpRight className="icon-sm text-green-500 mr-1" />
                      ) : (
                        <ArrowDownRight className="icon-sm text-red-500 mr-1" />
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
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Temperature Chart */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Thermometer className="card-icon text-blue-600 mr-2" />
                  درجة حرارة الماء
                </CardTitle>
                <CardDescription>
                  مراقبة درجة الحرارة على مدار 24 ساعة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={temperatureData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="temp" 
                      stroke="#0ea5e9" 
                      strokeWidth={3}
                      dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Fish Species Distribution */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Fish className="card-icon text-green-600 mr-2" />
                  توزيع أنواع الأسماك
                </CardTitle>
                <CardDescription>
                  نسبة كل نوع من الأسماك في المزرعة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={fishSpeciesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {fishSpeciesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {fishSpeciesData.map((item, index) => (
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
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Water Quality & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Water Quality */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Droplets className="card-icon text-cyan-600 mr-2" />
                  جودة الماء
                </CardTitle>
                <CardDescription>
                  مؤشرات جودة الماء الحالية
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {waterQualityData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.parameter}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        المثالي: {item.optimal}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {item.value}
                      </p>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status === 'good' ? 'جيد' : 
                         item.status === 'warning' ? 'تحذير' : 'خطر'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Alerts */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="card-icon text-orange-600 mr-2" />
                  التنبيهات الأخيرة
                </CardTitle>
                <CardDescription>
                  آخر التحديثات والتنبيهات من المزرعة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAlerts.map((alert, index) => (
                    <motion.div
                      key={alert.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex-shrink-0 mr-3">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {alert.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {alert.time}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
