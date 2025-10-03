'use client'

/**
 * AquaFarm Pro - Quick Navigation Component
 * Quick access buttons for common pages
 */

import React, { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home,
  ArrowLeft,
  ArrowRight,
  LayoutDashboard,
  Fish,
  MapPin,
  Droplets,
  BarChart3,
  Settings,
  Bookmark,
  History
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface QuickNavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
  color?: string
}

interface QuickNavProps {
  className?: string
  showHistory?: boolean
  maxHistoryItems?: number
}

export default function QuickNav({ 
  className, 
  showHistory = true, 
  maxHistoryItems = 5 
}: QuickNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(false)
  const [history, setHistory] = useState<string[]>([])

  // Quick navigation items
  const quickNavItems: QuickNavItem[] = [
    {
      label: 'الرئيسية',
      href: '/',
      icon: Home,
      description: 'الصفحة الرئيسية',
      color: 'text-blue-600'
    },
    {
      label: 'لوحة التحكم',
      href: '/dashboard',
      icon: LayoutDashboard,
      description: 'نظرة عامة على النظام',
      color: 'text-green-600'
    },
    {
      label: 'المزارع',
      href: '/farms',
      icon: MapPin,
      description: 'إدارة المزارع',
      color: 'text-orange-600'
    },
    {
      label: 'الأحواض',
      href: '/ponds',
      icon: Fish,
      description: 'إدارة الأحواض',
      color: 'text-cyan-600'
    },
    {
      label: 'جودة المياه',
      href: '/water-quality',
      icon: Droplets,
      description: 'مراقبة جودة المياه',
      color: 'text-blue-600'
    },
    {
      label: 'التحليلات',
      href: '/analytics',
      icon: BarChart3,
      description: 'تقارير وتحليلات',
      color: 'text-purple-600'
    },
    {
      label: 'خريطة المزارع',
      href: '/farm-map',
      icon: MapPin,
      description: 'خريطة تفاعلية',
      color: 'text-green-600'
    }
  ]

  // Update history when pathname changes
  React.useEffect(() => {
    if (pathname && pathname !== '/') {
      setHistory(prev => {
        const newHistory = [pathname, ...prev.filter(path => path !== pathname)]
        return newHistory.slice(0, maxHistoryItems)
      })
    }
  }, [pathname, maxHistoryItems])

  const handleNavigation = (href: string) => {
    router.push(href)
    setIsExpanded(false)
  }

  const handleBack = () => {
    if (history.length > 1) {
      router.push(history[1])
    } else {
      router.push('/')
    }
  }

  const handleForward = () => {
    // This would require browser history management
    router.forward()
  }

  const getPageLabel = (path: string): string => {
    const segments = path.split('/').filter(Boolean)
    if (segments.length === 0) return 'الرئيسية'
    
    const lastSegment = segments[segments.length - 1]
    
    switch (lastSegment) {
      case 'dashboard': return 'لوحة التحكم'
      case 'farms': return 'المزارع'
      case 'ponds': return 'الأحواض'
      case 'water-quality': return 'جودة المياه'
      case 'analytics': return 'التحليلات'
      case 'farm-map': return 'خريطة المزارع'
      case 'settings': return 'الإعدادات'
      default: return lastSegment
    }
  }

  return (
    <div className={cn("relative", className)}>
      {/* Quick Navigation Buttons */}
      <div className="flex items-center gap-2">
        {/* Back Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          disabled={history.length <= 1}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">السابق</span>
        </Button>

        {/* Forward Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleForward}
          className="flex items-center gap-1"
        >
          <ArrowRight className="w-4 h-4" />
          <span className="hidden sm:inline">التالي</span>
        </Button>

        {/* Home Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleNavigation('/')}
          className="flex items-center gap-1"
        >
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">الرئيسية</span>
        </Button>

        {/* Quick Nav Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1"
        >
          <Bookmark className="w-4 h-4" />
          <span className="hidden sm:inline">سريع</span>
        </Button>
      </div>

      {/* Expanded Quick Navigation */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 w-80 z-50"
            dir="rtl"
          >
            <Card className="shadow-lg border">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Quick Navigation Items */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">التنقل السريع</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {quickNavItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        
                        return (
                          <motion.button
                            key={item.href}
                            onClick={() => handleNavigation(item.href)}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-md text-right transition-colors",
                              isActive 
                                ? "bg-blue-50 text-blue-700 border border-blue-200" 
                                : "hover:bg-gray-50 text-gray-700"
                            )}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Icon className={cn("w-4 h-4", item.color)} />
                            <div className="flex-1 text-right">
                              <div className="text-sm font-medium">{item.label}</div>
                              <div className="text-xs text-gray-500">{item.description}</div>
                            </div>
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Recent History */}
                  {showHistory && history.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <History className="w-4 h-4" />
                        الصفحات الأخيرة
                      </h3>
                      <div className="space-y-1">
                        {history.slice(0, maxHistoryItems).map((path, index) => (
                          <motion.button
                            key={path}
                            onClick={() => handleNavigation(path)}
                            className="w-full flex items-center gap-2 p-2 rounded-md text-right hover:bg-gray-50 text-gray-700 transition-colors"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                          >
                            <div className="w-2 h-2 bg-gray-400 rounded-full" />
                            <span className="text-sm">{getPageLabel(path)}</span>
                            {index === 0 && (
                              <span className="text-xs text-gray-500 mr-auto">الحالية</span>
                            )}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
