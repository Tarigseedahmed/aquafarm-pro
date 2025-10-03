/**
 * AquaFarm Pro - Farms Hooks
 * Custom hooks for farm-related queries using TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { farmService } from '@/services/farm.service'
import { queryKeys, handleQueryError, handleQuerySuccess } from '@/lib/query-client'
import { toast } from 'react-hot-toast'
import { Farm, CreateFarmDto, UpdateFarmDto } from '@/types/farm.types'

// Hook to get all farms
export function useFarms(filters?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.farms.list(filters || {}),
    queryFn: async () => {
      try {
        const farms = await farmService.getAllFarms()
        return handleQuerySuccess(farms)
      } catch (error) {
        const errorMessage = handleQueryError(error)
        toast.error(errorMessage)
        throw error
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to get user's farms
export function useMyFarms() {
  return useQuery({
    queryKey: queryKeys.farms.list({ my: true }),
    queryFn: async () => {
      try {
        const farms = await farmService.getMyFarms()
        return handleQuerySuccess(farms)
      } catch (error) {
        const errorMessage = handleQueryError(error)
        toast.error(errorMessage)
        throw error
      }
    },
    staleTime: 2 * 60 * 1000,
  })
}

// Hook to search farms
export function useSearchFarms(query: string) {
  return useQuery({
    queryKey: queryKeys.farms.list({ search: query }),
    queryFn: async () => {
      try {
        const farms = await farmService.searchFarms(query)
        return handleQuerySuccess(farms)
      } catch (error) {
        const errorMessage = handleQueryError(error)
        toast.error(errorMessage)
        throw error
      }
    },
    enabled: query.length > 0, // Only run when there's a search query
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

// Hook to get a single farm
export function useFarm(id: string) {
  return useQuery({
    queryKey: queryKeys.farms.detail(id),
    queryFn: async () => {
      try {
        const farm = await farmService.getFarm(id)
        return handleQuerySuccess(farm)
      } catch (error) {
        const errorMessage = handleQueryError(error)
        toast.error(errorMessage)
        throw error
      }
    },
    enabled: !!id, // Only run when ID is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to get farm statistics
export function useFarmStats(id: string) {
  return useQuery({
    queryKey: queryKeys.farms.stats(id),
    queryFn: async () => {
      try {
        const stats = await farmService.getFarmStats(id)
        return handleQuerySuccess(stats)
      } catch (error) {
        const errorMessage = handleQueryError(error)
        toast.error(errorMessage)
        throw error
      }
    },
    enabled: !!id,
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

// Hook to create a farm
export function useCreateFarm() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (farmData: CreateFarmDto) => {
      try {
        const farm = await farmService.createFarm(farmData)
        return handleQuerySuccess(farm)
      } catch (error) {
        const errorMessage = handleQueryError(error)
        toast.error(errorMessage)
        throw error
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch farms list
      queryClient.invalidateQueries({ queryKey: queryKeys.farms.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.farms.all })
      
      toast.success('تم إنشاء المزرعة بنجاح')
    },
    onError: (error) => {
      console.error('Create farm error:', error)
    },
  })
}

// Hook to update a farm
export function useUpdateFarm() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, farmData }: { id: string; farmData: UpdateFarmDto }) => {
      try {
        const farm = await farmService.updateFarm(id, farmData)
        return handleQuerySuccess(farm)
      } catch (error) {
        const errorMessage = handleQueryError(error)
        toast.error(errorMessage)
        throw error
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate specific farm queries
      queryClient.invalidateQueries({ queryKey: queryKeys.farms.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.farms.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.farms.all })
      
      toast.success('تم تحديث المزرعة بنجاح')
    },
    onError: (error) => {
      console.error('Update farm error:', error)
    },
  })
}

// Hook to delete a farm
export function useDeleteFarm() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await farmService.deleteFarm(id)
        return handleQuerySuccess(null)
      } catch (error) {
        const errorMessage = handleQueryError(error)
        toast.error(errorMessage)
        throw error
      }
    },
    onSuccess: (data, id) => {
      // Remove farm from cache
      queryClient.removeQueries({ queryKey: queryKeys.farms.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.farms.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.farms.all })
      
      toast.success('تم حذف المزرعة بنجاح')
    },
    onError: (error) => {
      console.error('Delete farm error:', error)
    },
  })
}
