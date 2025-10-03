/**
 * AquaFarm Pro - Mock Service
 * Mock data and services for development without backend
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

// Mock data
const mockFarms: Farm[] = [
  {
    id: '1',
    tenantId: 'tenant-1',
    ownerId: 'user-1',
    name: 'مزرعة الأسماك الرئيسية',
    location: 'الرياض، المملكة العربية السعودية',
    latitude: 24.7136,
    longitude: 46.6753,
    totalArea: 5000,
    description: 'مزرعة متخصصة في تربية البلطي والسلمون',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    owner: {
      id: 'user-1',
      name: 'أحمد محمد',
      email: 'ahmed@aquafarm.com'
    },
    ponds: [
      { id: 'pond-1', name: 'الحوض الرئيسي', status: 'healthy' },
      { id: 'pond-2', name: 'حوض التربية', status: 'warning' },
      { id: 'pond-3', name: 'حوض الحضانة', status: 'danger' }
    ],
    pondCount: 3,
    totalWaterVolume: 15000
  },
  {
    id: '2',
    tenantId: 'tenant-1',
    ownerId: 'user-1',
    name: 'مزرعة الأسماك الشمالية',
    location: 'الدمام، المملكة العربية السعودية',
    latitude: 26.4207,
    longitude: 50.0888,
    totalArea: 3000,
    description: 'مزرعة متخصصة في تربية التراوت',
    status: 'active',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
    owner: {
      id: 'user-1',
      name: 'أحمد محمد',
      email: 'ahmed@aquafarm.com'
    },
    ponds: [
      { id: 'pond-4', name: 'حوض التراوت', status: 'healthy' },
      { id: 'pond-5', name: 'حوض التفريخ', status: 'healthy' }
    ],
    pondCount: 2,
    totalWaterVolume: 8000
  }
]

const mockFarmStats: FarmStats[] = [
  {
    farm: {
      id: '1',
      name: 'مزرعة الأسماك الرئيسية',
      totalArea: 5000,
      status: 'active'
    },
    ponds: {
      total: 3,
      active: 2,
      totalVolume: 15000
    },
    fish: {
      totalBatches: 5,
      totalFish: 2500
    },
    waterQuality: {
      totalReadings: 150,
      lastReading: {
        id: 'reading-1',
        temperature: 24.5,
        ph: 7.2,
        dissolvedOxygen: 8.5,
        recordedAt: '2024-01-15T14:30:00Z'
      }
    }
  },
  {
    farm: {
      id: '2',
      name: 'مزرعة الأسماك الشمالية',
      totalArea: 3000,
      status: 'active'
    },
    ponds: {
      total: 2,
      active: 2,
      totalVolume: 8000
    },
    fish: {
      totalBatches: 3,
      totalFish: 1200
    },
    waterQuality: {
      totalReadings: 80,
      lastReading: {
        id: 'reading-2',
        temperature: 22.8,
        ph: 7.0,
        dissolvedOxygen: 7.8,
        recordedAt: '2024-01-15T13:45:00Z'
      }
    }
  }
]

class MockFarmService {
  private baseUrl = '/farms'

  /**
   * Simulate API delay
   */
  private async delay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get all farms in current tenant
   */
  async getAllFarms(): Promise<Farm[]> {
    await this.delay()
    return [...mockFarms]
  }

  /**
   * Get farms owned by current user
   */
  async getMyFarms(): Promise<Farm[]> {
    await this.delay()
    return [...mockFarms]
  }

  /**
   * Search farms by name or location
   */
  async searchFarms(query: string): Promise<Farm[]> {
    await this.delay()
    const searchTerm = query.toLowerCase()
    return mockFarms.filter(farm => 
      farm.name.toLowerCase().includes(searchTerm) ||
      farm.location?.toLowerCase().includes(searchTerm)
    )
  }

  /**
   * Get farm by ID
   */
  async getFarm(id: string): Promise<Farm> {
    await this.delay()
    const farm = mockFarms.find(f => f.id === id)
    if (!farm) {
      throw new Error('المزرعة غير موجودة')
    }
    return farm
  }

  /**
   * Get farm statistics
   */
  async getFarmStats(id: string): Promise<FarmStats> {
    await this.delay()
    const stats = mockFarmStats.find(s => s.farm.id === id)
    if (!stats) {
      throw new Error('إحصائيات المزرعة غير متوفرة')
    }
    return stats
  }

  /**
   * Create a new farm
   */
  async createFarm(farmData: CreateFarmDto): Promise<Farm> {
    await this.delay()
    const newFarm: Farm = {
      id: `farm-${Date.now()}`,
      tenantId: 'tenant-1',
      ownerId: 'user-1',
      name: farmData.name,
      location: farmData.location,
      latitude: farmData.latitude,
      longitude: farmData.longitude,
      totalArea: farmData.totalArea,
      description: farmData.description,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      owner: {
        id: 'user-1',
        name: 'أحمد محمد',
        email: 'ahmed@aquafarm.com'
      },
      ponds: [],
      pondCount: 0,
      totalWaterVolume: 0
    }
    
    mockFarms.push(newFarm)
    return newFarm
  }

  /**
   * Update farm information
   */
  async updateFarm(id: string, farmData: UpdateFarmDto): Promise<Farm> {
    await this.delay()
    const farmIndex = mockFarms.findIndex(f => f.id === id)
    if (farmIndex === -1) {
      throw new Error('المزرعة غير موجودة')
    }
    
    mockFarms[farmIndex] = {
      ...mockFarms[farmIndex],
      ...farmData,
      updatedAt: new Date().toISOString()
    }
    
    return mockFarms[farmIndex]
  }

  /**
   * Delete farm (set status to inactive)
   */
  async deleteFarm(id: string): Promise<void> {
    await this.delay()
    const farmIndex = mockFarms.findIndex(f => f.id === id)
    if (farmIndex === -1) {
      throw new Error('المزرعة غير موجودة')
    }
    
    mockFarms[farmIndex].status = 'inactive'
    mockFarms[farmIndex].updatedAt = new Date().toISOString()
  }
}

export const mockFarmService = new MockFarmService()
export default mockFarmService
