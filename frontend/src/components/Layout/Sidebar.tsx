'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Fish, 
  BarChart3, 
  Map, 
  FileText, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { 
      href: '/dashboard', 
      label: t('navigation.dashboard'), 
      icon: LayoutDashboard,
      badge: null
    },
    { 
      href: '/ponds', 
      label: t('navigation.ponds'), 
      icon: Fish,
      badge: '12'
    },
    { 
      href: '/analytics', 
      label: t('navigation.analytics'), 
      icon: BarChart3,
      badge: null
    },
    { 
      href: '/farm-map', 
      label: t('navigation.farmMap'), 
      icon: Map,
      badge: null
    },
    { 
      href: '/reports', 
      label: t('navigation.reports'), 
      icon: FileText,
      badge: '3'
    },
    { 
      href: '/settings', 
      label: t('navigation.settings'), 
      icon: Settings,
      badge: null
    },
  ];

  const quickActions = [
    { 
      href: '/ponds/new', 
      label: t('quickActions.newPond'), 
      icon: Fish,
      color: 'text-green-600 bg-green-50'
    },
    { 
      href: '/water-quality/new', 
      label: t('quickActions.waterQuality'), 
      icon: Activity,
      color: 'text-blue-600 bg-blue-50'
    },
    { 
      href: '/alerts', 
      label: t('quickActions.alerts'), 
      icon: AlertTriangle,
      color: 'text-orange-600 bg-orange-50'
    },
  ];

  return (
    <motion.aside 
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
      className={cn(
        "bg-white dark:bg-gray-900 shadow-sm border-r border-gray-200 dark:border-gray-700 min-h-screen transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Collapse Toggle */}
      <div className="flex justify-end p-4 border-b border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8"
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {isCollapsed ? (
              <ChevronRight className="icon-sm" />
            ) : (
              <ChevronLeft className="icon-sm" />
            )}
          </motion.div>
        </Button>
      </div>

      <div className="p-4">
        {/* Main Navigation */}
        <nav className="space-y-2 mb-8">
          {menuItems.map((item, index) => {
            const isActive = router.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <motion.a
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group relative",
                  isActive
                    ? "bg-aqua-50 dark:bg-aqua-900/20 text-aqua-700 dark:text-aqua-400 border-r-4 border-aqua-500"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-aqua-600 dark:hover:text-aqua-400"
                )}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ x: 4 }}
              >
                <Icon className={cn("h-5 w-5 flex-shrink-0", isCollapsed ? "mx-auto" : "ml-0 mr-3 rtl:ml-3 rtl:mr-0")} />
                
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Badge */}
                {item.badge && !isCollapsed && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto rtl:ml-0 rtl:mr-auto bg-aqua-100 dark:bg-aqua-900 text-aqua-600 dark:text-aqua-400 text-xs px-2 py-0.5 rounded-full"
                  >
                    {item.badge}
                  </motion.span>
                )}

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-aqua-500 rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.a>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  {t('sidebar.quickActions')}
                </h3>
                <div className="space-y-2">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <motion.a
                        key={action.href}
                        href={action.href}
                        className="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ x: 4 }}
                      >
                        <div className={cn("p-1.5 rounded-md mr-3 rtl:ml-3 rtl:mr-0", action.color)}>
                          <Icon className="sidebar-icon" />
                        </div>
                        <span>{action.label}</span>
                      </motion.a>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p>AquaFarm Pro v1.0</p>
                <p className="mt-1">جميع الأنظمة تعمل بشكل طبيعي</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
