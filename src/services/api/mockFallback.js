import { MOCK_BLOGS } from '@/shared/data/blogData';
import { COMMUNITY_BRANCHES, MOCK_CHANNELS, MOCK_CHAT_MESSAGES, MOCK_COMMUNITY_EVENTS, MOCK_GROUPS, MOCK_LFG_POSTS, MOCK_SHOWCASE } from '@/shared/data/communityData';
import { MOCK_GAMES_LIST } from '@/shared/data/gamesData';
import { MOCK_CONVERSATIONS, MOCK_MESSAGES, generateMockMessages } from '@/shared/data/messagesData';
import { MOCK_NOTIFICATIONS } from '@/shared/data/notificationsData';
import { MOCK_FOLLOWERS, MOCK_FRIENDS, MOCK_MASTER_PROFILE, MOCK_POSTS, MOCK_PROJECTS, MOCK_PUBLIC_PROFILES, MOCK_SKILLS, MOCK_SUB_PROFILES } from '@/shared/data/profileData';
import { MOCK_BRACKETS, MOCK_RESULTS, MOCK_TOURNAMENTS } from '@/shared/data/tournamentData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

if (!USE_MOCK) {
  console.info('[GZS] Mock fallback DISABLED — using real APIs');
}

const normalizeUrl = (url = '') => url.replace(/^https?:\/\/[^/]+/i, '');
const stripQuery = (url = '') => url.split('?')[0];

const getGameBySlug = (slug) => MOCK_GAMES_LIST.find((game) => game.slug === slug || game.id === slug);
const getBlogBySlug = (slug) => MOCK_BLOGS.find((blog) => blog.slug === slug || blog.id === slug);
const getTournamentBySlug = (slug) => MOCK_TOURNAMENTS.find((tournament) => tournament.slug === slug || tournament.id === slug);

const getProfileSuggestions = () =>
    MOCK_PUBLIC_PROFILES.slice(0, 5).map((profile) => ({
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        location_city: profile.location_city,
        location_country: profile.location_country,
        sub_profiles: profile.sub_profiles,
    }));

const enrichSubProfile = (subProfile) => ({
    ...subProfile,
    bio: subProfile.about,
    skills: MOCK_SKILLS.filter((skill) => skill.sub_profile_id === subProfile.id),
    projects: MOCK_PROJECTS.filter((project) => project.sub_profile_id === subProfile.id),
});

/**
 * Mock fallback handler.
 * Returns mock data when the backend is offline or the request fails.
 */
