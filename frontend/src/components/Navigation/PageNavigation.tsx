'use client'

/**
 * AquaFarm Pro - Page Navigation Component
 * Enhanced navigation for individual pages with context-aware buttons
 */

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Home,
  Edit,
  Save,
  Trash2,
  Eye,
  Plus,
  RefreshCw,
  Settings,
  Download,
  Share,
  Printer
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PageNavigationProps {
  className?: string
  showBackButton?: boolean
  showHomeButton?: boolean
  showRefreshButton?: boolean
  customBackPath?: string
  customBackLabel?: string
  onBack?: () => void
  onRefresh?: () => void
  actions?: Array<{
    label: string
    icon: React.ComponentType<{ className?: string }>
    onClick: () => void
    variant?: 'default' | 'outline' | 'destructive'
    disabled?: boolean
  }>
  breadcrumb?: boolean
  title?: string
  subtitle?: string
}

export default function PageNavigation({
  className,
  showBackButton = true,
  showHomeButton = true,
  showRefreshButton = true,
  customBackPath,
  customBackLabel = 'العودة',
  onBack,
  onRefresh,
  actions = [],
  breadcrumb = true,
  title,
  subtitle
}: PageNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)

  useEffect(() => {
    // Check if we can go back/forward
    setCanGoBack(window.history.length > 1)
    setCanGoForward(true) // This would need more sophisticated history tracking
  }, [pathname])

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (customBackPath) {
      router.push(customBackPath)
    } else if (canGoBack) {
      router.back()
    } else {
      router.push('/')
    }
  }

  const handleHome = () => {
    router.push('/')
  }

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh()
    } else {
      window.location.reload()
    }
  }

  const getPageTitle = (): string => {
    if (title) return title

    const segments = pathname.split('/').filter(Boolean)
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
      case 'edit': return 'تعديل'
      case 'create': return 'إضافة جديد'
      default: return lastSegment
    }
  }

  const getPageSubtitle = (): string => {
    if (subtitle) return subtitle

    const segments = pathname.split('/').filter(Boolean)

    if (segments.includes('farms') && segments.length > 1) {
      return 'إدارة مزارع الأسماك'
    } else if (segments.includes('ponds')) {
      return 'إدارة أحواض الأسماك'
    } else if (segments.includes('water-quality')) {
      return 'مراقبة جودة المياه'
    } else if (segments.includes('analytics')) {
      return 'تقارير وتحليلات'
    } else if (segments.includes('dashboard')) {
      return 'نظرة عامة على النظام'
    }

    return ''
  }

  return (
    <div className={cn("flex items-center justify-between py-4", className)} dir="rtl">
      {/* Left Side - Navigation */}
      <div className="flex items-center gap-2">
        {/* Back Button */}
        {showBackButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{customBackLabel}</span>
          </Button>
        )}

        {/* Home Button */}
        {showHomeButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleHome}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">الرئيسية</span>
          </Button>
        )}

        {/* Refresh Button */}
        {showRefreshButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">تحديث</span>
          </Button>
        )}
      </div>

      {/* Center - Page Title */}
      <div className="flex-1 text-center">
        <motion.h1
          className="text-2xl font-bold text-gray-900"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {getPageTitle()}
        </motion.h1>
        {getPageSubtitle() && (
          <motion.p
            className="text-gray-600 mt-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {getPageSubtitle()}
          </motion.p>
        )}
      </div>

      {/* Right Side - Actions */}
      <div className="flex items-center gap-2">
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.1 }}
            >
              <Button
                variant={action.variant || 'outline'}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{action.label}</span>
              </Button>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
