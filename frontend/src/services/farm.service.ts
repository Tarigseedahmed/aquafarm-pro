/**
 * AquaFarm Pro - Phase 1: MVP Development
 * Farm Service - API calls for farm management
 */

import { api } from './api'
import { mockFarmService } from './mock.service'
import { DEVELOPMENT_CONFIG } from '../config/development'

export interface Farm {
  id: string
  tenantId: string
  ownerId: string
  name: string
  location?: string
  latitude?: number
  longitude?: number
  totalArea?: number
  description?: string
  status: 'active' | 'inactive' | 'maintenance'
  createdAt: string
  updatedAt: string
  owner?: {
    id: string
    name: string
    email: string
  }
  ponds?: Array<{
    id: string
    name: string
    status: string
  }>
  pondCount?: number
  totalWaterVolume?: number
}

export interface CreateFarmDto {
  name: string
  location?: string
  latitude?: number
  longitude?: number
  totalArea?: number
  description?: string
}

export interface UpdateFarmDto extends Partial<CreateFarmDto> {
  status?: 'active' | 'inactive' | 'maintenance'
}

export interface FarmStats {
  farm: {
    id: string
    name: string
    totalArea?: number
    status: string
  }
  ponds: {
    total: number
    active: number
    totalVolume: number
  }
  fish: {
    totalBatches: number
    totalFish: number
  }
  waterQuality: {
    totalReadings: number
    lastReading?: {
      id: string
      temperature?: number
      ph?: number
      dissolvedOxygen?: number
      recordedAt: string
    }
  }
}

class FarmService {
  private baseUrl = '/farms'

  /**
   * Get all farms in current tenant
   */
  async getAllFarms(): Promise<Farm[]> {
    try {
      if (DEVELOPMENT_CONFIG.USE_MOCK_SERVICE) {
        console.log('🔧 استخدام Mock Service للتطوير')
        return await mockFarmService.getAllFarms()
      }
      
      const response = await api.get<{ data: Farm[]; total: number }>('/farms')
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch farms:', error)
      throw error
    }
  }

  /**
   * Get farms owned by current user
   */
  async getMyFarms(): Promise<Farm[]> {
    try {
      if (DEVELOPMENT_CONFIG.USE_MOCK_SERVICE) {
        console.log('🔧 استخدام Mock Service للتطوير')
        return await mockFarmService.getMyFarms()
      }
      
      const response = await api.get<{ data: Farm[]; total: number }>(`${this.baseUrl}?my=true`)
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch my farms:', error)
      throw error
    }
  }

  /**
   * Search farms by name or location
   */
  async searchFarms(query: string): Promise<Farm[]> {
    try {
      if (DEVELOPMENT_CONFIG.USE_MOCK_SERVICE) {
        console.log('🔧 استخدام Mock Service للتطوير')
        return await mockFarmService.searchFarms(query)
      }
      
      const response = await api.get<{ data: Farm[]; total: number }>(`${this.baseUrl}?search=${encodeURIComponent(query)}`)
      return response.data.data || []
    } catch (error) {
      console.error('Failed to search farms:', error)
      throw error
    }
  }

  /**
   * Get farm by ID
   */
  async getFarm(id: string): Promise<Farm> {
    try {
      // Use mock service for development
      return await mockFarmService.getFarm(id)
    } catch (error) {
      console.error('Failed to fetch farm:', error)
      throw error
    }
  }

  /**
   * Get farm statistics
   */
  async getFarmStats(id: string): Promise<FarmStats> {
    try {
      // Use mock service for development
      return await mockFarmService.getFarmStats(id)
    } catch (error) {
      console.error('Failed to fetch farm stats:', error)
      throw error
    }
  }

  /**
   * Create a new farm
   */
  async createFarm(farmData: CreateFarmDto): Promise<Farm> {
    try {
      // Use mock service for development
      return await mockFarmService.createFarm(farmData)
    } catch (error) {
      console.error('Failed to create farm:', error)
      throw error
    }
  }

  /**
   * Update farm information
   */
  async updateFarm(id: string, farmData: UpdateFarmDto): Promise<Farm> {
    try {
      // Use mock service for development
      return await mockFarmService.updateFarm(id, farmData)
    } catch (error) {
      console.error('Failed to update farm:', error)
      throw error
    }
  }

  /**
   * Delete farm (set status to inactive)
   */
  async deleteFarm(id: string): Promise<void> {
    try {
      // Use mock service for development
      await mockFarmService.deleteFarm(id)
    } catch (error) {
      console.error('Failed to delete farm:', error)
      throw error
    }
  }
}

export const farmService = new FarmService()
export default farmService