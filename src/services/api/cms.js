import axios from 'axios';
import { applyInterceptors } from './interceptors';
import { installMockFallback } from './mockFallback';

if (import.meta.env.DEV && !import.meta.env.VITE_CMS_API_URL) {
  console.warn('[GZS] VITE_CMS_API_URL not set — using http://localhost:8081/api/cms');
}

const CMS_BASE = import.meta.env.VITE_CMS_API_URL || 'http://localhost:8081/api/cms';

const cmsClient = axios.create({
  baseURL: CMS_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 8000,
});

// Auth token injection + 401 refresh (shared with core client)
applyInterceptors(cmsClient);

// Mock fallback — no-op when VITE_USE_MOCK !== 'true'
installMockFallback(cmsClient);

// CMS API wraps every success response as { data: <payload>, meta?: {} }.
// Unwrap here so every caller receives the payload directly via r.data.
cmsClient.interceptors.response.use(
  (response) => {
    if (response.data && 'data' in response.data && !('error' in response.data)) {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  (error) => {
    if (!error.response) {
      const port = CMS_BASE.match(/:(\d+)/)?.[1] ?? '8081';
      return Promise.reject(
        Object.assign(new Error(`CMS API unavailable — check http://localhost:${port}`), {
          code: error.code,
          isCmsUnavailable: true,
        })
      );
    }
    return Promise.reject(error);
  }
);

export const cms = cmsClient;
export default cms;
