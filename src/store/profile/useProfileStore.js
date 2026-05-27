import { create } from 'zustand';
import profileService from '@/services/features/profileService';

// No circular dependency: this store imports profileService → core → interceptors.
// The interceptors file lazy-imports THIS store only on 401 failure (at runtime,
// not at module-load time), so the module graph is acyclic.

const useProfileStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  user: (() => {
    try { return JSON.parse(localStorage.getItem('gzs_user')); } catch { return null; }
  })(),
  profile: null,
  subProfiles: [],
  activeSubProfile: null,
  // If a token is already in storage, start in loading state so ProtectedRoute
  // shows a spinner while AppInitializer's useEffect calls initializeProfile().
  isAuthenticated: Boolean(localStorage.getItem('gzs_access_token')),
  isLoading: Boolean(localStorage.getItem('gzs_access_token')),
  isInitialized: false,

  // Kept from old store — used by skill-related components
  skills: [],
  availability: { hiring: true, collab: true, events: false },
  accountType: localStorage.getItem('gzs_account_type') || null,

  // ── Auth actions ────────────────────────────────────────────────────────────

  // Called once from AppInitializer on first mount. Idempotent: if the store
  // is already initialized (or if no token exists) it returns immediately.
  // Must NOT be called inside create() — that fires at module-load time,
  // before any component mounts, making errors invisible and logout untraceable.
  initializeProfile: async () => {
    if (get().isInitialized) return;

    const token = localStorage.getItem('gzs_access_token');
    if (!token) {
      set({ isLoading: false, isInitialized: true });
      return;
    }

    set({ isLoading: true });
    try {
      const profile = await profileService.getMyProfile();
      const subProfiles = await profileService.getMySubProfiles();
      const storedUser = (() => {
        try { return JSON.parse(localStorage.getItem('gzs_user')); } catch { return null; }
      })();
      set({
        profile,
        subProfiles: subProfiles ?? [],
        user: storedUser,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
      });
    } catch (err) {
      console.warn(
        '[useProfileStore] initializeProfile: token present but profile fetch failed — clearing session.',
        err,
      );
      get().clearUser();
      // clearUser() resets isLoading but not isInitialized; set it so we don't retry.
      set({ isInitialized: true });
    }
  },

  setUser: (user) => {
    localStorage.setItem('gzs_user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  clearUser: () => {
    localStorage.removeItem('gzs_access_token');
    localStorage.removeItem('gzs_refresh_token');
    localStorage.removeItem('gzs_user');
    localStorage.removeItem('gzs_account_type');
    set({
      user: null,
      profile: null,
      subProfiles: [],
      activeSubProfile: null,
      skills: [],
      isAuthenticated: false,
      isLoading: false,
      accountType: null,
    });
  },

  // ── Profile actions ─────────────────────────────────────────────────────────
  setProfile: (profile) => set({ profile }),

  setSubProfiles: (subProfiles) => set({ subProfiles }),

  setActiveSubProfile: (profileId) => set({ activeSubProfile: profileId }),

  refreshProfile: async () => {
    try {
      const profile = await profileService.getMyProfile();
      const subProfiles = await profileService.getMySubProfiles();
      set({ profile, subProfiles: subProfiles ?? [] });
    } catch (err) {
      console.warn('[useProfileStore] refreshProfile failed:', err);
    }
  },

  // ── Account type ─────────────────────────────────────────────────────────────
  setAccountType: (type) => {
    localStorage.setItem('gzs_account_type', type);
    set({ accountType: type });
  },

  // ── Availability ─────────────────────────────────────────────────────────────
  toggleAvailability: (key) => set((state) => ({
    availability: { ...state.availability, [key]: !state.availability[key] },
  })),

  // ── Local skill helpers (UI state only — source of truth is the API) ─────────
  addSkill: (skill) => set((state) => ({
    skills: [...state.skills, { ...skill, id: Date.now(), verified: false, verification_status: 'unverified' }],
  })),

  verifySkill: (skillId) => set((state) => ({
    skills: state.skills.map(s =>
      s.id === skillId ? { ...s, verified: true, verification_status: 'verified' } : s
    ),
  })),

  removeSkill: (skillId) => set((state) => ({
    skills: state.skills.filter(s => s.id !== skillId),
  })),

  getSkillsByProfile: (profileId) => get().skills.filter(s => s.profileId === profileId),

  getVerifiedCount: (profileId = null) => {
    const { skills } = get();
    const relevant = profileId ? skills.filter(s => s.profileId === profileId) : skills;
    return relevant.filter(s => s.verified || s.verification_status === 'verified').length;
  },
}));

export default useProfileStore;
