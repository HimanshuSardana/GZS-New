import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowUpRight,
  FiBookmark,
  FiHeart,
  FiLink,
  FiMessageSquare,
  FiShare2,
  FiTwitter,
  FiMoreHorizontal,
  FiCheck,
  FiFlag,
  FiSend,
  FiChevronDown,
  FiCornerDownRight,
  FiLoader,
} from 'react-icons/fi';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';

import { usePageTheme } from '@/app/providers/ThemeProvider';
import { useAuth } from '@/app/providers/useAuth';
import { useToast } from '@/shared/components/Toast';
import BlogCard from '../components/BlogCard';
import GameCard from '@/shared/components/GameCard';
import { images } from '@/shared/data/images';
import {
  useBlog,
  useBlogs,
  useBlogComments,
  useCreateComment,
  useLikeComment,
  useReportComment,
  useReadingList,
  useSaveToReadingList,
  useRemoveFromReadingList,
} from '@/services/mutators/useBlogs';
import { adaptBlogRecord } from '@/shared/adapters/contentAdapters';

const HERO_BG = 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=1920';

const ReadingProgress = () => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
      setWidth(scrollPercent);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-[var(--navbar-height,72px)] left-0 w-full h-[3px] z-[100] bg-transparent pointer-events-none">
      <motion.div
        className="h-full bg-[var(--theme-primary)] shadow-[0_0_15px_var(--theme-primary)]"
        style={{ width: `${width}%` }}
        initial={{ width: 0 }}
      />
    </div>
  );
};

