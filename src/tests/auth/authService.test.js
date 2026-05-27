import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the core axios client so the tests are unit tests that do not touch
// the interceptor chain or the network for login/logout.
// refreshToken() uses raw axios (dynamic import), which MSW intercepts instead.
vi.mock('@/services/api/core', () => ({
  default: { post: vi.fn(), get: vi.fn(), delete: vi.fn() },
  core:    { post: vi.fn(), get: vi.fn(), delete: vi.fn() },
}));

import authService from '@/services/features/authService';
import core from '@/services/api/core';

beforeEach(() => {
  vi.clearAllMocks();
});

// ── login ─────────────────────────────────────────────────────────────────

describe('authService.login', () => {
  it('stores access_token, refresh_token, and user in localStorage on success', async () => {
    core.post.mockResolvedValueOnce({
      data: {
        access_token: 'access_123',
        refresh_token: 'refresh_456',
        user: { id: 'u1', email: 'test@gzone.gg', role: 'user' },
      },
    });

    await authService.login({ email: 'test@gzone.gg', password: 'hunter2' });

    expect(localStorage.getItem('gzs_access_token')).toBe('access_123');
    expect(localStorage.getItem('gzs_refresh_token')).toBe('refresh_456');
    const stored = JSON.parse(localStorage.getItem('gzs_user'));
    expect(stored.email).toBe('test@gzone.gg');
    expect(stored.role).toBe('user');
  });

  it('falls back to JWT role when user.role is absent', async () => {
    // Craft a minimal JWT where payload.role = 'admin'
    const payload = btoa(JSON.stringify({ role: 'admin' }));
    const fakeJwt = `header.${payload}.sig`;

    core.post.mockResolvedValueOnce({
      data: {
        access_token: fakeJwt,
        refresh_token: 'ref',
        user: { id: 'u2', email: 'admin@gzone.gg' },
      },
    });

    await authService.login({ email: 'admin@gzone.gg', password: 'pass' });

    const stored = JSON.parse(localStorage.getItem('gzs_user'));
    expect(stored.role).toBe('admin');
  });

  it('returns the combined payload including the enriched user', async () => {
    core.post.mockResolvedValueOnce({
      data: {
        access_token: 'tok',
        refresh_token: 'ref',
        user: { id: 'u3', email: 'x@y.com', role: 'user' },
      },
    });

    const result = await authService.login({ email: 'x@y.com', password: 'p' });

    expect(result.access_token).toBe('tok');
    expect(result.user.role).toBe('user');
  });
});

// ── refreshToken ──────────────────────────────────────────────────────────

describe('authService.refreshToken', () => {
  // MSW intercepts the raw axios POST to http://localhost:8000/auth/refresh
  // and returns { data: { access_token: 'refreshed_token' } } (see handlers.js).

  it('updates gzs_access_token in localStorage with the token from the server', async () => {
    localStorage.setItem('gzs_refresh_token', 'old_refresh_token');

    await authService.refreshToken();

    expect(localStorage.getItem('gzs_access_token')).toBe('refreshed_token');
  });

  it('throws immediately when no refresh token is stored', async () => {
    await expect(authService.refreshToken()).rejects.toThrow('No refresh token stored');
  });
});

// ── logout ────────────────────────────────────────────────────────────────

describe('authService.logout', () => {
  const seedStorage = () => {
    localStorage.setItem('gzs_access_token', 'tok');
    localStorage.setItem('gzs_refresh_token', 'ref');
    localStorage.setItem('gzs_user', JSON.stringify({ id: 'u1' }));
    localStorage.setItem('gzs_account_type', 'individual');
  };

  it('removes all four auth keys from localStorage', async () => {
    seedStorage();
    core.post.mockResolvedValueOnce({ data: {} });

    await authService.logout();

    expect(localStorage.getItem('gzs_access_token')).toBeNull();
    expect(localStorage.getItem('gzs_refresh_token')).toBeNull();
    expect(localStorage.getItem('gzs_user')).toBeNull();
    expect(localStorage.getItem('gzs_account_type')).toBeNull();
  });

  it('still clears localStorage when the server-side logout request fails', async () => {
    seedStorage();
    core.post.mockRejectedValueOnce(new Error('network error'));

    await authService.logout();

    expect(localStorage.getItem('gzs_access_token')).toBeNull();
    expect(localStorage.getItem('gzs_refresh_token')).toBeNull();
    expect(localStorage.getItem('gzs_user')).toBeNull();
    expect(localStorage.getItem('gzs_account_type')).toBeNull();
  });
});
