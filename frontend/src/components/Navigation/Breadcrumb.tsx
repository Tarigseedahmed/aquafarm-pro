'use client'

/**
 * AquaFarm Pro - Breadcrumb Navigation Component
 * Enhanced navigation with back button and breadcrumb trail
 */

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Home, 
  ChevronLeft,
  MapPin,
  Fish,
  Droplets,
  BarChart3,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
}

interface BreadcrumbProps {
  className?: string
  showBackButton?: boolean
  customBackPath?: string
}

export default function Breadcrumb({ 
  className, 
  showBackButton = true, 
  customBackPath 
}: BreadcrumbProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([])

  // Generate breadcrumbs based on current path
  useEffect(() => {
    const generateBreadcrumbs = (): BreadcrumbItem[] => {
      const segments = pathname.split('/').filter(Boolean)
      const breadcrumbItems: BreadcrumbItem[] = [
        { label: 'الرئيسية', href: '/', icon: Home }
      ]

      let currentPath = ''
      
      segments.forEach((segment, index) => {
        currentPath += `/${segment}`
        
        // Map segments to readable labels
        let label = segment
        let icon: React.ComponentType<{ className?: string }> | undefined
        
        switch (segment) {
          case 'dashboard':
            label = 'لوحة التحكم'
            icon = BarChart3
            break
          case 'farms':
            label = 'المزارع'
            icon = MapPin
            break
          case 'ponds':
            label = 'الأحواض'
            icon = Fish
            break
          case 'water-quality':
            label = 'جودة المياه'
            icon = Droplets
            break
          case 'analytics':
            label = 'التحليلات'
            icon = BarChart3
            break
          case 'farm-map':
            label = 'خريطة المزارع'
            icon = MapPin
            break
          case 'settings':
            label = 'الإعدادات'
            icon = Settings
            break
          default:
            // For dynamic segments like [id], try to get meaningful label
            if (segment.match(/^\d+$/)) {
              label = `#${segment}`
            } else if (segment === 'edit') {
              label = 'تعديل'
            } else if (segment === 'create') {
              label = 'إضافة جديد'
            }
        }
        
        breadcrumbItems.push({
          label,
          href: currentPath,
          icon
        })
      })
      
      return breadcrumbItems
    }

    setBreadcrumbs(generateBreadcrumbs())
  }, [pathname])

  const handleBack = () => {
    if (customBackPath) {
      router.push(customBackPath)
    } else if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  const handleBreadcrumbClick = (href: string) => {
    router.push(href)
  }

  return (
    <div className={cn("flex items-center gap-2 py-2", className)} dir="rtl">
      {/* Back Button */}
      {showBackButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          className="flex items-center gap-2 hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">العودة</span>
        </Button>
      )}

      {/* Breadcrumb Trail */}
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1
          const Icon = item.icon
          
          return (
            <div key={item.href} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronLeft className="w-3 h-3 text-gray-400" />
              )}
              
              <motion.button
                onClick={() => !isLast && handleBreadcrumbClick(item.href)}
                disabled={isLast}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md transition-colors",
                  isLast 
                    ? "text-gray-900 font-medium cursor-default" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                )}
                whileHover={!isLast ? { scale: 1.02 } : {}}
                whileTap={!isLast ? { scale: 0.98 } : {}}
              >
                {Icon && <Icon className="w-3 h-3" />}
                <span>{item.label}</span>
              </motion.button>
            </div>
          )
        })}
      </nav>
    </div>
  )
}
