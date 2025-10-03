/**
 * AquaFarm Pro - Farms Hooks Tests
 * Test coverage for farm-related hooks
 */

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useFarms, useFarm, useCreateFarm, useUpdateFarm, useDeleteFarm } from '../useFarms'
import { farmService } from '@/services/farm.service'

// Mock the farm service
jest.mock('@/services/farm.service', () => ({
  farmService: {
    getAllFarms: jest.fn(),
    getFarm: jest.fn(),
    createFarm: jest.fn(),
    updateFarm: jest.fn(),
    deleteFarm: jest.fn(),
  },
}))

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useFarms', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch all farms successfully', async () => {
    const mockFarms = [
      { id: '1', name: 'Farm 1', status: 'active' },
      { id: '2', name: 'Farm 2', status: 'active' },
    ]
    
    ;(farmService.getAllFarms as jest.Mock).mockResolvedValue(mockFarms)

    const { result } = renderHook(() => useFarms(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockFarms)
    expect(farmService.getAllFarms).toHaveBeenCalledTimes(1)
  })

  it('should handle fetch farms error', async () => {
    const error = new Error('Failed to fetch farms')
    ;(farmService.getAllFarms as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useFarms(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBe(error)
  })
})

describe('useFarm', () => {
  it('should fetch single farm successfully', async () => {
    const mockFarm = { id: '1', name: 'Farm 1', status: 'active' }
    ;(farmService.getFarm as jest.Mock).mockResolvedValue(mockFarm)

    const { result } = renderHook(() => useFarm('1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockFarm)
    expect(farmService.getFarm).toHaveBeenCalledWith('1')
  })

  it('should not fetch when id is empty', () => {
    const { result } = renderHook(() => useFarm(''), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(false)
    expect(farmService.getFarm).not.toHaveBeenCalled()
  })
})

describe('useCreateFarm', () => {
  it('should create farm successfully', async () => {
    const mockFarm = { id: '1', name: 'New Farm', status: 'active' }
    const farmData = { name: 'New Farm', location: 'Test Location' }
    
    ;(farmService.createFarm as jest.Mock).mockResolvedValue(mockFarm)

    const { result } = renderHook(() => useCreateFarm(), {
      wrapper: createWrapper(),
    })

    result.current.mutate(farmData)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(farmService.createFarm).toHaveBeenCalledWith(farmData)
  })

  it('should handle create farm error', async () => {
    const error = new Error('Failed to create farm')
    const farmData = { name: 'New Farm', location: 'Test Location' }
    
    ;(farmService.createFarm as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useCreateFarm(), {
      wrapper: createWrapper(),
    })

    result.current.mutate(farmData)

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBe(error)
  })
})

describe('useUpdateFarm', () => {
  it('should update farm successfully', async () => {
    const mockFarm = { id: '1', name: 'Updated Farm', status: 'active' }
    const updateData = { name: 'Updated Farm' }
    
    ;(farmService.updateFarm as jest.Mock).mockResolvedValue(mockFarm)

    const { result } = renderHook(() => useUpdateFarm(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ id: '1', farmData: updateData })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(farmService.updateFarm).toHaveBeenCalledWith('1', updateData)
  })
})

describe('useDeleteFarm', () => {
  it('should delete farm successfully', async () => {
    ;(farmService.deleteFarm as jest.Mock).mockResolvedValue(undefined)

    const { result } = renderHook(() => useDeleteFarm(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('1')

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(farmService.deleteFarm).toHaveBeenCalledWith('1')
  })
})
