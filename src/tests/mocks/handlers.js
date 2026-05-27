import { http, HttpResponse } from 'msw';

// Default handlers used across all tests.
// Individual tests can override these via server.use().
export const handlers = [
  http.post('http://localhost:8000/auth/refresh', () =>
    HttpResponse.json({ data: { access_token: 'refreshed_token' } })
  ),
  http.post('http://localhost:8000/auth/logout', () =>
    HttpResponse.json({ data: { success: true }, error: null })
  ),
];
