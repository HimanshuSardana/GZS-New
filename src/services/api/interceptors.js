import axios from 'axios';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => error ? prom.reject(error) : prom.resolve(token));
  failedQueue = [];
};

const getPort = (config) => {
  const url = config?.baseURL || config?.url || '';
  const match = url.match(/:(\d+)/);
  return match ? match[1] : 'unknown';
};

export const applyInterceptors = (client) => {
  // Request interceptor to inject Bearer token
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('gzs_access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // Response interceptor for 401 token refresh + network error warnings
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Network error (backend offline) — no response object
      if (!error.response) {
        const port = getPort(originalRequest);
        console.warn(`⚠️ [API] Network error — is the backend running on port ${port}?`);
        return Promise.reject(error);
      }

      // Never run the refresh flow on auth endpoints — their 401s are credential errors
      const isAuthEndpoint = originalRequest?.url?.includes('/auth/');

      // If 401 and not a retry, attempt to refresh token
      if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return client(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = localStorage.getItem('gzs_refresh_token');
          // Use base axios for refresh to avoid interceptor loop
          const { data } = await axios.post(`${import.meta.env.VITE_CORE_API_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          // Core API wraps refresh response: { data: { access_token } }
          const newToken = data.data?.access_token ?? data.access_token;
          localStorage.setItem('gzs_access_token', newToken);
          processQueue(null, newToken);

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return client(originalRequest);
        } catch (err) {
          processQueue(err, null);
          localStorage.removeItem('gzs_access_token');
          localStorage.removeItem('gzs_refresh_token');
          localStorage.removeItem('gzs_user');
          // Lazy-import to avoid circular dependency (store → profileService → core → interceptors)
          import('@/store/profile/useProfileStore')
            .then(({ default: useProfileStore }) => useProfileStore.getState().clearUser())
            .catch(() => {})
            .finally(() => { window.location.href = '/login'; });
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};
