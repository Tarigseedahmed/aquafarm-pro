import apiClient from '@/lib/api';

export interface Pond {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  capacity_kg?: number;
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePondRequest {
  code: string;
  name: string;
  capacity_kg?: number;
  location?: string;
  notes?: string;
}

export interface UpdatePondRequest extends Partial<CreatePondRequest> {
  id: string;
}

export interface PondsResponse {
  data: Pond[];
  total: number;
  page: number;
  limit: number;
}

export const pondsService = {
  async getPonds(page = 1, limit = 10, search = ''): Promise<PondsResponse> {
    const response = await apiClient.get('/ponds', {
      params: { page, limit, search },
    });
    return response.data;
  },

  async getPondById(id: string): Promise<Pond> {
    const response = await apiClient.get(`/ponds/${id}`);
    return response.data;
  },

  async createPond(pond: CreatePondRequest): Promise<Pond> {
    const response = await apiClient.post('/ponds', pond);
    return response.data;
  },

  async updatePond(id: string, pond: UpdatePondRequest): Promise<Pond> {
    const response = await apiClient.put(`/ponds/${id}`, pond);
    return response.data;
  },

  async deletePond(id: string): Promise<void> {
    await apiClient.delete(`/ponds/${id}`);
  },

  async getPondStats(id: string): Promise<{
    totalFish: number;
    activeCycles: number;
    waterQuality: number;
  }> {
    const response = await apiClient.get(`/ponds/${id}/stats`);
    return response.data;
  },
};
