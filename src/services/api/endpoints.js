/**
 * API endpoints registry.
 * Keep this file additive: do not remove legacy keys unless the whole codebase has been migrated.
 */

export const CORE = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        VERIFY_EMAIL: '/auth/verify-email',
        FORGOT_PASSWORD: '/auth/password/forgot',
        RESET_PASSWORD: '/auth/password/reset',
    },

    USER: {
        ME: '/users/me',
        BY_USERNAME: (username) => `/users/u/${username}`,
        UPDATE: '/users/me',
        AVATAR: '/users/me/avatar',
    },

    PROFILE: {
        ME: '/profiles/me',
        ME_UPDATE: '/profiles/me',
        SUB_LIST: '/profiles/me/sub',
        SUB_CREATE: '/profiles/me/sub',
        SUB_BY_TYPE: (type) => `/profiles/me/sub/${type}`,
        SUB_UPDATE: (type) => `/profiles/me/sub/${type}`,
        SUB_DELETE: (type) => `/profiles/me/sub/${type}`,

        PUBLIC_MASTER: (username) => `/profiles/${username}`,
        PUBLIC_SUB: (username, type) => `/profiles/${username}/${type}`,

        SKILLS: (type) => `/profiles/me/sub/${type}/skills`,
        SKILL_ADD: (type) => `/profiles/me/sub/${type}/skills`,
        SKILL_DELETE: (type, id) => `/profiles/me/sub/${type}/skills/${id}`,
        PROJECTS: (type) => `/profiles/me/sub/${type}/projects`,
        PROJECT_ADD: (type) => `/profiles/me/sub/${type}/projects`,
        PROJECT_UPDATE: (type, id) => `/profiles/me/sub/${type}/projects/${id}`,
        PROJECT_DELETE: (type, id) => `/profiles/me/sub/${type}/projects/${id}`,
    },

    VERIFICATION: {
        REQUEST: (type, skillId) => `/profiles/me/sub/${type}/skills/${skillId}/verify`,
        LIST_PENDING: '/admin/verifications',
        DETAIL: (id) => `/admin/verifications/${id}`,
        DECIDE: (id) => `/admin/verifications/${id}/decide`,
    },

    TRUST: {
        MY_SCORE: '/trust/me',
        HISTORY: '/trust/me/history',
        ADMIN_ADJUST: (userId) => `/admin/users/${userId}/trust`,
    },

    SOCIAL: {
        CREATE_POST: '/posts',
        FEED: '/posts/feed',
        USER_POSTS: (username) => `/posts/user/${username}`,
        SUB_POSTS: (username, type) => `/posts/user/${username}/${type}`,
        LIKE: (id) => `/posts/${id}/like`,
        COMMENT: (id) => `/posts/${id}/comment`,
        DELETE_POST: (id) => `/posts/${id}`,

        FRIENDS: '/social/friends',
        SEND_REQUEST: (id) => `/social/friends/${id}/request`,
        ACCEPT_REQUEST: (id) => `/social/friends/${id}/accept`,
        FOLLOW: (id) => `/social/follow/${id}`,
        BLOCK: (id) => `/social/block/${id}`,
        SUGGESTIONS: '/social/suggestions',
    },

    FRIENDS: {
        REQUEST: '/friends/request',
        RESPOND: (id) => `/friends/request/${id}`,
        LIST: '/friends',
    },

    FOLLOW: {
        FOLLOW: (username, type) => `/follow/${username}/${type}`,
        UNFOLLOW: (username, type) => `/follow/${username}/${type}`,
    },

    MESSAGES: {
        LIST: '/messages',
        CONVERSATIONS: '/messages/conversations',
        CONVERSATION: (id) => `/messages/${id}`,
        SEND: (id) => `/messages/${id}`,
    },

    COMMUNITY: {
        BRANCHES: '/community/branches',
        BRANCH: (slug) => `/community/${slug}`,
        JOIN: (slug) => `/community/${slug}/join`,
        CHANNELS: (branch) => `/community/${branch}/channels`,
        CHANNEL: (branch, channel) => `/community/${branch}/${channel}`,
        MESSAGES: (branch, channel) => `/community/${branch}/${channel}/messages`,
        SEND_MESSAGE: (branch, channel) => `/community/${branch}/${channel}/messages`,

        GROUPS: (branch) => `/community/${branch}/groups`,
        GROUP: (id) => `/community/groups/${id}`,
        GROUP_JOIN: (id) => `/community/groups/${id}/join`,
        GROUP_LEAVE: (id) => `/community/groups/${id}/leave`,
        GROUP_MESSAGES: (id) => `/community/groups/${id}/messages`,

        SHOWCASE: (branch) => `/community/${branch}/showcase`,
        LFG: (branch) => `/community/${branch}/lfg`,
        EVENTS: (branch) => `/community/${branch}/events`,

        MY_JOINED: '/community/me/joined',
        MY_ACTIVITY: '/community/me/activity',
        STATS: '/community/stats/live',
        TRENDING: '/community/trending',

        GAME_MESSAGES: '/community/channels/messages',
        GAME_STATS: '/community/stats',
    },

    LFG: {
        LIST: (branch) => `/community/${branch}/lfg`,
        CREATE: (branch) => `/community/${branch}/lfg`,
        DETAIL: (branch, id) => `/community/${branch}/lfg/${id}`,
        RENEW: (branch, id) => `/community/${branch}/lfg/${id}/renew`,
        DELETE: (branch, id) => `/community/${branch}/lfg/${id}`,
    },

    SHOWCASE: {
        LIST: (branch) => `/community/${branch}/showcase`,
        CREATE: (branch) => `/community/${branch}/showcase`,
        FEATURE: (branch, id) => `/admin/community/${branch}/showcase/${id}/feature`,
    },

    EVENTS: {
        LIST: (branch) => `/community/${branch}/events`,
        CREATE: (branch) => `/community/${branch}/events`,
        RSVP: (branch, id) => `/community/${branch}/events/${id}/rsvp`,
        APPROVE: (id) => `/admin/community/events/${id}/approve`,
    },

    TOURNAMENTS: {
        LIST: '/tournaments',
        BY_SLUG: (slug) => `/tournaments/${slug}`,
        BRACKET: (slug) => `/tournaments/${slug}/brackets`,
        BRACKETS: (slug) => `/tournaments/${slug}/brackets`,
        RESULTS: (slug) => `/tournaments/${slug}/results`,
        REGISTER: (id) => `/tournaments/${id}/register`,
        REGISTRATIONS: (id) => `/tournaments/${id}/registrations`,
        CREATE: '/tournaments',
        UPDATE: (id) => `/tournaments/${id}`,
        UPDATE_BRACKET: (id) => `/tournaments/${id}/brackets`,
        GENERATE_BRACKET: (id) => `/tournaments/${id}/brackets/generate`,
        DELETE: (id) => `/tournaments/${id}`,
        SPONSORS: '/sponsors',
    },

    COMPANY: {
        LIST: '/companies',
        BY_SLUG: (slug) => `/companies/${slug}`,
        ME: '/companies/me',
        CREATE: '/companies',
        UPDATE: (id) => `/companies/${id}`,
        MEMBERS: (id) => `/companies/${id}/members`,
        MEMBER_ADD: (id) => `/companies/${id}/members`,
        MEMBER_REMOVE: (id, userId) => `/companies/${id}/members/${userId}`,
        OPPORTUNITIES: (id) => `/companies/${id}/opportunities`,
        TALENT_POOL: (slug) => `/companies/${slug}/talent`,
        TEAM: (slug) => `/companies/${slug}/team`,
        OPEN_ROLES: (slug) => `/companies/${slug}/roles`,
        ANALYTICS: (slug) => `/companies/${slug}/analytics`,
    },

    ADMIN: {
        USERS: '/admin/users',
        USER_DETAIL: (id) => `/admin/users/${id}`,
        USER_SUSPEND: (id) => `/admin/users/${id}/suspend`,
        USER_BAN: (id) => `/admin/users/${id}/ban`,
        USER_EXPORT: (id) => `/admin/users/${id}/export`,
        COMPANIES: '/admin/companies',
        COMPANY_VERIFY: (id) => `/admin/companies/${id}/verify`,
        COMM_BRANCHES: '/admin/community/branches',
        COMM_BRANCH: (slug) => `/admin/community/branches/${slug}`,
        COMM_MODQUEUE: '/admin/community/moderation',
        COMM_ANALYTICS: '/admin/community/analytics',
        GROUPS: '/admin/community/groups',
        EVENTS_QUEUE: '/admin/community/events',
    },

    XP: {
        MY_STATS: '/xp/me',
        LEADERBOARD: '/xp/leaderboard',
    },

    NOTIFICATIONS: {
        LIST: '/notifications',
        MARK_READ: (id) => `/notifications/${id}/read`,
        MARK_ALL_READ: '/notifications/read-all',
        READ_ALL: '/notifications/read-all',
    },

    READING_LIST: {
        GET: '/reading-list',
        SAVE: (slug) => `/reading-list/${slug}`,
        UNSAVE: (slug) => `/reading-list/${slug}`,
    },
};

