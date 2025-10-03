import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pondsService, CreatePondRequest, UpdatePondRequest } from '@/services/ponds.service';

function getTenantId() {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem('tenant_id'); } catch { return null; }
}

export const usePonds = (page = 1, limit = 10, search = '') => {
  const tenantId = getTenantId();
  return useQuery({
    queryKey: ['ponds', tenantId, page, limit, search],
    queryFn: () => pondsService.getPonds(page, limit, search),
    enabled: !!tenantId,
  });
};

export const usePond = (id: string) => {
  const tenantId = getTenantId();
  return useQuery({
    queryKey: ['pond', tenantId, id],
    queryFn: () => pondsService.getPondById(id),
    enabled: !!id && !!tenantId,
  });
};

export const usePondStats = (id: string) => {
  const tenantId = getTenantId();
  return useQuery({
    queryKey: ['pond-stats', tenantId, id],
    queryFn: () => pondsService.getPondStats(id),
    enabled: !!id && !!tenantId,
  });
};

export const useCreatePond = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pond: CreatePondRequest) => pondsService.createPond(pond),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ponds'] });
    },
  });
};

export const useUpdatePond = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdatePondRequest) => pondsService.updatePond(payload.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ponds'] });
      queryClient.invalidateQueries({ queryKey: ['pond'] });
    },
  });
};

export const useDeletePond = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pondsService.deletePond(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ponds'] });
    },
  });
};
