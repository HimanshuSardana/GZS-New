import core from '@/services/api/core';
import { safeApiCall } from '@/services/mockApiService';

const esportsService = {
  getLeaderboard: (params = {}) => safeApiCall(
    () => core.get('/esports/leaderboard', { params }).then(r => r.data),
    () => Promise.resolve([])
  ),
  getMatches: (params = {}) => safeApiCall(
    () => core.get('/esports/matches', { params }).then(r => r.data),
    () => Promise.resolve([])
  ),
  getLiveScores: () => safeApiCall(
    () => core.get('/esports/live').then(r => r.data),
    () => Promise.resolve([])
  ),
};

export default esportsService;
