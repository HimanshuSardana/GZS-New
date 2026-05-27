import cms from '@/services/api/cms';
import { CMS } from '@/services/api/endpoints';
import { mockApiService, safeApiCall } from '@/services/mockApiService';

// After the CMS response interceptor runs, r.data is already the inner payload.
// All .then(r => r.data) calls below receive the unwrapped value directly.

const gamesService = {
  // ── Public: Legacy games table ─────────────────────────────────────────────

  getGames: (params = {}) => safeApiCall(
    () => cms.get(CMS.GAMES.LIST, { params }).then(r => r.data ?? []),
    () => mockApiService.getPublicGames()
  ),

  getGameBySlug: (slug) => safeApiCall(
    () => cms.get(CMS.GAMES.BY_SLUG(slug)).then(r => r.data),
    () => mockApiService.getPublicGames().then(list => list.find(g => g.slug === slug || g.id === Number(slug)))
  ),

  getTrendingGames: () => safeApiCall(
    () => cms.get(CMS.GAMES.TRENDING).then(r => r.data ?? []),
    () => mockApiService.getPublicGames()
  ),

  getFeaturedGames: () => safeApiCall(
    () => cms.get(CMS.GAMES.FEATURED).then(r => r.data ?? []),
    () => mockApiService.getPublicGames(true)
  ),

  searchGames: (query) => safeApiCall(
    () => cms.get(CMS.SEARCH, { params: { q: query, type: 'games' } }).then(r => r.data ?? []),
    () => mockApiService.getPublicGames().then(list =>
      list.filter(g => g.title.toLowerCase().includes(query.toLowerCase()))
    )
  ),

  // ── Public: Structured GamePosts (gamepost schema) ─────────────────────────

  getGamePosts: (params = {}) => safeApiCall(
    () => cms.get(CMS.GAMEPOSTS.LIST, { params }).then(r => r.data ?? []),
    () => mockApiService.getPublicGames()
  ),

  getGamePost: (slug) => safeApiCall(
    () => cms.get(CMS.GAMEPOSTS.BY_SLUG(slug)).then(r => r.data),
    () => mockApiService.getPublicGames().then(list => list.find(g => g.slug === slug) || list[0])
  ),

  getUserReviews: (slug, params = {}) => safeApiCall(
    () => cms.get(CMS.GAMEPOSTS.USER_REVIEWS(slug), { params }).then(r => r.data ?? { reviews: [], total: 0 }),
    () => Promise.resolve({ reviews: [], total: 0 })
  ),

  submitUserReview: (slug, data) => safeApiCall(
    () => cms.post(CMS.GAMEPOSTS.USER_REVIEWS(slug), data).then(r => r.data),
    () => Promise.resolve({ success: true, status: 'pending' })
  ),

  // ── Admin: Games ───────────────────────────────────────────────────────────

  createGame: (gameData) => safeApiCall(
    () => cms.post(CMS.GAMES.CREATE, gameData).then(r => r.data),
    () => mockApiService.addGame(gameData)
  ),

  updateGame: (id, data) => safeApiCall(
    () => cms.patch(CMS.GAMES.UPDATE(id), data).then(r => r.data),
    () => mockApiService.updateGame(id, data)
  ),

  deleteGame: (id) => safeApiCall(
    () => cms.delete(CMS.GAMES.DELETE(id)).then(r => r.data),
    () => mockApiService.deleteGame(id)
  ),

  uploadMedia: (id, formData) => safeApiCall(
    () => cms.post(CMS.GAMES.UPLOAD_MEDIA(id), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),
    () => Promise.resolve({ success: true })
  ),

  updateStatus: (id, status) => safeApiCall(
    () => cms.put(CMS.GAMES.STATUS(id), { status }).then(r => r.data),
    () => mockApiService.updateGame(id, { status })
  ),

  // ── Admin: GamePosts ───────────────────────────────────────────────────────

  createGamePost: (data) => safeApiCall(
    () => cms.post(CMS.GAMEPOSTS.CREATE, data).then(r => r.data),
    () => Promise.resolve({ success: true, game_post_id: 'mock' })
  ),

  updateGamePost: (id, data) => safeApiCall(
    () => cms.put(CMS.GAMEPOSTS.UPDATE(id), data).then(r => r.data),
    () => Promise.resolve({ success: true })
  ),

  publishGamePost: (id) => safeApiCall(
    () => cms.put(CMS.GAMEPOSTS.PUBLISH(id)).then(r => r.data),
    () => Promise.resolve({ success: true })
  ),

  // ── Admin: Hub Settings ────────────────────────────────────────────────────

  getHubSettings: (section = 'games') => safeApiCall(
    () => cms.get(CMS.ADMIN.HUB_SETTINGS(section)).then(r => r.data),
    () => Promise.resolve({
      featured_games: [],
      pinned_trending: [null, null],
      categories: [],
      blogSelectionType: 'auto',
      selectedBlogs: [],
    })
  ),

  saveHubSettings: (section = 'games', data) => safeApiCall(
    () => cms.put(CMS.ADMIN.HUB_SETTINGS(section), data).then(r => r.data),
    () => Promise.resolve({ success: true })
  ),
};

export default gamesService;
