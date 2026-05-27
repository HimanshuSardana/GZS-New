/**
 * LocalStorage Keys
 * ─────────────────
 * Single source of truth. All values match the keys written by authService
 * so that useProfileStore, ProtectedRoute, and the service layer share one namespace.
 */
export const STORAGE_KEYS = {
    TOKEN: 'gzs_access_token',
    REFRESH_TOKEN: 'gzs_refresh_token',
    USER: 'gzs_user',
    THEME: 'gz_theme',
    USER_PREFS: 'gz_user_prefs',
};
