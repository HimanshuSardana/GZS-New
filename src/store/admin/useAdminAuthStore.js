import { create } from 'zustand';

const decodeJwtRole = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1])).role || 'user';
  } catch {
    return 'user';
  }
};

// Keys match the canonical namespace established in storage.js (gzs_* prefix).
const useAdminAuthStore = create((set) => ({
  user: null,
  isLoading: false,
  isHydrated: false,

  // Called explicitly from AdminAuthGuard's useEffect — NOT at module load time.
  // A setTimeout(hydrate, 0) inside create() fires as a module-load side-effect,
  // which is unpredictable and breaks SSR/test environments. useEffect is the
  // correct place for first-render localStorage reads.
  hydrate: () => {
    const raw = localStorage.getItem('gzs_user');
    let user = null;
    try {
      user = raw ? JSON.parse(raw) : null;
    } catch {
      user = null;
    }
    if (user && !user.role) {
      const token = localStorage.getItem('gzs_access_token');
      if (token) user = { ...user, role: decodeJwtRole(token) };
    }
    set({ user, isHydrated: true });
  },

  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
  logout: () => {
    localStorage.removeItem('gzs_access_token');
    localStorage.removeItem('gzs_refresh_token');
    localStorage.removeItem('gzs_user');
    set({ user: null });
  },
}));

export default useAdminAuthStore;
