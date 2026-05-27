import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import authService from '../features/authService';
import useProfileStore from '@/store/profile/useProfileStore';

export function useAuthActions() {
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      // Sync the Zustand store so isAuthenticated flips immediately in-session
      // without waiting for a page reload to re-run the auto-hydrate.
      if (data?.user) {
        useProfileStore.getState().setUser(data.user);
      }
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: authService.register,
  });

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      // Reset Zustand state (also removes gzs_account_type from localStorage).
      useProfileStore.getState().clearUser();
      queryClient.clear();
      window.location.href = '/login';
    },
  });

  return {
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    loginError: loginMutation.error,
  };
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['me'],
    queryFn: authService.me,
    enabled: authService.isAuthenticated(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
