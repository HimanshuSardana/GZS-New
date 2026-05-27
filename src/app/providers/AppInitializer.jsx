import { useEffect } from 'react';
import useProfileStore from '@/store/profile/useProfileStore';

/**
 * AppInitializer — triggers one-time profile hydration after mount.
 *
 * Placed inside <BrowserRouter> so that navigation is available if needed,
 * but outside <AppRouter> so it runs once for the whole session rather than
 * once per route change.
 *
 * initializeProfile() is idempotent: subsequent calls are no-ops once
 * isInitialized flips to true.
 */
export default function AppInitializer({ children }) {
  const initializeProfile = useProfileStore(s => s.initializeProfile);

  useEffect(() => {
    initializeProfile();
  }, [initializeProfile]);

  return children;
}
