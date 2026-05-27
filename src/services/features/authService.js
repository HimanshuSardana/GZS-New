import core from '@/services/api/core';
import { CORE } from '@/services/api/endpoints';

const decodeJwtRole = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1])).role || 'user';
  } catch {
    return 'user';
  }
};

const authService = {
  // ── Login ──────────────────────────────────────────────────────────────────
  login: async ({ email, password }) => {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      if (import.meta.env.PROD) throw new Error('Mock auth is disabled in production');
      const mockData = {
        access_token: 'dummy_access_token',
        refresh_token: 'dummy_refresh_token',
        user: {
          id: 'U1',
          username: email.split('@')[0],
          email,
          display_name: 'Gzone Explorer',
          account_type: 'individual',
          avatar_url: null,
          role: 'super_admin',
        },
      };
      localStorage.setItem('gzs_access_token', mockData.access_token);
      localStorage.setItem('gzs_refresh_token', mockData.refresh_token);
      localStorage.setItem('gzs_user', JSON.stringify(mockData.user));
      return mockData;
    }

    // Core API returns { data: { access_token, refresh_token, user } } — unwrapped by interceptor
    const { data: payload } = await core.post(CORE.AUTH.LOGIN, { email, password });
    const role = payload.user?.role || decodeJwtRole(payload.access_token);
    const user = { ...payload.user, role };
    localStorage.setItem('gzs_access_token', payload.access_token);
    localStorage.setItem('gzs_refresh_token', payload.refresh_token);
    localStorage.setItem('gzs_user', JSON.stringify(user));
    return { ...payload, user };
  },

  // ── Register ───────────────────────────────────────────────────────────────
  register: async ({ username, email, password }) => {
    const { data } = await core.post(CORE.AUTH.REGISTER, { username, email, password });
    return data;
  },

  // ── Logout ─────────────────────────────────────────────────────────────────
  logout: async () => {
    try { await core.post(CORE.AUTH.LOGOUT); } catch { /* server-side logout failure is non-fatal */ }
    localStorage.removeItem('gzs_access_token');
    localStorage.removeItem('gzs_refresh_token');
    localStorage.removeItem('gzs_user');
    localStorage.removeItem('gzs_account_type');
  },

  // ── Token refresh (called by the 401 interceptor) ──────────────────────────
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('gzs_refresh_token');
    if (!refreshToken) throw new Error('No refresh token stored');
    // Use base axios to avoid the core interceptor loop; envelope must be unwrapped manually
    const { data: envelope } = await import('axios').then(m =>
      m.default.post(`${import.meta.env.VITE_CORE_API_URL || 'http://localhost:8000'}${CORE.AUTH.REFRESH}`,
        { refresh_token: refreshToken }
      )
    );
    const access_token = envelope.data?.access_token ?? envelope.access_token;
    localStorage.setItem('gzs_access_token', access_token);
    return access_token;
  },

  // ── Current user (server-side) ─────────────────────────────────────────────
  me: async () => {
    const { data } = await core.get(CORE.USER.ME);
    return data;
  },

  // ── Email verification ─────────────────────────────────────────────────────
  verifyEmail: (token) =>
    core.post(CORE.AUTH.VERIFY_EMAIL, { token }).then(r => r.data),

  resendVerification: () =>
    core.post(CORE.AUTH.VERIFY_EMAIL, { action: 'resend' }).then(r => r.data),

  // ── Password reset ─────────────────────────────────────────────────────────
  forgotPassword: (email) =>
    core.post(CORE.AUTH.FORGOT_PASSWORD, { email }).then(r => r.data),

  resetPassword: (token, password) =>
    core.post(CORE.AUTH.RESET_PASSWORD, { token, password }).then(r => r.data),

  // ── Local helpers ──────────────────────────────────────────────────────────
  isAuthenticated: () => Boolean(localStorage.getItem('gzs_access_token')),

  getCurrentUser: () => {
    try { return JSON.parse(localStorage.getItem('gzs_user')); } catch { return null; }
  },
};

export default authService;
