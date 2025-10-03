/**
 * AquaFarm Pro - Farm Types
 * Type definitions for farm-related data
 */

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