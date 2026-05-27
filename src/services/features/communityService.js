import core from '@/services/api/core';
import { CORE } from '@/services/api/endpoints';
import { mockApiService, safeApiCall } from '@/services/mockApiService';

const communityService = {
  getBranches: () => safeApiCall(
    () => core.get(CORE.COMMUNITY.BRANCHES).then(r => r.data),
    () => mockApiService.getBranches()
  ),

  getBranchDetail: (slug) => safeApiCall(
    () => core.get(CORE.COMMUNITY.BRANCH(slug)).then(r => r.data),
    () => mockApiService.getBranch(slug)
  ),

  joinBranch: (slug) => safeApiCall(
    () => core.post(CORE.COMMUNITY.JOIN(slug)).then(r => r.data),
    () => mockApiService.updateBranchMemberCount(slug, 1)
  ),

  leaveBranch: (slug) => safeApiCall(
    () => core.delete(`/community/branches/${slug}/join`).then(r => r.data),
    () => mockApiService.updateBranchMemberCount(slug, -1)
  ),

  getBranchChannels: (branch) => safeApiCall(
    () => core.get(CORE.COMMUNITY.CHANNELS(branch)).then(r => r.data),
    () => mockApiService.getChannels(branch)
  ),

  getChannelDetail: (branch, channel) => safeApiCall(
    () => core.get(CORE.COMMUNITY.CHANNEL(branch, channel)).then(r => r.data),
    () => mockApiService.getChannel(branch, channel)
  ),

  getMessageHistory: (branch, channel, params = {}) => safeApiCall(
    () => core.get(CORE.COMMUNITY.MESSAGES(branch, channel), { params }).then(r => r.data),
    () => Promise.resolve([])
  ),

  sendMessage: ({ branch, channel, content }) => safeApiCall(
    () => core.post(CORE.COMMUNITY.SEND_MESSAGE(branch, channel), { content }).then(r => r.data),
    () => Promise.resolve({ success: true })
  ),

  getGroupsInBranch: (branch) => safeApiCall(
    () => core.get(CORE.COMMUNITY.GROUPS(branch)).then(r => r.data),
    () => mockApiService.getGroups(branch)
  ),

  getGroupDetail: (id) => safeApiCall(
    () => core.get(CORE.COMMUNITY.GROUP(id)).then(r => r.data),
    () => mockApiService.getGroup(id)
  ),

  joinGroup: (id) => safeApiCall(
    () => core.post(CORE.COMMUNITY.GROUP_JOIN(id)).then(r => r.data),
    () => mockApiService.updateGroup(id, { joined: true })
  ),

  leaveGroup: (id) => safeApiCall(
    () => core.delete(CORE.COMMUNITY.GROUP_LEAVE(id)).then(r => r.data),
    () => mockApiService.updateGroup(id, { joined: false })
  ),

  getGroupMessages: (id, params = {}) => safeApiCall(
    () => core.get(CORE.COMMUNITY.GROUP_MESSAGES(id), { params }).then(r => r.data),
    () => Promise.resolve([])
  ),

  getShowcaseFeed: (branch, params = {}) => safeApiCall(
    () => core.get(CORE.COMMUNITY.SHOWCASE(branch), { params }).then(r => r.data),
    () => mockApiService.getGroups(branch) // Fallback to groups if showcase not available
  ),

  getLFGBoard: (branch, params = {}) => safeApiCall(
    () => core.get(CORE.COMMUNITY.LFG(branch), { params }).then(r => r.data),
    () => mockApiService.getLFGPosts(branch)
  ),

  getCommunityEvents: (branch, params = {}) => safeApiCall(
    () => core.get(CORE.COMMUNITY.EVENTS(branch), { params }).then(r => r.data),
    () => mockApiService.getEvents(branch)
  ),

  getJoinedCommunities: () => safeApiCall(
    () => core.get(CORE.COMMUNITY.MY_JOINED).then(r => r.data),
    () => Promise.resolve([])
  ),

  getUserActivity: (username) => safeApiCall(
    () => core.get(CORE.COMMUNITY.MY_ACTIVITY).then(r => r.data),
    () => Promise.resolve([])
  ),

  getMyCommunityActivity: () => safeApiCall(
    () => core.get(CORE.COMMUNITY.MY_ACTIVITY).then(r => r.data),
    () => Promise.resolve([])
  ),

  getLiveStats: () => safeApiCall(
    () => core.get(CORE.COMMUNITY.STATS).then(r => r.data),
    () => Promise.resolve({ online_members: 124, active_discussions: 12 })
  ),

  getTrendingPosts: (params = {}) => safeApiCall(
    () => core.get(CORE.COMMUNITY.TRENDING, { params }).then(r => r.data),
    () => Promise.resolve([])
  ),

  getGameChatPreview: (gameSlug, limit = 5) => safeApiCall(
    () => core.get(CORE.COMMUNITY.GAME_MESSAGES, { params: { game_slug: gameSlug, limit } }).then(r => r.data),
    () => Promise.resolve([])
  ),

  getGameStats: (gameSlug) => safeApiCall(
    () => core.get(CORE.COMMUNITY.GAME_STATS, { params: { game_slug: gameSlug } }).then(r => r.data),
    () => Promise.resolve({ members_with_game: 0, active_discussions: 0, posts_this_week: 0 })
  ),
};

export default communityService;
