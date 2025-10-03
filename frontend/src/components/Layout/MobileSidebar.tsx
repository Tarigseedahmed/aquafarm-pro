'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Fish,
  BarChart3,
  Map,
  FileText,
  Settings,
  Home,
  Activity,
  AlertTriangle,
  X,
  Menu
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { TouchOptimized } from '@/components/ui/touch-optimized';
import { cn } from '@/lib/utils';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const { t } = useTranslation('common');
  const router = useRouter();

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
      href: '/water-quality',
      label: t('navigation.waterQuality'),
      icon: Activity,
      badge: '3'
    },
    {
      href: '/reports',
      label: t('navigation.reports'),
      icon: FileText,
      badge: null
    },
    {
      href: '/settings',
      label: t('navigation.settings'),
      icon: Settings,
      badge: null
    }
  ];

  const quickActions = [
    {
      href: '/',
      label: t('navigation.home'),
      icon: Home,
      color: 'text-blue-600'
    },
    {
      href: '/alerts',
      label: t('navigation.alerts'),
      icon: AlertTriangle,
      color: 'text-orange-600',
      badge: '5'
    }
  ];

  const handleNavigation = (href: string) => {
    router.push(href);
    onClose();
  };

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-background border-r border-border shadow-xl"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="w-10 h-10 bg-gradient-to-br from-aqua-500 to-aqua-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">🐟</span>
                  </div>
                  <h1 className="text-xl font-bold text-aqua-600 dark:text-aqua-400">
                    AquaFarm Pro
                  </h1>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-md hover:bg-accent touch-manipulation min-h-[44px] min-w-[44px]"
                  aria-label="Close menu"
                >
                  <X className="icon-md" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                {/* Main Menu */}
                <div className="space-y-1">
                  {menuItems.map((item) => {
                    const isActive = router.pathname === item.href;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.href}
                        onClick={() => handleNavigation(item.href)}
                        className={cn(
                          'w-full flex items-center justify-between px-4 py-3 rounded-lg text-right rtl:text-right',
                          'transition-colors duration-200 touch-manipulation min-h-[44px]',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <Icon className="icon-md" />
                          <span className="font-medium">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Quick Actions */}
                <div className="pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-4">
                    إجراءات سريعة
                  </h3>
                  <div className="space-y-1">
                    {quickActions.map((action) => {
                      const isActive = router.pathname === action.href;
                      const Icon = action.icon;

                      return (
                        <button
                          key={action.href}
                          onClick={() => handleNavigation(action.href)}
                          className={cn(
                            'w-full flex items-center justify-between px-4 py-3 rounded-lg text-right rtl:text-right',
                            'transition-colors duration-200 touch-manipulation min-h-[44px]',
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-accent hover:text-accent-foreground'
                          )}
                        >
                          <div className="flex items-center space-x-3 rtl:space-x-reverse">
                            <Icon className={cn('icon-md', action.color)} />
                            <span className="font-medium">{action.label}</span>
                          </div>
                          {action.badge && (
                            <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">
                              {action.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-border">
                <div className="text-xs text-muted-foreground text-center">
                  AquaFarm Pro v1.0.0
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
