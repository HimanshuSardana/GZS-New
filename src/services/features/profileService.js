import core from '@/services/api/core';
import { CORE } from '@/services/api/endpoints';
import { mockApiService, safeApiCall } from '@/services/mockApiService';

// All r.data values are already the inner payload — the core client's response
// interceptor unwraps the { data: <payload>, meta, error } envelope automatically.

const profileService = {
  // ── My Profile ─────────────────────────────────────────────────────────────

  getMyProfile: () => safeApiCall(
    () => core.get(CORE.PROFILE.ME).then(r => r.data),
    () => mockApiService.getSubProfile('me', 'master')
  ),

  updateMyProfile: (data) => safeApiCall(
    () => core.patch(CORE.PROFILE.ME_UPDATE, data).then(r => r.data),
    () => Promise.resolve({ success: true })
  ),

  // ── Sub-profiles ───────────────────────────────────────────────────────────

  getMySubProfiles: () => safeApiCall(
    () => core.get(CORE.PROFILE.SUB_LIST).then(r => r.data ?? []),
    () => mockApiService.getSubProfiles('me')
  ),

  createSubProfile: (data) => safeApiCall(
    () => core.post(CORE.PROFILE.SUB_CREATE, data).then(r => r.data),
    () => mockApiService.createSubProfile('me', data)
  ),

  getSubProfile: (type) => safeApiCall(
    () => core.get(CORE.PROFILE.SUB_BY_TYPE(type)).then(r => r.data),
    () => mockApiService.getSubProfile('me', type)
  ),

  updateSubProfile: (type, data) => safeApiCall(
    () => core.patch(CORE.PROFILE.SUB_UPDATE(type), data).then(r => r.data),
    () => mockApiService.updateSubProfile('me', type, data)
  ),

  deleteSubProfile: (type) => safeApiCall(
    () => core.delete(CORE.PROFILE.SUB_DELETE(type)).then(r => r.data),
    () => mockApiService.deleteSubProfile('me', type)
  ),

  // ── Public profiles ────────────────────────────────────────────────────────

  getPublicProfile: (username) => safeApiCall(
    () => core.get(CORE.PROFILE.PUBLIC_MASTER(username)).then(r => r.data),
    () => mockApiService.getSubProfile('U1', 'dev')
  ),

  getPublicSubProfile: (username, type) => safeApiCall(
    () => core.get(CORE.PROFILE.PUBLIC_SUB(username, type)).then(r => r.data),
    () => mockApiService.getSubProfile(username, type)
  ),

  // ── Skills ─────────────────────────────────────────────────────────────────

  addSkill: (type, skill) => safeApiCall(
    () => core.post(CORE.PROFILE.SKILL_ADD(type), skill).then(r => r.data),
    () => mockApiService.addSkill('me', type, skill)
  ),

  deleteSkill: (type, id) => safeApiCall(
    () => core.delete(CORE.PROFILE.SKILL_DELETE(type, id)).then(r => r.data),
    () => mockApiService.removeSkill('me', type, id)
  ),

  // ── Achievements & XP ──────────────────────────────────────────────────────

  getSubProfileAchievements: (type) => safeApiCall(
    () => core.get(`${CORE.PROFILE.SUB_BY_TYPE(type)}/achievements`).then(r => r.data ?? []),
    () => Promise.resolve([])
  ),

  getMyXP: () => safeApiCall(
    () => core.get(CORE.XP.MY_STATS).then(r => r.data),
    () => Promise.resolve({ level: 'Hustler', current_xp: 450, xp_to_next_level: 550, total_xp: 4450, rank: 'Hustler' })
  ),

  // ── Notifications ──────────────────────────────────────────────────────────

  getNotifications: () => safeApiCall(
    () => core.get(CORE.NOTIFICATIONS.LIST).then(r => r.data?.items ?? []),
    () => Promise.resolve([])
  ),

  markNotificationRead: (id) => safeApiCall(
    () => core.post(CORE.NOTIFICATIONS.MARK_READ(id)).then(r => r.data),
    () => Promise.resolve({ success: true })
  ),

  markAllNotificationsRead: () => safeApiCall(
    () => core.post(CORE.NOTIFICATIONS.MARK_ALL_READ).then(r => r.data),
    () => Promise.resolve({ success: true })
  ),
};

// Alias for backward compatibility with code that uses the old getMasterProfile name
profileService.getMasterProfile = profileService.getMyProfile;
profileService.updateMasterProfile = profileService.updateMyProfile;
profileService.getSubProfiles = profileService.getMySubProfiles;

export default profileService;