export const CMS = {
    GAMES: {
        LIST: '/games',
        BY_SLUG: (slug) => `/games/${slug}`,
        TRENDING: '/games/trending',
        FEATURED: '/games/featured',
        SEARCH: '/search',
        CREATE: '/games',
        UPDATE: (id) => `/games/${id}`,
        DELETE: (id) => `/games/${id}`,
        UPLOAD_MEDIA: (id) => `/games/${id}/media`,
        STATUS: (id) => `/games/${id}/status`,
    },

    // New structured GamePost endpoints (backed by gamepost schema)
    GAMEPOSTS: {
        LIST: '/gameposts',
        BY_SLUG: (slug) => `/gameposts/${slug}`,
        ADMIN_LIST: '/admin/gameposts',
        CREATE: '/admin/gameposts',
        UPDATE: (id) => `/admin/gameposts/${id}`,
        PUBLISH: (id) => `/admin/gameposts/${id}/publish`,
        DELETE: (id) => `/admin/gameposts/${id}`,
        USER_REVIEWS: (slug) => `/gameposts/${slug}/user-reviews`,
    },

    BLOGS: {
        LIST: '/blogs',
        BY_SLUG: (slug) => `/blogs/${slug}`,
        FEATURED: '/blogs/featured',
        MOST_READ: '/blogs/most-read',
        TRENDING: '/blogs/trending',
        LIKE: (slug) => `/blogs/${slug}/like`,
        CATEGORIES: '/blogs/categories',
        COMMENTS: (slug) => `/blogs/${slug}/comments`,
        COMMENT_LIKE: (slug, id) => `/blogs/${slug}/comments/${id}/like`,
        COMMENT_REPORT: (slug, id) => `/blogs/${slug}/comments/${id}/report`,
        CREATE: '/blogs',
        UPDATE: (id) => `/blogs/${id}`,
        DELETE: (id) => `/blogs/${id}`,
        SIGNALS: (id) => `/admin/blogs/${id}/signals`,
    },

    // READING_LIST lives in CORE (user-owned data, requires JWT auth).
    // CMS has no /reading-list handler — use CORE.READING_LIST exclusively.

    SEARCH: '/search',

    MEDIA: {
        UPLOAD: '/media/upload',
        LIST: '/media',
    },

    ADMIN: {
        STATS: '/admin/stats',
        USERS: '/admin/users',
        USER: (id) => `/admin/users/${id}`,
        MEDIA: '/admin/media',
        LOGS: '/admin/logs',
        HUB_SETTINGS: (section) => `/admin/hub-settings?section=${section}`,
    },
};