export const handleMockFallback = async (method, url, data, params) => {
    const upperMethod = (method || 'get').toUpperCase();
    const requestUrl = stripQuery(normalizeUrl(url));

    console.warn(`[Gzone Mock] Falling back to mock data for: ${upperMethod} ${requestUrl}`);

    if (upperMethod === 'GET' && requestUrl === '/games') {
        if (params?.featured) return MOCK_GAMES_LIST.filter((game) => game.is_featured);
        return MOCK_GAMES_LIST;
    }

    if (upperMethod === 'GET' && requestUrl === '/games/trending') {
        return [...MOCK_GAMES_LIST].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 5);
    }

    if (upperMethod === 'GET' && requestUrl === '/games/featured') {
        return MOCK_GAMES_LIST.filter((game) => game.is_featured);
    }

    if (upperMethod === 'GET' && requestUrl.startsWith('/games/')) {
        const slug = requestUrl.split('/')[2];
        return getGameBySlug(slug) || MOCK_GAMES_LIST[0];
    }

    if (upperMethod === 'GET' && requestUrl === '/blogs') {
        if (params?.featured) return MOCK_BLOGS.slice(0, 3);
        return MOCK_BLOGS;
    }

    if (upperMethod === 'GET' && requestUrl === '/blogs/featured') {
        return MOCK_BLOGS.slice(0, 3);
    }

    if (upperMethod === 'GET' && requestUrl.startsWith('/blogs/')) {
        const slug = requestUrl.split('/')[2];
        return getBlogBySlug(slug) || MOCK_BLOGS[0];
    }

    if (upperMethod === 'GET' && requestUrl === '/tournaments') {
        return MOCK_TOURNAMENTS;
    }

    if (upperMethod === 'GET' && requestUrl.endsWith('/brackets')) {
        return MOCK_BRACKETS;
    }

    if (upperMethod === 'GET' && requestUrl.endsWith('/results')) {
        return MOCK_RESULTS;
    }

    if (upperMethod === 'GET' && requestUrl.startsWith('/tournaments/')) {
        const slug = requestUrl.split('/')[2];
        return getTournamentBySlug(slug) || MOCK_TOURNAMENTS[0];
    }

    if (upperMethod === 'GET' && requestUrl === '/profiles/me') {
        return MOCK_MASTER_PROFILE;
    }

    if (upperMethod === 'GET' && requestUrl === '/profiles/me/sub') {
        return MOCK_SUB_PROFILES;
    }

    if (upperMethod === 'GET' && requestUrl.startsWith('/profiles/me/sub/')) {
        const type = requestUrl.split('/')[4];
        const subProfile = MOCK_SUB_PROFILES.find((profile) => profile.type === type) || MOCK_SUB_PROFILES[0];
        return enrichSubProfile(subProfile);
    }

    if (upperMethod === 'GET' && requestUrl.startsWith('/profiles/') && !requestUrl.includes('/sub/')) {
        const username = requestUrl.split('/')[2];
        return MOCK_PUBLIC_PROFILES.find((profile) => profile.username === username) || MOCK_PUBLIC_PROFILES[0];
    }

    if (upperMethod === 'GET' && requestUrl === '/social/friends') {
        return MOCK_FRIENDS;
    }

    if (upperMethod === 'GET' && requestUrl === '/social/suggestions') {
        return getProfileSuggestions();
    }

    if (upperMethod === 'GET' && requestUrl === '/community/branches') {
        return COMMUNITY_BRANCHES;
    }

    if (upperMethod === 'GET' && /^\/community\/[^/]+\/channels$/.test(requestUrl)) {
        const branchSlug = requestUrl.split('/')[2];
        const branch = COMMUNITY_BRANCHES.find((entry) => entry.slug === branchSlug);
        return MOCK_CHANNELS.filter((channel) => channel.branch_id === branch?.id);
    }

    if (upperMethod === 'GET' && /^\/community\/[^/]+\/[^/]+\/messages$/.test(requestUrl)) {
        const [, , branchSlug, channelSlug] = requestUrl.split('/');
        const branch = COMMUNITY_BRANCHES.find((entry) => entry.slug === branchSlug);
        const matchingChannels = MOCK_CHANNELS.filter(
            (channel) => channel.branch_id === branch?.id && channel.slug === channelSlug,
        );

        if (matchingChannels.length) {
            return MOCK_CHAT_MESSAGES.filter((message) =>
                matchingChannels.some((channel) => channel.id === message.channel_id),
            );
        }

        return MOCK_CHAT_MESSAGES;
    }

    if (upperMethod === 'GET' && requestUrl.includes('/groups')) {
        return MOCK_GROUPS;
    }

    if (upperMethod === 'GET' && requestUrl.includes('/showcase')) {
        return MOCK_SHOWCASE;
    }

    if (upperMethod === 'GET' && requestUrl.includes('/lfg')) {
        return MOCK_LFG_POSTS;
    }

    if (upperMethod === 'GET' && requestUrl.includes('/events')) {
        return MOCK_COMMUNITY_EVENTS;
    }

    if (upperMethod === 'GET' && requestUrl === '/notifications') {
        return MOCK_NOTIFICATIONS;
    }

    if (upperMethod === 'GET' && requestUrl === '/messages/conversations') {
        return MOCK_CONVERSATIONS;
    }

    if (upperMethod === 'GET' && requestUrl === '/messages') {
        return MOCK_CONVERSATIONS;
    }

    if (upperMethod === 'GET' && requestUrl.startsWith('/messages/')) {
        const conversationId = requestUrl.split('/')[2];
        return MOCK_MESSAGES[conversationId] || generateMockMessages(20);
    }

    if (upperMethod === 'GET' && requestUrl === '/posts/feed') {
        return { data: MOCK_POSTS, next_page: null };
    }

    if (upperMethod === 'GET' && requestUrl.startsWith('/posts/user/')) {
        return { data: MOCK_POSTS, next_page: null };
    }

    if (upperMethod === 'POST' && requestUrl.includes('/like')) {
        return { success: true };
    }

    if (upperMethod === 'POST' && requestUrl === '/posts') {
        return { id: `mock-post-${Date.now()}`, ...data };
    }

    if (upperMethod === 'POST' && /^\/community\/[^/]+\/[^/]+\/messages$/.test(requestUrl)) {
        return {
            id: `mock-message-${Date.now()}`,
            ...data,
            created_at: new Date().toISOString(),
        };
    }

    if (upperMethod === 'POST' && requestUrl === '/social/friends') {
        return { success: true };
    }

    if (upperMethod === 'POST' && requestUrl.includes('/register')) {
        return { success: true };
    }

    if (upperMethod === 'PUT' || upperMethod === 'PATCH') {
        return { success: true, ...data };
    }

    if (upperMethod === 'DELETE') {
        return { success: true };
    }

    return null;
};

/**
 * Installs a response interceptor on an axios client that catches network
 * errors and returns mock data. No-op when VITE_USE_MOCK !== 'true'.
 */
export const installMockFallback = (client) => {
  if (!USE_MOCK) return;

  client.interceptors.response.use(null, async (error) => {
    if (!error.response) {
      const { config } = error;
      const result = await handleMockFallback(
        config.method,
        config.url,
        config.data ? JSON.parse(config.data) : undefined,
        config.params,
      );
      if (result !== null) return { data: result, status: 200, headers: {}, config, mock: true };
    }
    return Promise.reject(error);
  });
};
