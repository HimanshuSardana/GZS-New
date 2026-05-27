import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import { mockApiService } from '@services/mockApiService';
import { useToast } from '@/shared/components/Toast';
import { AdminPageHero, AdminPanel, AdminMetrics, AdminStatusBadge, AdminEmptyState } from '../components/AdminContentShell';
import { normalizeStatus, safeString } from '../components/adminFormUtils';

const STATUS_FILTERS = ['all', 'published', 'draft', 'archived'];
const CATEGORY_FILTERS = ['all', 'games', 'esports', 'news', 'articles', 'health', 'products', 'trending'];

function normalizeBlog(blog) {
  return {
    id: blog.id,
    title: safeString(blog.title),
    slug: safeString(blog.slug || ''),
    category: safeString(blog.category || 'Uncategorized').toLowerCase(),
    type: safeString(blog.type || 'General'),
    author: safeString(blog.author || 'Gzone Admin'),
    status: normalizeStatus(blog.status).toLowerCase(),
    views: Number(blog.view_count || blog.views || 0),
    likes: Number(blog.likes || blog.like_count || 0),
    created: safeString(blog.created || blog.publishDate || ''),
    updated: safeString(blog.updated || blog.updatedDate || ''),
    gameTag: safeString(blog.gameTag || ''),
  };
}

export default function BlogsManagement() {
  usePageTheme('admin');

  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data = [], refetch } = useQuery({
    queryKey: ['admin', 'blogs'],
    queryFn: mockApiService.getAllBlogs,
  });

  const blogs = useMemo(() => data.map(normalizeBlog), [data]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');

  const filtered = useMemo(() => {
    return blogs.filter((blog) => {
      const matchesSearch = !search || blog.title.toLowerCase().includes(search.toLowerCase()) || blog.slug.includes(search.toLowerCase());
      const matchesStatus = status === 'all' || blog.status === status;
      const matchesCategory = category === 'all' || blog.category === category;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [blogs, category, search, status]);

  async function removeBlog(id) {
    await mockApiService.deleteBlog(id);
    showToast('Blog removed.', 'success');
    refetch();
  }

  const metrics = [
    { label: 'Total Posts', value: `${blogs.length}` },
    { label: 'Published', value: `${blogs.filter((blog) => blog.status === 'published').length}` },
    { label: 'Drafts', value: `${blogs.filter((blog) => blog.status === 'draft').length}` },
    { label: 'Filtered', value: `${filtered.length}` },
  ];

  return (
    <div className="admin-page-shell admin-table-page">
      <Helmet>
        <title>Blogs Management | GzoneSphere Admin</title>
      </Helmet>

      <AdminPageHero
        kicker="Admin / Blogs"
        title="Blogs Management"
        description="Editorial management for the public blog section, including category filters, status control, featured content settings, and the submission queue placeholder for Phase 2."
        actions={(
          <>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => refetch()}>Refresh</button>
            <button type="button" className="admin-btn" onClick={() => navigate('/admin/blogs/create')}>Create Blog</button>
          </>
        )}
      />

      <AdminMetrics items={metrics} />

      <AdminPanel title="Blogs Management Table" meta="Thumbnail, title, category, type, author, status, views, likes, created, updated, and actions.">
        <div className="admin-filter-bar">
          <input className="admin-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title or slug" />
          <select className="admin-select" value={status} onChange={(event) => setStatus(event.target.value)}>
            {STATUS_FILTERS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <select className="admin-select" value={category} onChange={(event) => setCategory(event.target.value)}>
            {CATEGORY_FILTERS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>

        {filtered.length ? (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Views</th>
                  <th>Likes</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((blog) => (
                  <tr key={blog.id}>
                    <td>
                      <div className="admin-table-title-cell">
                        <strong className="admin-table-title-cell__title">{blog.title}</strong>
                        <span className="admin-table-title-cell__meta">/{blog.slug || 'draft-slug'}</span>
                      </div>
                    </td>
                    <td>{blog.category}</td>
                    <td>{blog.type}</td>
                    <td>{blog.author}</td>
                    <td>
                      <AdminStatusBadge tone={blog.status === 'published' ? 'success' : blog.status === 'draft' ? 'warning' : 'danger'}>
                        {blog.status}
                      </AdminStatusBadge>
                    </td>
                    <td>{blog.views}</td>
                    <td>{blog.likes}</td>
                    <td>{blog.created || '—'}</td>
                    <td>{blog.updated || '—'}</td>
                    <td>
                      <div className="admin-action-row">
                        <button type="button" className="admin-btn admin-btn--ghost" onClick={() => navigate(`/admin/blogs/${blog.id}/edit`)}>Edit</button>
                        <button type="button" className="admin-btn admin-btn--ghost" onClick={() => navigate(`/blog/${blog.slug || blog.id}`)}>View</button>
                        <button type="button" className="admin-btn admin-btn--ghost" onClick={() => removeBlog(blog.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminEmptyState title="No blog posts match the current filters" description="Try widening the category or status filters." />
        )}
      </AdminPanel>

      <AdminPanel title="Featured Content Management" meta="Controls that affect the blog hub and article sidebars.">
        <div className="admin-form-grid cols-2">
          <div className="admin-preview-box">
            <strong>Hero Blog Selection</strong>
            <p>Pick one published article in the editor to power the blog hub hero background.</p>
          </div>
          <div className="admin-preview-box">
            <strong>Featured Sidebar Default</strong>
            <p>Use the single-page editor to define up to 3 fallback featured articles.</p>
          </div>
          <div className="admin-preview-box">
            <strong>Most Read Override</strong>
            <p>Pin one article even if it is not the current top performer by views.</p>
          </div>
          <div className="admin-preview-box">
            <strong>Game Gallery</strong>
            <p>Select games inside the editor to drive the games strip shown on the blog landing page.</p>
          </div>
        </div>
      </AdminPanel>

      <AdminPanel title="Pending Review Queue" meta="Phase 2 placeholder for user blog submissions.">
        <AdminEmptyState
          title="No pending submissions in Phase 1"
          description="When user-generated content is enabled, this panel will show author, title, category, submitted date, and approve/reject/request-changes actions."
        />
      </AdminPanel>
    </div>
  );
}
