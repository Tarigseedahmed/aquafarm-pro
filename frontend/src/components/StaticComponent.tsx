'use client'

/**
 * AquaFarm Pro - Static Component Wrapper
 * Wrapper for components that don't need client-side hydration
 */

import React from 'react'
import { cn } from '@/lib/utils'

interface StaticComponentProps {
  children: React.ReactNode
  className?: string
  as?: React.ElementType
}

/**
 * StaticComponent - A wrapper for components that don't need client-side hydration
 * This helps with Partial Hydration by reducing the JavaScript bundle size
 */
export default function StaticComponent({
  children,
  className,
  as: Component = 'div'
}: StaticComponentProps) {
  return (
    <Component className={cn("static-component", className)}>
      {children}
    </Component>
  )
}

/**
 * StaticCard - A static card component that doesn't need hydration
 */
export function StaticCard({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn(
      "bg-white rounded-lg shadow-sm border p-6",
      className
    )}>
      {children}
    </div>
  )
}

/**
 * StaticHeader - A static header component
 */
export function StaticHeader({
  title,
  subtitle,
  className
}: {
  title: string
  subtitle?: string
  className?: string
}) {
  return (
    <div className={cn("mb-8", className)}>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
      {subtitle && (
        <p className="text-gray-600">{subtitle}</p>
      )}
    </div>
  )
}

/**
 * StaticStats - A static stats display component
 */
export function StaticStats({
  stats,
  className
}: {
  stats: Array<{
    label: string
    value: string | number
    icon?: React.ComponentType<{ className?: string }>
  }>
  className?: string
}) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              {Icon && <Icon className="w-8 h-8 text-gray-400" />}
            </div>
          </div>
        )
      })}
    </div>
  )
}
