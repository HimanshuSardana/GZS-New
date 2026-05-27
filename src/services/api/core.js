import axios from 'axios';
import { applyInterceptors } from './interceptors';
import { installMockFallback } from './mockFallback';

if (import.meta.env.DEV && !import.meta.env.VITE_CORE_API_URL) {
  console.warn('[GZS] VITE_CORE_API_URL not set — using http://localhost:8000');
}

const CORE_BASE = import.meta.env.VITE_CORE_API_URL || 'http://localhost:8000';

const coreClient = axios.create({
  baseURL: CORE_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Injects Bearer token on every request + handles 401 refresh with clearUser on failure.
// Refresh logic lives in interceptors.js and lazy-imports useProfileStore to avoid the
// circular: core → useProfileStore → profileService → core.
applyInterceptors(coreClient);

// Mock fallback — no-op when VITE_USE_MOCK !== 'true'
installMockFallback(coreClient);

// Core API wraps every success response as { data: <payload>, meta: {}, error: null }.
// Unwrap here so every caller receives the inner payload directly via r.data.
coreClient.interceptors.response.use(
  (response) => {
    if (response.data && 'data' in response.data && 'error' in response.data) {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  (error) => {
    if (!error.response) {
      const port = CORE_BASE.match(/:(\d+)/)?.[1] ?? '8000';
      return Promise.reject(
        Object.assign(new Error(`Core API unavailable — check http://localhost:${port}`), {
          code: error.code,
          isCoreUnavailable: true,
        })
      );
    }
    return Promise.reject(error);
  }
);

export const core = coreClient;
export default core;
