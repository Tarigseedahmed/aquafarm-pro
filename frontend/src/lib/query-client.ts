/**
 * AquaFarm Pro - TanStack Query Configuration
 * Query client setup with caching and error handling
 */

import { QueryClient } from '@tanstack/react-query'

// Create a client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Optimize for faster loading
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      // Retry delay for mutations
      retryDelay: 1000,
    },
  },
})

// Query keys factory for consistent key management
export const queryKeys = {
  // Farm related queries
  farms: {
    all: ['farms'] as const,
    lists: () => [...queryKeys.farms.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.farms.lists(), { filters }] as const,
    details: () => [...queryKeys.farms.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.farms.details(), id] as const,
    stats: (id: string) => [...queryKeys.farms.detail(id), 'stats'] as const,
  },
  
  // Water quality related queries
  waterQuality: {
    all: ['waterQuality'] as const,
    lists: () => [...queryKeys.waterQuality.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.waterQuality.lists(), { filters }] as const,
    details: () => [...queryKeys.waterQuality.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.waterQuality.details(), id] as const,
    readings: (id: string) => [...queryKeys.waterQuality.detail(id), 'readings'] as const,
    alerts: (id: string) => [...queryKeys.waterQuality.detail(id), 'alerts'] as const,
  },
  
  // Ponds related queries
  ponds: {
    all: ['ponds'] as const,
    lists: () => [...queryKeys.ponds.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.ponds.lists(), { filters }] as const,
    details: () => [...queryKeys.ponds.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.ponds.details(), id] as const,
    fish: (id: string) => [...queryKeys.ponds.detail(id), 'fish'] as const,
    feeding: (id: string) => [...queryKeys.ponds.detail(id), 'feeding'] as const,
  },
  
  // Analytics related queries
  analytics: {
    all: ['analytics'] as const,
    dashboard: () => [...queryKeys.analytics.all, 'dashboard'] as const,
    reports: () => [...queryKeys.analytics.all, 'reports'] as const,
    charts: (type: string) => [...queryKeys.analytics.all, 'charts', type] as const,
  },
  
  // User related queries
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    preferences: () => [...queryKeys.user.all, 'preferences'] as const,
    notifications: () => [...queryKeys.user.all, 'notifications'] as const,
  },
} as const

// Error handling utilities
export const handleQueryError = (error: any) => {
  console.error('Query error:', error)
  
  // Return user-friendly error message
  if (error?.response?.data?.message) {
    return error.response.data.message
  }
  
  if (error?.message) {
    return error.message
  }
  
  return 'حدث خطأ غير متوقع'
}

// Success handling utilities
export const handleQuerySuccess = (data: any) => {
  console.log('Query success:', data)
  return data
}