// ── Single comment card (used for both top-level and replies) ─────────────────
function CommentCard({ comment, slug, onReply, isReply = false }) {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const likeComment = useLikeComment(slug);
  const reportComment = useReportComment(slug);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.like_count ?? 0);

  function handleLike() {
    if (!isAuthenticated) { showToast('Sign in to like comments', 'info'); return; }
    if (liked) return;
    setLiked(true);
    setLikeCount((n) => n + 1);
    likeComment.mutate(comment.id);
  }

  function handleReport() {
    if (!isAuthenticated) { showToast('Sign in to report comments', 'info'); return; }
    reportComment.mutate(
      { commentId: comment.id, reason: 'other' },
      { onSuccess: () => showToast('Comment reported', 'info') },
    );
  }

  const domainBadge = comment.domain_badge || comment.sub_profile_type || 'Member';
  const avatar = comment.username?.[0]?.toUpperCase() || 'U';
  const timestamp = comment.created_at
    ? new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Recently';

  return (
    <div className={`group relative p-6 bg-[var(--theme-card)]/50 border-2 border-[var(--theme-border)] rounded-[2rem] hover:border-[var(--theme-primary)]/30 transition-all duration-500 ${isReply ? 'rounded-2xl' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] flex items-center justify-center text-xs font-black text-[var(--theme-primary)] italic shadow-inner">
            {avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-[var(--theme-text)] italic uppercase tracking-tight">@{comment.username}</span>
              <span className="text-[8px] font-black bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] px-2 py-0.5 rounded-full uppercase italic border border-[var(--theme-primary)]/20">
                {domainBadge}
              </span>
            </div>
            <span className="text-[10px] font-bold text-[var(--theme-text-muted)] opacity-40 italic">{timestamp}</span>
          </div>
        </div>
        <button
          onClick={handleReport}
          className="text-[var(--theme-text-muted)] hover:text-[var(--status-error)] transition-all opacity-20 hover:opacity-100 p-2"
          title="Report comment"
        >
          <FiFlag size={14} />
        </button>
      </div>

      <p className="text-sm font-bold text-[var(--theme-text)] italic leading-relaxed opacity-90 mb-6">
        {comment.text}
      </p>

      <div className="flex items-center gap-6">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${liked ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)]'}`}
        >
          <FiHeart size={14} fill={liked ? 'currentColor' : 'none'} /> {likeCount}
        </button>
        {!isReply && onReply && (
          <button
            onClick={onReply}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] transition-all"
          >
            Reply
          </button>
        )}
      </div>
    </div>
  );
}

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  usePageTheme('blog');

  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null); // comment id
  const [replyText, setReplyText] = useState('');
  const [sortMethod, setSortMethod] = useState('liked');

  const shareRef = useRef(null);

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data: rawPost, isLoading: postLoading } = useBlog(slug);
  const { data: allBlogs = [], isLoading: blogsLoading } = useBlogs({ limit: 12 });
  const { data: commentsData, isLoading: commentsLoading } = useBlogComments(slug, { sort: sortMethod });
  const { data: readingListData } = useReadingList();

  const createComment = useCreateComment(slug);
  const saveBlog = useSaveToReadingList();
  const unsaveBlog = useRemoveFromReadingList();

  const post = adaptBlogRecord(rawPost);
  const blogItems = allBlogs.map(adaptBlogRecord);
  const loading = postLoading || blogsLoading;

  // Derive comments array from API response
  const comments = commentsData?.data ?? [];

  // Derive isSaved from reading list
  const savedSlugs = readingListData?.items ?? [];
  const isSaved = savedSlugs.includes(slug);
  const isSavePending = saveBlog.isPending || unsaveBlog.isPending;

  // Close share dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (shareRef.current && !shareRef.current.contains(e.target)) {
        setShowShareDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (loading) {
    return (
      <div className="bl-loading-state">
        <div className="bl-loading-state__spinner" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="bl-empty-state">
        <div className="bl-empty-state__card">
          <h1 className="bl-empty-state__title">Post Not Found</h1>
          <Link to="/blog" className="bl-btn-primary">Back to Editorial Hub</Link>
        </div>
      </div>
    );
  }

  const related = blogItems
    .filter((b) => b.category === post.category && b.slug !== slug)
    .slice(0, 3);
  const featuredBase = blogItems.filter((b) => b.featured);
  const featured = (featuredBase.length > 0 ? featuredBase : blogItems).slice(0, 3);
  const wordCount = (post.description || '').split(/\s+/).filter(Boolean).length || 500;
  const readTime = Math.ceil(wordCount / 200);
  const authorName = post.author?.name || post.author_name || 'GzoneSphere Staff';
  const authorPosts = blogItems.filter(
    (b) => (b.author?.name || b.author_name) === authorName && b.slug !== slug,
  );
  const placeholderWhite = 'https://picsum.photos/200/120?random=sidebar';

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleLike = () => setIsLiked(!isLiked);

  const handleSave = () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/blog/${slug}`);
      return;
    }
    if (isSaved) {
      unsaveBlog.mutate(slug, {
        onSuccess: () => showToast('Removed from reading list', 'success'),
        onError: () => showToast('Failed to remove. Try again.', 'error'),
      });
    } else {
      saveBlog.mutate(slug, {
        onSuccess: () => showToast('Saved to reading list!', 'success'),
        onError: () => showToast('Failed to save. Try again.', 'error'),
      });
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Link copied to clipboard!', 'success');
    setShowShareDropdown(false);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    createComment.mutate(
      { text: newComment.trim(), parent_id: null },
      {
        onSuccess: () => {
          setNewComment('');
          showToast('Comment posted!', 'success');
        },
        onError: (err) => {
          const msg = err?.response?.data?.error || 'Failed to post comment.';
          showToast(msg, 'error');
        },
      },
    );
  };

  const handleReplySubmit = (parentId) => {
    if (!replyText.trim()) return;
    createComment.mutate(
      { text: replyText.trim(), parent_id: parentId },
      {
        onSuccess: () => {
          setReplyText('');
          setReplyTo(null);
          showToast('Reply posted!', 'success');
        },
        onError: (err) => {
          const msg = err?.response?.data?.error || 'Failed to post reply.';
          showToast(msg, 'error');
        },
      },
    );
  };

  return (
    <div className="bl-post-page">
      <Helmet>
        <title>{post.title} | GzoneSphere Editorial</title>
        <meta name="description" content={post.description} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.description} />
        <meta property="og:image" content={post.image || HERO_BG} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={window.location.href} />
      </Helmet>

      <ReadingProgress />

      <section className="bl-post-hero">
        <div className="container-global">
          <div className="bl-post-hero__layout">
            <div className="bl-post-hero__content">
              <p className="bl-post-hero__eyebrow">{post.category || 'Editorial'}</p>
              <h1 className="bl-post-hero__title">{post.title}</h1>
              <p className="bl-post-hero__summary">
                {post.description || 'Insights, reviews, and editorial analysis from the GzoneSphere content network.'}
              </p>
              <div className="bl-post-hero__meta">
                <div className="bl-post-hero__author">
                  <img
                    src={post.author?.avatar || 'https://i.pravatar.cc/150?u=gs_gen'}
                    className="bl-post-hero__author-avatar"
                    alt={authorName}
                  />
                  <span>{authorName}</span>
                </div>
                <span>{post.date || 'April 13, 2026'}</span>
                <span>{readTime} min read</span>
              </div>
            </div>
            <div className="bl-post-hero__media">
              <img src={post.image || HERO_BG} className="bl-post-hero__image" alt={post.title} />
            </div>
          </div>
        </div>
      </section>

      <div className="container-global bl-post-shell">
        <div className="bl-post-layout">
          <article className="bl-post-main">
            <div className="bl-post-quote">"{post.description}"</div>

            <div
              className="bl-post-body"
              dangerouslySetInnerHTML={{
                __html: post.content || `
                  <p>In the rapidly evolving landscape of 2026, terminal-based community hubs like GzoneSphere represent the next logical step in digital identity consolidation.</p>
                  <h3>Technical Integration</h3>
                  <p>The core of our strategy relies on high-fidelity proof-of-work modules. Whether it's a verified kill-streak in a tournament or a concept art portfolio submitted through the art domain, every action compounds into a unified identity shard.</p>
                `,
              }}
            />

            {/* ── ENGAGEMENT BAR ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between py-8 my-10 border-y-2 border-[var(--theme-border)] bg-[var(--theme-bg-alt)]/30 px-6 rounded-3xl">
              <div className="flex items-center gap-6">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${isLiked ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'}`}
                >
                  <motion.div animate={isLiked ? { scale: [1, 1.4, 1] } : {}} transition={{ duration: 0.3 }}>
                    <FiHeart size={18} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={3} />
                  </motion.div>
                  {(post.likes || 0) + (isLiked ? 1 : 0)}
                </button>

                <div className="relative" ref={shareRef}>
                  <button
                    onClick={() => setShowShareDropdown(!showShareDropdown)}
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] transition-all"
                  >
                    <FiShare2 size={18} strokeWidth={3} /> Share
                  </button>
                  <AnimatePresence>
                    {showShareDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-0 mb-4 w-48 bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-xl"
                      >
                        <button onClick={copyLink} className="flex w-full items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] hover:bg-[var(--theme-bg-alt)] rounded-xl transition-all">
                          <FiLink size={14} /> Copy Link
                        </button>
                        <button className="flex w-full items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] hover:bg-[var(--theme-bg-alt)] rounded-xl transition-all">
                          <FiTwitter size={14} /> Twitter
                        </button>
                        <button className="flex w-full items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] hover:bg-[var(--theme-bg-alt)] rounded-xl transition-all">
                          <FiMessageSquare size={14} /> Discord
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleSave}
                  disabled={isSavePending}
                  className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-60 ${isSaved ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'}`}
                >
                  {isSavePending
                    ? <FiLoader size={18} strokeWidth={3} className="animate-spin" />
                    : <FiBookmark size={18} fill={isSaved ? 'currentColor' : 'none'} strokeWidth={3} />}
                  {isSaved ? 'Saved!' : 'Save'}
                </button>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="p-2 text-[var(--theme-text-muted)] hover:text-[var(--status-error)] transition-all opacity-40 hover:opacity-100"
                  title="Report Post"
                >
                  <FiFlag size={18} strokeWidth={3} />
                </button>
              </div>
            </div>

            {/* Report Modal */}
            <AnimatePresence>
              {showReportModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 backdrop-blur-sm bg-black/60">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="w-full max-w-md bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-[2.5rem] p-8 shadow-4xl"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-black uppercase italic tracking-tighter text-[var(--theme-text)]">Report_Article</h3>
                      <button onClick={() => setShowReportModal(false)} className="text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] text-2xl leading-none">✕</button>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40 italic">Reason</label>
                        <select className="w-full bg-[var(--theme-bg-alt)] border-2 border-[var(--theme-border)] rounded-2xl px-4 py-3 text-xs font-bold text-[var(--theme-text)] outline-none focus:border-[var(--theme-primary)] uppercase italic">
                          <option>Misleading Information</option>
                          <option>Hate Speech / Harassment</option>
                          <option>Copyright Violation</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40 italic">Additional Details</label>
                        <textarea rows={4} className="w-full bg-[var(--theme-bg-alt)] border-2 border-[var(--theme-border)] rounded-2xl px-4 py-3 text-xs font-bold text-[var(--theme-text)] outline-none focus:border-[var(--theme-primary)] uppercase italic placeholder:opacity-20" placeholder="DESCRIBE_THE_ISSUE..." />
                      </div>
                      <button
                        onClick={() => { showToast('Report submitted for review', 'info'); setShowReportModal(false); }}
                        className="w-full bl-btn-primary"
                      >
                        Submit Report
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* ── COMMENTS SECTION ───────────────────────────────────────────── */}
            <section className="bl-comments mt-16 pt-16 border-t-2 border-[var(--theme-border)]">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                  <h3 className="text-2xl font-black uppercase tracking-tighter italic text-[var(--theme-text)]">Community_Discussion</h3>
                  <span className="bg-[var(--theme-primary)] text-white text-[10px] font-black px-3 py-1 rounded-full italic">
                    {commentsData?.meta?.total ?? comments.length} ENTRIES
                  </span>
                </div>

                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic">
                  <span>SORT_BY:</span>
                  <div className="flex bg-[var(--theme-bg-alt)] p-1 rounded-xl border border-[var(--theme-border)]">
                    <button
                      onClick={() => setSortMethod('liked')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${sortMethod === 'liked' ? 'bg-[var(--theme-card)] text-[var(--theme-primary)] shadow-sm' : 'hover:text-[var(--theme-text)]'}`}
                    >
                      Most Liked
                    </button>
                    <button
                      onClick={() => setSortMethod('recent')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${sortMethod === 'recent' ? 'bg-[var(--theme-card)] text-[var(--theme-primary)] shadow-sm' : 'hover:text-[var(--theme-text)]'}`}
                    >
                      Most Recent
                    </button>
                  </div>
                </div>
              </div>

              {/* Comment Composer */}
              {isAuthenticated ? (
                <form onSubmit={handleCommentSubmit} className="mb-12 p-8 bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-[2.5rem] shadow-xl space-y-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-[var(--theme-primary)] flex items-center justify-center text-lg font-black text-white italic shadow-lg shadow-[var(--theme-primary)]/20 uppercase">
                      {user?.username?.[0] || 'U'}
                    </div>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      maxLength={1000}
                      placeholder="JOIN_THE_CONVERSATION..."
                      className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-[var(--theme-text)] placeholder:text-[var(--theme-text-muted)] placeholder:opacity-30 italic uppercase min-h-[80px] pt-2"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-[var(--theme-text-muted)] opacity-40">{newComment.length}/1000</span>
                    <button
                      type="submit"
                      disabled={createComment.isPending}
                      className="bl-btn-primary !px-8 !py-3 flex items-center gap-2 disabled:opacity-60"
                    >
                      {createComment.isPending
                        ? <FiLoader size={14} className="animate-spin" />
                        : <FiSend size={14} />}
                      Post Comment
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mb-12 p-10 bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-[2.5rem] text-center space-y-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--theme-primary)] to-transparent opacity-30" />
                  <p className="text-sm font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic leading-relaxed">
                    Join the conversation — Sign up or log in to share your thoughts with the community.
                  </p>
                  <Link to="/login" className="bl-btn-primary inline-flex items-center gap-3">
                    Authenticate to Comment <FiArrowUpRight size={18} />
                  </Link>
                </div>
              )}

              {/* Comment List */}
              <div className="space-y-8">
                {commentsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-6 bg-[var(--theme-card)]/50 border-2 border-[var(--theme-border)] rounded-[2rem] animate-pulse">
                      <div className="h-4 w-32 bg-[var(--theme-border)] rounded mb-4" />
                      <div className="h-3 w-full bg-[var(--theme-border)] rounded mb-2" />
                      <div className="h-3 w-3/4 bg-[var(--theme-border)] rounded" />
                    </div>
                  ))
                ) : (
                  <AnimatePresence mode="popLayout">
                    {comments.map((comment, index) => (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(index * 0.05, 0.3) }}
                        className="space-y-4"
                      >
                        <CommentCard
                          comment={comment}
                          slug={slug}
                          onReply={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                        />

                        {/* Nested replies */}
                        {comment.replies?.length > 0 && (
                          <div className="ml-12 space-y-4 border-l-2 border-[var(--theme-border)] pl-8">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="relative">
                                <FiCornerDownRight className="absolute -left-6 top-1/2 -translate-y-1/2 text-[var(--theme-border)]" size={16} />
                                <CommentCard comment={reply} slug={slug} isReply />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply Composer */}
                        <AnimatePresence>
                          {replyTo === comment.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="ml-12 overflow-hidden"
                            >
                              <div className="p-6 bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-2xl mt-4 space-y-4">
                                <textarea
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  maxLength={1000}
                                  placeholder="WRITE_A_REPLY..."
                                  className="w-full bg-transparent border-none outline-none text-xs font-bold text-[var(--theme-text)] placeholder:opacity-30 italic uppercase min-h-[60px]"
                                />
                                <div className="flex justify-end gap-3">
                                  <button onClick={() => setReplyTo(null)} className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] transition-all">Cancel</button>
                                  <button
                                    onClick={() => handleReplySubmit(comment.id)}
                                    disabled={createComment.isPending}
                                    className="px-4 py-2 bg-[var(--theme-primary)] text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-[var(--theme-primary)]/80 transition-all disabled:opacity-60"
                                  >
                                    Post Reply
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}

                {!commentsLoading && comments.length === 0 && (
                  <p className="text-center text-[var(--theme-text-muted)] italic py-12 text-sm">
                    No comments yet. Be the first to start the discussion.
                  </p>
                )}
              </div>
            </section>

            {/* ── AUTHOR CARD ─────────────────────────────────────────────────── */}
            <div className="mt-24 p-10 md:p-12 bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-[3rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-[var(--theme-primary)]/5 rounded-full blur-3xl group-hover:bg-[var(--theme-primary)]/10 transition-colors duration-1000" />
              <div className="relative flex flex-col md:flex-row gap-10 items-start">
                <div className="shrink-0 relative">
                  <div className="absolute inset-0 bg-[var(--theme-primary)]/20 rounded-3xl blur-xl animate-pulse" />
                  <img
                    src={post.author?.avatar || 'https://i.pravatar.cc/150?u=gs_auth'}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-3xl border-4 border-[var(--theme-card)] relative z-10 object-cover shadow-2xl"
                    alt={authorName}
                  />
                </div>
                <div className="flex-1 space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-3xl font-black uppercase italic tracking-tighter text-[var(--theme-text)] leading-none">{authorName}</h3>
                      <span className="text-[10px] font-black bg-[var(--status-success-soft)] text-[var(--status-success)] px-3 py-1 rounded-full uppercase italic border border-[var(--status-success)]/20">Writing Domain</span>
                    </div>
                    <p className="text-sm font-bold text-[var(--theme-text-muted)] italic leading-relaxed max-w-2xl">
                      {post.author?.bio || 'Strategic intelligence lead specializing in community meta-analysis and decentralized reputation systems within the Sphere.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {['EDITORIAL_OPS', 'STRATEGY_NODE', 'COMMUNITY_COORD'].map((skill) => (
                      <span key={skill} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)]/50 text-[9px] font-black text-[var(--theme-text)] uppercase tracking-widest italic">
                        <FiCheck size={10} className="text-[var(--status-success)]" /> {skill}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4 py-6 border-y border-[var(--theme-border)]/50">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--theme-text-muted)] opacity-40 italic mb-1">Posts Published</p>
                      <strong className="text-xl font-black italic text-[var(--theme-text)]">24 ARTICLES</strong>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--theme-text-muted)] opacity-40 italic mb-1">Total Impact</p>
                      <strong className="text-xl font-black italic text-[var(--theme-text)]">52,420 READS</strong>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-6">
                    <button
                      onClick={() => {
                        setIsFollowing(!isFollowing);
                        showToast(isFollowing ? `Unfollowed ${authorName}` : `Following ${authorName}`, 'success');
                      }}
                      className={`min-w-[160px] px-8 py-3 rounded-2xl border-2 font-black uppercase tracking-widest text-xs italic transition-all ${isFollowing ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white' : 'border-[var(--theme-border)] hover:border-[var(--theme-primary)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'}`}
                    >
                      {isFollowing ? 'Following ✓' : 'Follow Author'}
                    </button>
                    <Link
                      to={`/u/${authorName.toLowerCase().replace(/\s+/g, '-')}`}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] transition-all group/link"
                    >
                      View Writing Profile <FiArrowUpRight size={14} className="group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* MOBILE SIDEBAR */}
            <div className="lg:hidden mt-16 space-y-12">
              {post.game_slug && (
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-40">Tagged_Experience</p>
                  <GameCard game={{ slug: post.game_slug, title: post.game_slug.replace('-', ' '), cover_url: images.valorant }} variant="compact" />
                </div>
              )}
              <div className="space-y-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-40">Featured_Editorial</p>
                <div className="grid sm:grid-cols-2 gap-6">
                  {featured.map((item) => <BlogCard key={item.id} blog={item} variant="minimal" />)}
                </div>
              </div>
            </div>
          </article>

          {/* SIDEBAR */}
          <aside className="hidden lg:block bl-post-sidebar lg:sticky lg:top-[calc(var(--navbar-height,72px)+2rem)] self-start h-fit">
            <div className="bl-post-sidebar__stack">
              {post.game_slug && (
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-40 pl-4">Tagged_Experience</p>
                  <GameCard game={{ slug: post.game_slug, title: post.game_slug.replace('-', ' '), cover_url: images.valorant }} variant="compact" />
                </div>
              )}
              <div className="bl-side-card">
                <h4 className="bl-side-card__title">Featured Blogs</h4>
                <div className="bl-side-list">
                  {featured.map((item) => (
                    <Link key={item.id} to={`/blog/${item.slug || item.id}`} className="bl-side-list__item group">
                      <div className="bl-side-list__thumb overflow-hidden">
                        <img src={item.image || placeholderWhite} alt={item.title} className="group-hover:scale-110 transition-transform duration-700" />
                      </div>
                      <div className="bl-side-list__copy">
                        <h6 className="group-hover:text-[var(--theme-primary)] transition-colors">{item.title}</h6>
                        <span>{item.date}</span>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link to="/blog" className="bl-side-card__more group">
                  Explore Hub <FiArrowUpRight size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Link>
              </div>
              <div className="bl-side-card">
                <h4 className="bl-side-card__title">Related Reading</h4>
                <div className="bl-side-list">
                  {related.slice(0, 3).map((item) => (
                    <Link key={item.id} to={`/blog/${item.slug || item.id}`} className="bl-side-list__item group">
                      <div className="bl-side-list__thumb bl-side-list__thumb--sm overflow-hidden">
                        <img src={item.image || placeholderWhite} alt={item.title} className="group-hover:scale-110 transition-transform duration-700" />
                      </div>
                      <div className="bl-side-list__copy">
                        <p className="group-hover:text-[var(--theme-primary)] transition-colors">{item.title}</p>
                        <span>{item.likes || 0} likes</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              {authorPosts.length > 0 && (
                <div className="bl-side-card">
                  <h4 className="bl-side-card__title">Author's Other Posts</h4>
                  <div className="space-y-6 pt-4">
                    {authorPosts.slice(0, 3).map((item) => (
                      <Link key={item.id} to={`/blog/${item.slug || item.id}`} className="block group">
                        <p className="text-sm font-black italic text-[var(--theme-text)] uppercase tracking-tight group-hover:text-[var(--theme-primary)] transition-colors mb-2 leading-tight">{item.title}</p>
                        <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-50">
                          <span>{item.date}</span>
                          <span className="w-1 h-1 bg-[var(--theme-border)] rounded-full" />
                          <span>5 min read</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* RELATED FOOTER */}
      <div className="bl-post-footer">
        <section className="container-global bl-post-footer__related">
          <div className="bl-section-heading">
            <p className="bl-section-heading__eyebrow">Related Reading</p>
            <h2 className="bl-section-heading__title">More from the editorial network</h2>
            <p className="bl-section-heading__description">
              Continue exploring guides, analysis, and opinion pieces connected to this topic.
            </p>
          </div>
          <div className="bl-post-footer__grid">
            {related.length > 0
              ? related.map((item) => <BlogCard key={item.id} blog={item} />)
              : blogItems.slice(0, 3).map((item) => <BlogCard key={item.id} blog={item} />)}
          </div>
        </section>
        <section className="bl-post-cta">
          <div className="container-global bl-post-cta__inner">
            <h2 className="bl-post-cta__title">Have something worth sharing?</h2>
            <p className="bl-post-cta__text">
              Write guides, reviews, or analysis for the GzoneSphere community and build your reputation within the Sphere.
            </p>
            <Link to="/write-blog" className="bl-btn-primary">
              Write a Blog <FiArrowUpRight size={18} />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
