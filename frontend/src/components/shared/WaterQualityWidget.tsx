'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Droplets, 
  Thermometer, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface WaterQualityData {
  ph: number;
  oxygen: number;
  temperature: number;
  ammonia: number;
  nitrates: number;
  turbidity: number;
  timestamp: Date;
}

interface WaterQualityWidgetProps {
  data?: WaterQualityData;
  showTrends?: boolean;
  compact?: boolean;
  onParameterClick?: (parameter: string) => void;
}

export default function WaterQualityWidget({
  data,
  showTrends = true,
  compact = false,
  onParameterClick
}: WaterQualityWidgetProps) {
  const [currentData, setCurrentData] = useState<WaterQualityData | null>(null);

  // Mock data if none provided
  const mockData: WaterQualityData = {
    ph: 7.2,
    oxygen: 8.5,
    temperature: 24.5,
    ammonia: 0.3,
    nitrates: 15,
    turbidity: 2.1,
    timestamp: new Date()
  };

  useEffect(() => {
    setCurrentData(data || mockData);
  }, [data]);

  const getParameterStatus = (parameter: string, value: number) => {
    switch (parameter) {
      case 'ph':
        if (value >= 6.5 && value <= 7.5) return 'good';
        if (value >= 6.0 && value <= 8.0) return 'warning';
        return 'danger';
      case 'oxygen':
        if (value >= 6.0) return 'good';
        if (value >= 4.0) return 'warning';
        return 'danger';
      case 'temperature':
        if (value >= 22 && value <= 26) return 'good';
        if (value >= 20 && value <= 28) return 'warning';
        return 'danger';
      case 'ammonia':
        if (value <= 0.5) return 'good';
        if (value <= 1.0) return 'warning';
        return 'danger';
      case 'nitrates':
        if (value <= 20) return 'good';
        if (value <= 40) return 'warning';
        return 'danger';
      case 'turbidity':
        if (value <= 5) return 'good';
        if (value <= 10) return 'warning';
        return 'danger';
      default:
        return 'good';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'danger': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'danger': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getParameterIcon = (parameter: string) => {
    switch (parameter) {
      case 'ph': return <Activity className="h-4 w-4" />;
      case 'oxygen': return <Droplets className="h-4 w-4" />;
      case 'temperature': return <Thermometer className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getParameterUnit = (parameter: string) => {
    switch (parameter) {
      case 'ph': return '';
      case 'oxygen': return 'mg/L';
      case 'temperature': return '°C';
      case 'ammonia': return 'mg/L';
      case 'nitrates': return 'mg/L';
      case 'turbidity': return 'NTU';
      default: return '';
    }
  };

  const getParameterName = (parameter: string) => {
    switch (parameter) {
      case 'ph': return 'الأس الهيدروجيني';
      case 'oxygen': return 'الأكسجين';
      case 'temperature': return 'درجة الحرارة';
      case 'ammonia': return 'الأمونيا';
      case 'nitrates': return 'النترات';
      case 'turbidity': return 'العكارة';
      default: return parameter;
    }
  };

  const getOptimalRange = (parameter: string) => {
    switch (parameter) {
      case 'ph': return '6.5-7.5';
      case 'oxygen': return '6.0+ mg/L';
      case 'temperature': return '22-26°C';
      case 'ammonia': return '<0.5 mg/L';
      case 'nitrates': return '<20 mg/L';
      case 'turbidity': return '<5 NTU';
      default: return '';
    }
  };

  const parameters = [
    { key: 'ph', label: 'الأس الهيدروجيني', icon: Activity },
    { key: 'oxygen', label: 'الأكسجين', icon: Droplets },
    { key: 'temperature', label: 'درجة الحرارة', icon: Thermometer },
    { key: 'ammonia', label: 'الأمونيا', icon: AlertTriangle },
    { key: 'nitrates', label: 'النترات', icon: Activity },
    { key: 'turbidity', label: 'العكارة', icon: Droplets }
  ];

  if (!currentData) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <Droplets className="h-4 w-4 text-blue-600 mr-2" />
            جودة الماء
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {parameters.slice(0, 4).map((param) => {
              const value = currentData[param.key as keyof WaterQualityData] as number;
              const status = getParameterStatus(param.key, value);
              const Icon = param.icon;
              
              return (
                <motion.div
                  key={param.key}
                  whileHover={{ scale: 1.02 }}
                  className={`p-2 rounded-lg border ${getStatusColor(status)} cursor-pointer`}
                  onClick={() => onParameterClick?.(param.key)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Icon className="h-3 w-3" />
                    {getStatusIcon(status)}
                  </div>
                  <div className="text-xs font-medium">{param.label}</div>
                  <div className="text-sm font-bold">
                    {value}{getParameterUnit(param.key)}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Droplets className="h-5 w-5 text-blue-600 mr-2" />
          جودة الماء
        </CardTitle>
        <CardDescription>
          مراقبة مؤشرات جودة الماء في الوقت الفعلي
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {parameters.map((param, index) => {
            const value = currentData[param.key as keyof WaterQualityData] as number;
            const status = getParameterStatus(param.key, value);
            const Icon = param.icon;
            
            return (
              <motion.div
                key={param.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${getStatusColor(status)}`}
                onClick={() => onParameterClick?.(param.key)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Icon className="h-4 w-4 mr-2" />
                    <span className="font-medium">{param.label}</span>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    {getStatusIcon(status)}
                    <span className="text-sm font-bold">
                      {value}{getParameterUnit(param.key)}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  المثالي: {getOptimalRange(param.key)}
                </div>
                {showTrends && (
                  <div className="mt-2">
                    <div className="flex items-center text-xs">
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-green-600">+0.2</span>
                      <span className="text-gray-500 mr-2">من الأسبوع الماضي</span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>آخر تحديث</span>
            <span>{currentData.timestamp.toLocaleTimeString('ar-SA')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
