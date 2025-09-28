/**
 * AquaFarm Pro - Phase 1: MVP Development
 * Farm Service - API calls for farm management
 */

import { api } from './api'

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
  status?: string
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
      // Use the new mock API endpoint for testing
      const response = await api.get<{ data: Farm[] }>('/farms')
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
    const response = await api.get<Farm[]>(`${this.baseUrl}?my=true`)
    return response.data
  }

  /**
   * Search farms by name or location
   */
  async searchFarms(query: string): Promise<Farm[]> {
    const response = await api.get<Farm[]>(`${this.baseUrl}?search=${encodeURIComponent(query)}`)
    return response.data
  }

  /**
   * Get farm by ID
   */
  async getFarm(id: string): Promise<Farm> {
    const response = await api.get<Farm>(`${this.baseUrl}/${id}`)
    return response.data
  }

  /**
   * Get farm statistics
   */
  async getFarmStats(id: string): Promise<FarmStats> {
    const response = await api.get<FarmStats>(`${this.baseUrl}/${id}/stats`)
    return response.data
  }

  /**
   * Create a new farm
   */
  async createFarm(farmData: CreateFarmDto): Promise<Farm> {
    const response = await api.post<Farm>(this.baseUrl, farmData)
    return response.data
  }

  /**
   * Update farm information
   */
  async updateFarm(id: string, farmData: UpdateFarmDto): Promise<Farm> {
    const response = await api.patch<Farm>(`${this.baseUrl}/${id}`, farmData)
    return response.data
  }

  /**
   * Delete farm (set status to inactive)
   */
  async deleteFarm(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`)
  }
}

export const farmService = new FarmService()
export default farmService