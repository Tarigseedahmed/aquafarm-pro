import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService, LoginRequest } from '@/services/auth.service';
import { setTenantId } from '@/lib/api';

export const useAuth = () => {
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('tenant_id', data.user.tenant_id);
      setTenantId(data.user.tenant_id);
      queryClient.setQueryData(['user'], data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('tenant_id');
      setTenantId(null);
      queryClient.clear();
    },
  });

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['user'],
    queryFn: authService.getCurrentUser,
    enabled: !!localStorage.getItem('access_token'),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Initialize tenant id from storage on hook usage
  if (typeof window !== 'undefined' && !user && localStorage.getItem('tenant_id')) {
    setTenantId(localStorage.getItem('tenant_id'));
  }

  const isAuthenticated = !!user && !!localStorage.getItem('access_token');

  return {
    user,
    isAuthenticated,
    isUserLoading,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
  };
};
