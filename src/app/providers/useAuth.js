/**
 * useAuth — thin selector over useProfileStore.
 *
 * Provides the same API surface that AuthProvider/AuthContext used to expose
 * so all callsites remain import-identical:
 *   import { useAuth } from '@/app/providers/useAuth';
 *
 * Source of truth: Zustand (useProfileStore + useAdminAuthStore).
 * AuthContext and AuthProvider are no longer used and have been stubbed out.
 */
import useProfileStore from '@/store/profile/useProfileStore';

export const useAuth = () => {
  const user = useProfileStore(s => s.user);
  const isAuthenticated = useProfileStore(s => s.isAuthenticated);
  const isLoading = useProfileStore(s => s.isLoading);

  const isAdmin =
    user?.is_staff === true ||
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'admin' ||
    user?.role === 'super_admin';

  return {
    user,
    isAuthenticated,
    loading: isLoading,   // preserves legacy AuthProvider API name
    isAdmin,
  };
};

export default useAuth;
