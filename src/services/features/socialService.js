import core from '@/services/api/core';
import { CORE } from '@/services/api/endpoints';
import { mockApiService, safeApiCall } from '@/services/mockApiService';

const socialService = {
  createPost: (postData) => safeApiCall(
    () => core.post(CORE.SOCIAL.CREATE_POST, postData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),
    () => mockApiService.createPost(postData)
  ),

  getFeed: (params = {}) => safeApiCall(
    () => core.get(CORE.SOCIAL.FEED, { params }).then(r => r.data),
    () => mockApiService.getFeed()
  ),

  getUserPosts: (username, params = {}) => safeApiCall(
    () => core.get(CORE.SOCIAL.USER_POSTS(username), { params }).then(r => r.data),
    () => mockApiService.getPosts({ username })
  ),

  getSubProfilePosts: (username, type, params = {}) => safeApiCall(
    () => core.get(CORE.SOCIAL.SUB_POSTS(username, type), { params }).then(r => r.data),
    () => mockApiService.getPosts({ username, subProfileType: type })
  ),

  likePost: (postId) => safeApiCall(
    () => core.post(CORE.SOCIAL.LIKE(postId)).then(r => r.data),
    () => mockApiService.likePost(postId)
  ),

  commentOnPost: (postId, content) => safeApiCall(
    () => core.post(CORE.SOCIAL.COMMENT(postId), { content }).then(r => r.data),
    () => Promise.resolve({ success: true })
  ),

  deletePost: (postId) => safeApiCall(
    () => core.delete(CORE.SOCIAL.DELETE_POST(postId)).then(r => r.data),
    () => mockApiService.deletePost(postId)
  ),

  getFriendsList: () => safeApiCall(
    () => core.get(CORE.SOCIAL.FRIENDS).then(r => r.data),
    () => Promise.resolve([])
  ),

  sendFriendRequest: (userId) => safeApiCall(
    () => core.post(CORE.SOCIAL.SEND_REQUEST(userId)).then(r => r.data),
    () => Promise.resolve({ success: true })
  ),

  acceptFriendRequest: (requestId) => safeApiCall(
    () => core.post(CORE.SOCIAL.ACCEPT_REQUEST(requestId)).then(r => r.data),
    () => Promise.resolve({ success: true })
  ),

  followProfile: (userId) => safeApiCall(
    () => core.post(CORE.SOCIAL.FOLLOW(userId)).then(r => r.data),
    () => Promise.resolve({ success: true })
  ),

  blockUser: (userId) => safeApiCall(
    () => core.post(CORE.SOCIAL.BLOCK(userId)).then(r => r.data),
    () => Promise.resolve({ success: true })
  ),

  getSuggestions: () => safeApiCall(
    () => core.get(CORE.SOCIAL.SUGGESTIONS).then(r => r.data),
    () => Promise.resolve([])
  ),

  respondToFriendRequest: (requestId, status) => safeApiCall(
    () => core.put(CORE.FRIENDS.RESPOND(requestId), { status }).then(r => r.data),
    () => Promise.resolve({ success: true })
  ),

  followSubProfile: (username, type) => safeApiCall(
    () => core.post(CORE.FOLLOW.FOLLOW(username, type)).then(r => r.data),
    () => Promise.resolve({ success: true })
  ),

  unfollowSubProfile: (username, type) => safeApiCall(
    () => core.delete(CORE.FOLLOW.UNFOLLOW(username, type)).then(r => r.data),
    () => Promise.resolve({ success: true })
  ),
};

export default socialService;
