'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Fish, 
  Droplets, 
  Thermometer, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Plus,
  Filter,
  Grid,
  List
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Mock data
const pondsData = [
  {
    id: 1,
    name: 'الحوض الرئيسي',
    status: 'healthy',
    fishCount: 2500,
    avgWeight: 1.2,
    waterTemp: 24.5,
    oxygenLevel: 8.2,
    ph: 7.1,
    lastFeeding: 'منذ ساعتين',
    nextHarvest: '15 يوم',
    species: 'البلطي',
    capacity: 3000,
    utilization: 83
  },
  {
    id: 2,
    name: 'حوض التربية',
    status: 'warning',
    fishCount: 1800,
    avgWeight: 0.8,
    waterTemp: 26.1,
    oxygenLevel: 6.8,
    ph: 6.9,
    lastFeeding: 'منذ 4 ساعات',
    nextHarvest: '25 يوم',
    species: 'السلمون',
    capacity: 2000,
    utilization: 90
  },
  {
    id: 3,
    name: 'حوض الحضانة',
    status: 'danger',
    fishCount: 500,
    avgWeight: 0.3,
    waterTemp: 28.2,
    oxygenLevel: 5.5,
    ph: 6.5,
    lastFeeding: 'منذ 6 ساعات',
    nextHarvest: '45 يوم',
    species: 'القرموط',
    capacity: 1000,
    utilization: 50
  },
  {
    id: 4,
    name: 'حوض التجارب',
    status: 'healthy',
    fishCount: 1200,
    avgWeight: 0.9,
    waterTemp: 23.8,
    oxygenLevel: 7.9,
    ph: 7.3,
    lastFeeding: 'منذ ساعة',
    nextHarvest: '30 يوم',
    species: 'التراوت',
    capacity: 1500,
    utilization: 80
  }
];

const PondCard = ({ pond, index }: { pond: any; index: number }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'danger': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'danger': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy': return 'صحي';
      case 'warning': return 'تحذير';
      case 'danger': return 'خطر';
      default: return 'غير معروف';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group"
    >
      <Card className={`relative overflow-hidden transition-all duration-300 ${
        isHovered ? 'shadow-lg' : 'shadow-sm'
      }`}>
        {/* Status Indicator */}
        <div className={`absolute top-0 right-0 p-2 rounded-bl-lg ${getStatusColor(pond.status)}`}>
          {getStatusIcon(pond.status)}
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                {pond.name}
              </CardTitle>
              <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                {pond.species} • السعة: {pond.capacity.toLocaleString()}
              </CardDescription>
            </div>
            <Badge className={getStatusColor(pond.status)}>
              {getStatusText(pond.status)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Fish Count & Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <Fish className="h-4 w-4 text-blue-600 mr-1" />
                <span className="text-sm font-medium text-blue-600">عدد الأسماك</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {pond.fishCount.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-sm font-medium text-green-600">متوسط الوزن</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {pond.avgWeight} كغ
              </p>
            </div>
          </div>

          {/* Water Quality Indicators */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Thermometer className="h-4 w-4 text-orange-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">درجة الحرارة</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {pond.waterTemp}°C
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Droplets className="h-4 w-4 text-blue-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">مستوى الأكسجين</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {pond.oxygenLevel} mg/L
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Activity className="h-4 w-4 text-purple-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">الأس الهيدروجيني</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {pond.ph}
              </span>
            </div>
          </div>

          {/* Utilization Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">معدل الاستخدام</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {pond.utilization}%
              </span>
            </div>
            <Progress value={pond.utilization} className="h-2" />
          </div>

          {/* Last Feeding & Next Harvest */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">آخر تغذية</p>
              <p className="font-medium text-gray-900 dark:text-white">{pond.lastFeeding}</p>
            </div>
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">الحصاد القادم</p>
              <p className="font-medium text-gray-900 dark:text-white">{pond.nextHarvest}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <motion.div 
            className="flex space-x-2 rtl:space-x-reverse"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Button variant="outline" size="sm" className="flex-1">
              <Eye className="h-4 w-4 mr-1" />
              عرض
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Edit className="h-4 w-4 mr-1" />
              تعديل
            </Button>
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function EnhancedPondsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPonds = pondsData.filter(pond => {
    const matchesSearch = pond.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pond.species.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || pond.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
                إدارة الأحواض
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                مراقبة وإدارة جميع أحواض المزرعة
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3 rtl:space-x-reverse">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    إضافة حوض جديد
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>إضافة حوض جديد</DialogTitle>
                    <DialogDescription>
                      قم بملء البيانات التالية لإضافة حوض جديد للمزرعة
                    </DialogDescription>
                  </DialogHeader>
                  {/* Add form content here */}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Input
                  placeholder="البحث في الأحواض..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="فلترة حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأحواض</SelectItem>
                <SelectItem value="healthy">صحي</SelectItem>
                <SelectItem value="warning">تحذير</SelectItem>
                <SelectItem value="danger">خطر</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Ponds Grid */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}
        >
          <AnimatePresence>
            {filteredPonds.map((pond, index) => (
              <PondCard key={pond.id} pond={pond} index={index} />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredPonds.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Fish className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              لا توجد أحواض
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              لم يتم العثور على أحواض تطابق معايير البحث
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              إضافة حوض جديد
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
