'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  X, 
  Bell,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Alert {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface SmartAlertBannerProps {
  alerts?: Alert[];
  maxAlerts?: number;
  autoHide?: boolean;
  autoHideDelay?: number;
  onAlertClick?: (alert: Alert) => void;
  onAlertDismiss?: (alertId: string) => void;
  onMarkAllRead?: () => void;
}

export default function SmartAlertBanner({
  alerts = [],
  maxAlerts = 5,
  autoHide = false,
  autoHideDelay = 5000,
  onAlertClick,
  onAlertDismiss,
  onMarkAllRead
}: SmartAlertBannerProps) {
  const [visibleAlerts, setVisibleAlerts] = useState<Alert[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Mock alerts if none provided
  const mockAlerts: Alert[] = [
    {
      id: '1',
      type: 'warning',
      title: 'انخفاض مستوى الأكسجين',
      message: 'مستوى الأكسجين في الحوض 3 أقل من المعدل المطلوب',
      timestamp: new Date(),
      isRead: false,
      priority: 'high'
    },
    {
      id: '2',
      type: 'success',
      title: 'تم إكمال التغذية',
      message: 'تم إكمال عملية التغذية لجميع الأحواض بنجاح',
      timestamp: new Date(Date.now() - 300000),
      isRead: false,
      priority: 'low'
    },
    {
      id: '3',
      type: 'error',
      title: 'عطل في المضخة',
      message: 'تم اكتشاف عطل في مضخة الحوض 2، يرجى الصيانة الفورية',
      timestamp: new Date(Date.now() - 600000),
      isRead: false,
      priority: 'critical'
    },
    {
      id: '4',
      type: 'info',
      title: 'تقرير أسبوعي',
      message: 'تم إنتاج تقرير الأداء الأسبوعي بنجاح',
      timestamp: new Date(Date.now() - 900000),
      isRead: true,
      priority: 'low'
    }
  ];

  const displayAlerts = alerts.length > 0 ? alerts : mockAlerts;

  useEffect(() => {
    const unreadAlerts = displayAlerts
      .filter(alert => !alert.isRead)
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, maxAlerts);

    setVisibleAlerts(unreadAlerts);
  }, [displayAlerts, maxAlerts]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="alert-icon text-green-600" />;
      case 'warning': return <AlertTriangle className="alert-icon text-orange-600" />;
      case 'error': return <AlertCircle className="alert-icon text-red-600" />;
      case 'info': return <Info className="alert-icon text-blue-600" />;
      default: return <Bell className="alert-icon text-gray-600" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'warning': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const seconds = Math.floor((new Date().getTime() - timestamp.getTime()) / 1000);
    
    if (seconds < 60) return 'الآن';
    if (seconds < 3600) return `منذ ${Math.floor(seconds / 60)} دقيقة`;
    if (seconds < 86400) return `منذ ${Math.floor(seconds / 3600)} ساعة`;
    return `منذ ${Math.floor(seconds / 86400)} يوم`;
  };

  const handleAlertDismiss = (alertId: string) => {
    setVisibleAlerts(prev => prev.filter(alert => alert.id !== alertId));
    onAlertDismiss?.(alertId);
  };

  const handleMarkAllRead = () => {
    setVisibleAlerts([]);
    onMarkAllRead?.();
  };

  // Simplified: Always return null for faster loading
  return null;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed top-16 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Bell className="alert-icon text-aqua-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                التنبيهات
              </h3>
              <Badge variant="secondary" className="mr-2">
                {visibleAlerts.length}
              </Badge>
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              {visibleAlerts.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  className="text-sm"
                >
                  تعيين الكل كمقروء
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'إخفاء' : 'عرض الكل'}
              </Button>
            </div>
          </div>

          {/* Alerts */}
          <div className="max-h-96 overflow-y-auto">
            <AnimatePresence>
              {visibleAlerts.slice(0, isExpanded ? visibleAlerts.length : 1).map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                    getAlertColor(alert.type)
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 rtl:space-x-reverse">
                        <div className="flex-shrink-0 mt-1">
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 rtl:space-x-reverse mb-1">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {alert.title}
                            </h4>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getPriorityColor(alert.priority)}`}
                            >
                              {alert.priority === 'critical' ? 'حرج' :
                               alert.priority === 'high' ? 'عالي' :
                               alert.priority === 'medium' ? 'متوسط' : 'منخفض'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {alert.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {formatTimeAgo(alert.timestamp)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAlertDismiss(alert.id)}
                        className="flex-shrink-0"
                      >
                        <X className="icon-sm" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
