import cms from '@/services/api/cms';
import core from '@/services/api/core';
import { CMS, CORE } from '@/services/api/endpoints';
import { mockApiService, safeApiCall } from '@/services/mockApiService';

// After the CMS response interceptor runs, r.data is already the inner payload.
// Core API responses are similarly unwrapped by the core client interceptor.
// All .then(r => r.data) calls below receive the unwrapped value directly.

const blogsService = {
  // ── Public: Blog listings ──────────────────────────────────────────────────

  getBlogs: (params = {}) => safeApiCall(
    () => cms.get(CMS.BLOGS.LIST, { params }).then(r => r.data ?? []),
    () => mockApiService.getPublicBlogs()
  ),

  getFeaturedBlogs: () => safeApiCall(
    () => cms.get(CMS.BLOGS.FEATURED).then(r => r.data ?? []),
    () => mockApiService.getPublicBlogs(true)
  ),

  getMostReadBlogs: (params = {}) => safeApiCall(
    () => cms.get(CMS.BLOGS.MOST_READ, { params }).then(r => r.data ?? []),
    () => mockApiService.getPublicBlogs()
  ),

  getTrendingBlogs: (params = {}) => safeApiCall(
    () => cms.get(CMS.BLOGS.TRENDING, { params }).then(r => r.data ?? []),
    () => mockApiService.getPublicBlogs()
  ),

  getBlogBySlug: (slug) => safeApiCall(
    () => cms.get(CMS.BLOGS.BY_SLUG(slug)).then(r => r.data),
    () => mockApiService.getPublicBlogs().then(list =>
      list.find(b => b.slug === slug || b.id === Number(slug))
    )
  ),

  getCategories: () => safeApiCall(
    () => cms.get(CMS.BLOGS.CATEGORIES).then(r => r.data ?? []),
    () => Promise.resolve(['Industry', 'Reviews', 'Technology', 'Tutorials'])
  ),

  // ── Public: Blog interactions ──────────────────────────────────────────────

  likeBlog: (slug) => safeApiCall(
    () => cms.post(CMS.BLOGS.LIKE(slug)).then(r => r.data),
    () => Promise.resolve({ success: true })
  ),

  // ── Public: Comments ───────────────────────────────────────────────────────

  getComments: (slug, params = {}) => safeApiCall(
    () => cms.get(CMS.BLOGS.COMMENTS(slug), { params }).then(r => r.data ?? { data: [], meta: { total: 0, has_more: false } }),
    () => Promise.resolve({ data: [], meta: { total: 0, has_more: false } })
  ),

  createComment: (slug, data) => safeApiCall(
    () => cms.post(CMS.BLOGS.COMMENTS(slug), data).then(r => r.data),
    () => Promise.resolve({ id: Date.now().toString(), ...data, like_count: 0, replies: [] })
  ),

  likeComment: (slug, commentId) => safeApiCall(
    () => cms.post(CMS.BLOGS.COMMENT_LIKE(slug, commentId)).then(r => r.data),
    () => Promise.resolve({ like_count: 1 })
  ),

  reportComment: (slug, commentId, reason) => safeApiCall(
    () => cms.post(CMS.BLOGS.COMMENT_REPORT(slug, commentId), { reason }).then(r => r.data),
    () => Promise.resolve({ reported: true })
  ),

  // ── Admin: Blog management ─────────────────────────────────────────────────

  createBlog: (blogData) => safeApiCall(
    () => cms.post(CMS.BLOGS.CREATE, blogData).then(r => r.data),
    () => mockApiService.addBlog(blogData)
  ),

  updateBlog: (id, blogData) => safeApiCall(
    () => cms.patch(CMS.BLOGS.UPDATE(id), blogData).then(r => r.data),
    () => mockApiService.updateBlog(id, blogData)
  ),

  deleteBlog: (id) => safeApiCall(
    () => cms.delete(CMS.BLOGS.DELETE(id)).then(r => r.data),
    () => mockApiService.deleteBlog(id)
  ),

  // ── Reading List (core-api) ────────────────────────────────────────────────

  getReadingList: () => safeApiCall(
    () => core.get(CORE.READING_LIST.GET).then(r => r.data ?? { items: [] }),
    () => Promise.resolve({ items: [] })
  ),

  saveToReadingList: (slug) => safeApiCall(
    () => core.post(CORE.READING_LIST.SAVE(slug)).then(r => r.data),
    () => Promise.resolve({ saved: true })
  ),

  removeFromReadingList: (slug) => safeApiCall(
    () => core.delete(CORE.READING_LIST.UNSAVE(slug)).then(r => r.data),
    () => Promise.resolve({ saved: false })
  ),
};

export default blogsService;
