/**
 * adminApi.js — Axios instance for admin API calls.
 *
 * - Injects Authorization: Bearer {token} on every request
 * - On 401: clears auth, redirects to /login?admin=true&reason=session_expired
 * - On 403: does NOT redirect — pages handle access-denied UI themselves
 *
 * Usage:
 *   import adminApi, { adminQueryFn } from '@/services/api/adminApi';
 *
 *   // Direct call:
 *   const data = await adminApi.post('/admin/users/usr-001/suspend', payload).then(r => r.data);
 *
 *   // React Query:
 *   useQuery({ queryKey: ['admin', 'stats'], queryFn: adminQueryFn('/admin/dashboard/stats') })
 */
import axios from 'axios';

const adminApi = axios.create({
  baseURL: import.meta.env.VITE_ADMIN_API_URL || import.meta.env.VITE_API_URL || '',
  timeout: 15_000,
});

adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gzs_access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('gzs_access_token');
      localStorage.removeItem('gzs_refresh_token');
      localStorage.removeItem('gzs_user');
      window.location.href = '/login?admin=true&reason=session_expired';
    }
    return Promise.reject(error);
  },
);

/**
 * Convenience wrapper for React Query queryFn.
 * Unwraps the FastAPI { data: {...} } envelope automatically.
 */
export const adminQueryFn = (path, params) => () =>
  adminApi.get(path, { params }).then((r) => r.data?.data ?? r.data);

export default adminApi;
