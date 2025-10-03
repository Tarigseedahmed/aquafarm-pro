import apiClient from '@/lib/api';

export interface DashboardStats {
  totalPonds: number;
  activeCycles: number;
  totalFish: number;
  waterQuality: number;
  mortalityRate: number;
  feedConsumption: number;
}

export interface RecentActivity {
  id: string;
  type: 'pond_created' | 'measurement_added' | 'cycle_started' | 'cycle_ended' | 'alert_triggered';
  message: string;
  timestamp: string;
  pond_id?: string;
  pond_name?: string;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  condition: string;
  icon: string;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await apiClient.get('/dashboard/stats');
    return response.data;
  },

  async getRecentActivity(limit = 10): Promise<RecentActivity[]> {
    const response = await apiClient.get('/dashboard/activity', {
      params: { limit },
    });
    return response.data;
  },

  async getWeather(): Promise<WeatherData> {
    const response = await apiClient.get('/dashboard/weather');
    return response.data;
  },

  async getAlerts(): Promise<{
    id: string;
    type: 'water_quality' | 'feeding_time' | 'mortality' | 'maintenance';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    pond_id?: string;
    pond_name?: string;
    timestamp: string;
  }[]> {
    const response = await apiClient.get('/dashboard/alerts');
    return response.data;
  },
};
