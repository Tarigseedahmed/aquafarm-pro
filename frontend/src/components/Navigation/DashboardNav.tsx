'use client'

/**
 * AquaFarm Pro - Dashboard Navigation Component
 * Specialized navigation for dashboard with quick stats and shortcuts
 */

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Home,
  ArrowLeft,
  RefreshCw,
  Settings,
  Bell,
  TrendingUp,
  Activity,
  AlertTriangle,
  Fish,
  Droplets,
  MapPin,
  BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface DashboardNavProps {
  className?: string
  onRefresh?: () => void
  stats?: {
    farms: number
    ponds: number
    alerts: number
    waterQuality: 'excellent' | 'good' | 'warning' | 'critical'
  }
}

export default function DashboardNav({ 
  className, 
  onRefresh,
  stats = {
    farms: 2,
    ponds: 5,
    alerts: 1,
    waterQuality: 'good'
  }
}: DashboardNavProps) {
  const router = useRouter()
  const [isQuickNavOpen, setIsQuickNavOpen] = useState(false)

  const quickActions = [
    {
      label: 'المزارع',
      href: '/farms',
      icon: MapPin,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      count: stats.farms
    },
    {
      label: 'الأحواض',
      href: '/ponds',
      icon: Fish,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      count: stats.ponds
    },
    {
      label: 'جودة المياه',
      href: '/water-quality',
      icon: Droplets,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      status: stats.waterQuality
    },
    {
      label: 'التحليلات',
      href: '/analytics',
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800'
      case 'good': return 'bg-blue-100 text-blue-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'excellent': return 'ممتاز'
      case 'good': return 'جيد'
      case 'warning': return 'تحذير'
      case 'critical': return 'حرج'
      default: return status
    }
  }

  return (
    <div className={cn("flex items-center justify-between py-4", className)} dir="rtl">
      {/* Left Side - Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/')}
          className="flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">الرئيسية</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">تحديث</span>
        </Button>
      </div>

      {/* Center - Quick Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>{stats.farms} مزرعة</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Fish className="w-4 h-4" />
          <span>{stats.ponds} حوض</span>
        </div>
        {stats.alerts > 0 && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertTriangle className="w-4 h-4" />
            <span>{stats.alerts} تنبيه</span>
          </div>
        )}
      </div>

      {/* Right Side - Quick Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsQuickNavOpen(!isQuickNavOpen)}
          className="flex items-center gap-2"
        >
          <Activity className="w-4 h-4" />
          <span className="hidden sm:inline">سريع</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/settings')}
          className="flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">إعدادات</span>
        </Button>
      </div>

      {/* Quick Navigation Dropdown */}
      {isQuickNavOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 mt-2 w-80 z-50"
          dir="rtl"
        >
          <Card className="shadow-lg border">
            <CardContent className="p-4">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900">التنقل السريع</h3>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action) => {
                    const Icon = action.icon
                    return (
                      <motion.button
                        key={action.href}
                        onClick={() => {
                          router.push(action.href)
                          setIsQuickNavOpen(false)
                        }}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-md text-right transition-colors",
                          action.bgColor,
                          "hover:shadow-md"
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Icon className={cn("w-5 h-5", action.color)} />
                        <div className="flex-1 text-right">
                          <div className="text-sm font-medium">{action.label}</div>
                          {action.count && (
                            <div className="text-xs text-gray-500">{action.count} عنصر</div>
                          )}
                          {action.status && (
                            <Badge className={cn("text-xs", getStatusColor(action.status))}>
                              {getStatusText(action.status)}
                            </Badge>
                          )}
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
