import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';

function getTenantId() {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem('tenant_id'); } catch { return null; }
}

export const useDashboardStats = () => {
  const tenantId = getTenantId();
  return useQuery({
    queryKey: ['dashboard-stats', tenantId],
    queryFn: dashboardService.getStats,
    enabled: !!tenantId,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

export const useRecentActivity = (limit = 10) => {
  const tenantId = getTenantId();
  return useQuery({
    queryKey: ['recent-activity', tenantId, limit],
    queryFn: () => dashboardService.getRecentActivity(limit),
    enabled: !!tenantId,
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
};

export const useWeather = () => {
  const tenantId = getTenantId();
  return useQuery({
    queryKey: ['weather', tenantId],
    queryFn: dashboardService.getWeather,
    enabled: !!tenantId,
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
};

export const useAlerts = () => {
  const tenantId = getTenantId();
  return useQuery({
    queryKey: ['alerts', tenantId],
    queryFn: dashboardService.getAlerts,
    enabled: !!tenantId,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};
