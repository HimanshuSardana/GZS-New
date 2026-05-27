import core from '@/services/api/core';
import { CORE } from '@/services/api/endpoints';
import { mockApiService, safeApiCall } from '@/services/mockApiService';

// All r.data values are already the inner payload — the core client's response
// interceptor unwraps the { data: <payload>, meta, error } envelope automatically.

const tournamentService = {
  // ── Public ─────────────────────────────────────────────────────────────────

  getTournaments: (params = {}) => safeApiCall(
    () => core.get(CORE.TOURNAMENTS.LIST, { params }).then(r => r.data ?? []),
    () => mockApiService.getAllTournaments()
  ),

  getTournamentBySlug: (slug) => safeApiCall(
    () => core.get(CORE.TOURNAMENTS.BY_SLUG(slug)).then(r => r.data),
    () => mockApiService.getAllTournaments().then(list =>
      list.find(t => t.slug === slug || t.id === Number(slug))
    )
  ),

  getBracketData: (slug) => safeApiCall(
    () => core.get(CORE.TOURNAMENTS.BRACKET(slug)).then(r => r.data),
    () => mockApiService.getAllBrackets()
  ),

  getResults: (slug) => safeApiCall(
    () => core.get(CORE.TOURNAMENTS.RESULTS(slug)).then(r => r.data ?? []),
    () => mockApiService.getAllResults()
  ),

  // ── Registration ───────────────────────────────────────────────────────────

  registerForTournament: (id, data = {}) => safeApiCall(
    () => core.post(CORE.TOURNAMENTS.REGISTER(id), data).then(r => r.data),
    () => Promise.resolve({ success: true, status: 'registered' })
  ),

  getRegistrations: (id) => safeApiCall(
    () => core.get(CORE.TOURNAMENTS.REGISTRATIONS(id)).then(r => r.data ?? []),
    () => Promise.resolve([])
  ),

  getUserTournaments: (userId) => safeApiCall(
    () => core.get(CORE.TOURNAMENTS.LIST, { params: { participant_user_id: userId } }).then(r => r.data ?? []),
    () => Promise.resolve([])
  ),

  // ── Admin ──────────────────────────────────────────────────────────────────

  createTournament: (data) => safeApiCall(
    () => core.post(CORE.TOURNAMENTS.CREATE, data).then(r => r.data),
    () => mockApiService.addTournament(data)
  ),

  updateTournament: (id, data) => safeApiCall(
    () => core.put(CORE.TOURNAMENTS.UPDATE(id), data).then(r => r.data),
    () => mockApiService.updateTournament(id, data)
  ),

  deleteTournament: (id) => safeApiCall(
    () => core.delete(CORE.TOURNAMENTS.DELETE(id)).then(r => r.data),
    () => mockApiService.deleteTournament(id)
  ),

  updateBracket: (id, data) => safeApiCall(
    () => core.put(CORE.TOURNAMENTS.UPDATE_BRACKET(id), data).then(r => r.data),
    () => mockApiService.updateBracket(id, data)
  ),

  generateBracket: (id) => safeApiCall(
    () => core.post(CORE.TOURNAMENTS.GENERATE_BRACKET(id)).then(r => r.data),
    () => Promise.resolve({ success: true })
  ),

  // ── Analytics ──────────────────────────────────────────────────────────────

  getAnalyticsFunnel: (id) => safeApiCall(
    () => core.get(`${CORE.TOURNAMENTS.BY_SLUG(id)}/analytics/funnel`).then(r => r.data),
    () => Promise.resolve({ page_views: 0, form_opens: 0, form_starts: 0, completions: 0 })
  ),

  getAnalyticsOverTime: (id) => safeApiCall(
    () => core.get(`${CORE.TOURNAMENTS.BY_SLUG(id)}/analytics/registrations-over-time`).then(r => r.data ?? []),
    () => Promise.resolve([])
  ),

  getAnalyticsGeo: (id) => safeApiCall(
    () => core.get(`${CORE.TOURNAMENTS.BY_SLUG(id)}/analytics/geo`).then(r => r.data ?? []),
    () => Promise.resolve([])
  ),

  getAnalyticsPrizeStatus: (id) => safeApiCall(
    () => core.get(`${CORE.TOURNAMENTS.BY_SLUG(id)}/analytics/prize-status`).then(r => r.data ?? []),
    () => Promise.resolve([])
  ),

  createPaymentOrder: (id, method) => safeApiCall(
    () => core.post(
      `${CORE.TOURNAMENTS.REGISTER(id).replace('/register', '/create-payment-order')}`,
      { payment_method: method }
    ).then(r => r.data),
    () => Promise.resolve({ method, sufficient: true })
  ),
};

// Alias for backward compatibility
tournamentService.register = tournamentService.registerForTournament;
tournamentService.getBracket = tournamentService.getBracketData;

export default tournamentService;
