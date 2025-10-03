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
  Plus,
  Settings,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock data for farm layout
const farmLayout = {
  rows: 6,
  cols: 8,
  ponds: [
    { id: 1, row: 1, col: 2, name: 'الحوض الرئيسي', status: 'healthy', fishCount: 2500, species: 'البلطي' },
    { id: 2, row: 1, col: 4, name: 'حوض التربية', status: 'warning', fishCount: 1800, species: 'السلمون' },
    { id: 3, row: 2, col: 1, name: 'حوض الحضانة', status: 'danger', fishCount: 500, species: 'القرموط' },
    { id: 4, row: 2, col: 3, name: 'حوض التجارب', status: 'healthy', fishCount: 1200, species: 'التراوت' },
    { id: 5, row: 3, col: 2, name: 'حوض الإنتاج', status: 'healthy', fishCount: 3000, species: 'البلطي' },
    { id: 6, row: 3, col: 5, name: 'حوض التخزين', status: 'warning', fishCount: 800, species: 'السلمون' },
    { id: 7, row: 4, col: 1, name: 'حوض الحجر الصحي', status: 'healthy', fishCount: 0, species: 'غير محدد' },
    { id: 8, row: 4, col: 4, name: 'حوض التسمين', status: 'healthy', fishCount: 2200, species: 'البلطي' },
    { id: 9, row: 5, col: 3, name: 'حوض التفريخ', status: 'warning', fishCount: 1500, species: 'التراوت' },
    { id: 10, row: 6, col: 2, name: 'حوض المعالجة', status: 'healthy', fishCount: 0, species: 'غير محدد' },
  ]
};

const PondCell = ({ pond, onPondClick, isSelected }: { 
  pond: any; 
  onPondClick: (pond: any) => void;
  isSelected: boolean;
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 border-green-300 hover:bg-green-200';
      case 'warning': return 'bg-orange-100 border-orange-300 hover:bg-orange-200';
      case 'danger': return 'bg-red-100 border-red-300 hover:bg-red-200';
      default: return 'bg-gray-100 border-gray-300 hover:bg-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'danger': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative w-full h-24 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
        isSelected ? 'ring-2 ring-aqua-500' : ''
      } ${getStatusColor(pond.status)}`}
      onClick={() => onPondClick(pond)}
    >
      <div className="p-2 h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-gray-700 truncate">
            {pond.name}
          </div>
          {getStatusIcon(pond.status)}
        </div>
        <div className="text-xs text-gray-600">
          <div className="flex items-center">
            <Fish className="h-3 w-3 mr-1" />
            {pond.fishCount.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {pond.species}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const EmptyCell = ({ row, col, onAddPond }: { 
  row: number; 
  col: number; 
  onAddPond: (position: { row: number; col: number }) => void;
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-aqua-400 hover:bg-aqua-50 transition-all duration-200"
      onClick={() => onAddPond({ row, col })}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <Plus className="h-6 w-6 text-gray-400" />
      </div>
    </motion.div>
  );
};

const PondDetailModal = ({ pond, isOpen, onClose }: {
  pond: any;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!pond) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-orange-600 bg-orange-50';
      case 'danger': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Fish className="h-5 w-5 text-aqua-600 mr-2" />
            {pond.name}
          </DialogTitle>
          <DialogDescription>
            تفاصيل الحوض ومعلومات المراقبة
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="water">جودة الماء</TabsTrigger>
            <TabsTrigger value="feeding">التغذية</TabsTrigger>
            <TabsTrigger value="harvest">الحصاد</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">الحالة</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={getStatusColor(pond.status)}>
                    {getStatusText(pond.status)}
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">عدد الأسماك</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{pond.fishCount.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">نوع الأسماك</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">{pond.species}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="water" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <Thermometer className="h-4 w-4 mr-2" />
                    درجة الحرارة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">24.5°C</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <Droplets className="h-4 w-4 mr-2" />
                    مستوى الأكسجين
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">8.2 mg/L</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="feeding" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">آخر التغذية</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">منذ ساعتين</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="harvest" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">الحصاد القادم</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">15 يوم</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 rtl:space-x-reverse">
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            تعديل
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function FarmMapPage() {
  const [selectedPond, setSelectedPond] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handlePondClick = (pond: any) => {
    setSelectedPond(pond);
    setIsDetailModalOpen(true);
  };

  const handleAddPond = (position: { row: number; col: number }) => {
    // Handle adding new pond at position
    console.log('Add pond at:', position);
  };

  const getPondAtPosition = (row: number, col: number) => {
    return farmLayout.ponds.find(pond => pond.row === row && pond.col === col);
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
                خريطة المزرعة
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                عرض تفاعلي لجميع أحواض المزرعة
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3 rtl:space-x-reverse">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                إعدادات
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                إضافة حوض
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Button variant="outline" size="sm">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                مستوى التكبير: {Math.round(zoomLevel * 100)}%
              </div>
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">صحي</span>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">تحذير</span>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">خطر</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Farm Grid */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div 
            className="grid gap-4 mx-auto"
            style={{
              gridTemplateColumns: `repeat(${farmLayout.cols}, 1fr)`,
              maxWidth: 'fit-content'
            }}
          >
            {Array.from({ length: farmLayout.rows }, (_, row) =>
              Array.from({ length: farmLayout.cols }, (_, col) => {
                const pond = getPondAtPosition(row + 1, col + 1);
                const isSelected = selectedPond?.id === pond?.id;
                
                return (
                  <div key={`${row}-${col}`}>
                    {pond ? (
                      <PondCell
                        pond={pond}
                        onPondClick={handlePondClick}
                        isSelected={isSelected}
                      />
                    ) : (
                      <EmptyCell
                        row={row + 1}
                        col={col + 1}
                        onAddPond={handleAddPond}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Statistics */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6"
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600 dark:text-gray-400">إجمالي الأحواض</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {farmLayout.ponds.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600 dark:text-gray-400">الأحواض الصحية</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {farmLayout.ponds.filter(p => p.status === 'healthy').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600 dark:text-gray-400">تحتاج انتباه</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">
                {farmLayout.ponds.filter(p => p.status === 'warning').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600 dark:text-gray-400">في خطر</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                {farmLayout.ponds.filter(p => p.status === 'danger').length}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Pond Detail Modal */}
      <PondDetailModal
        pond={selectedPond}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  );
}
