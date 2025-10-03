import apiClient from '@/lib/api';

export interface Pond {
  id: string;
  tenantId: string;
  farmId: string;
  name: string;
  description?: string;
  area: number;
  depth: number;
  volume: number;
  maxCapacity: number;
  currentStockCount: number;
  shape: string;
  status: 'active' | 'inactive' | 'maintenance' | 'cleaning';
  equipment?: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
  managedById: string;
  createdAt: string;
  updatedAt: string;
  farm?: {
    id: string;
    name: string;
  };
  managedBy?: {
    id: string;
    name: string;
  };
}

export interface CreatePondRequest {
  farmId: string;
  name: string;
  description?: string;
  area: number;
  depth: number;
  maxCapacity: number;
  shape?: string;
  equipment?: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
  managedById: string;
}

export interface UpdatePondRequest extends Partial<CreatePondRequest> {
  id: string;
  status?: string;
}

export interface PondsResponse {
  data: Pond[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const pondsService = {
  async getPonds(page = 1, limit = 10, search = '', farmId?: string): Promise<PondsResponse> {
    try {
      const params: any = { page, limit };
      if (search) params.search = search;
      if (farmId) params.farmId = farmId;
      
      const response = await apiClient.get('/ponds', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch ponds:', error);
      throw error;
    }
  },

  async getPondById(id: string): Promise<Pond> {
    try {
      const response = await apiClient.get(`/ponds/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch pond:', error);
      throw error;
    }
  },

  async createPond(pond: CreatePondRequest): Promise<Pond> {
    try {
      const response = await apiClient.post('/ponds', pond);
      return response.data;
    } catch (error) {
      console.error('Failed to create pond:', error);
      throw error;
    }
  },

  async updatePond(id: string, pond: UpdatePondRequest): Promise<Pond> {
    try {
      const response = await apiClient.patch(`/ponds/${id}`, pond);
      return response.data;
    } catch (error) {
      console.error('Failed to update pond:', error);
      throw error;
    }
  },

  async deletePond(id: string): Promise<void> {
    try {
      await apiClient.delete(`/ponds/${id}`);
    } catch (error) {
      console.error('Failed to delete pond:', error);
      throw error;
    }
  },

  async getPondStats(id: string): Promise<{
    totalFish: number;
    activeCycles: number;
    waterQuality: number;
  }> {
    try {
      const response = await apiClient.get(`/ponds/${id}/stats`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch pond stats:', error);
      throw error;
    }
  },
};
