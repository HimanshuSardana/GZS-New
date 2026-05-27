import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock useAuth so tests are independent of the Zustand store and any API calls.
vi.mock('@/app/providers/useAuth', () => ({
  useAuth: vi.fn(),
}));

import ProtectedRoute from '@/shared/components/ProtectedRoute';
import { useAuth } from '@/app/providers/useAuth';

// Helper: render ProtectedRoute inside a router with a /login sentinel route
// so we can assert navigation happened.
const renderRoute = (ui, { initialPath = '/protected' } = {}) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/protected" element={ui} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
});

// ── redirect when unauthenticated ─────────────────────────────────────────

describe('ProtectedRoute — unauthenticated', () => {
  it('redirects to /login when isAuthenticated is false', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, loading: false });

    renderRoute(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to /login?admin=true when adminOnly is true', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, loading: false });

    // adminOnly route — Navigate target includes ?admin=true; no matching route
    // exists in our test tree so /login is matched instead (React Router matches
    // the path portion only), showing Login Page.
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <div>Admin Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });
});

// ── loading state ─────────────────────────────────────────────────────────

describe('ProtectedRoute — loading', () => {
  it('shows a spinner and does not render children while loading is true', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, loading: true });

    renderRoute(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Spinner has the animate-spin class
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
});

// ── authenticated ─────────────────────────────────────────────────────────

describe('ProtectedRoute — authenticated', () => {
  it('renders children when isAuthenticated is true', () => {
    useAuth.mockReturnValue({ isAuthenticated: true, loading: false });

    renderRoute(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('renders <Outlet> when no children are passed (route-nesting pattern)', () => {
    useAuth.mockReturnValue({ isAuthenticated: true, loading: false });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Outlet Child</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Outlet Child')).toBeInTheDocument();
  });
});
