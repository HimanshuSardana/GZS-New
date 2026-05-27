import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid, FiSave, FiEye, FiPlus, FiX,
  FiMove, FiSearch, FiTrendingUp,
  FiLayout, FiRefreshCw, FiToggleLeft, FiToggleRight,
} from 'react-icons/fi';
import { useToast } from '@/shared/components/Toast';
import { AdminPageHero, AdminPanel, AdminEmptyState } from '../components/AdminContentShell';
import { useGames } from '@/services/mutators/useGames';
import { useBlogs } from '@/services/mutators/useBlogs';
import Skeleton from '@/shared/components/Skeleton';
import gamesService from '@/services/features/gamesService';

/* Same category list as the public GamePostCollection.jsx hub page */
const ALL_CATEGORIES = [
  'Action', 'Arcade', 'Shooter', 'FPS', 'Battle Royale',
  'RPG', 'MMORPG', 'Strategy', 'Simulation', 'Racing',
  'Sports', 'Fighting', 'Platformer', 'Puzzle', 'Horror',
  'Adventure', 'Open World', 'Sandbox', 'Mobile', 'VR/AR',
  'Indie', 'Educational',
];

const DEFAULT_CATEGORIES = ALL_CATEGORIES.map(name => ({ name, enabled: true }));

export default function GamesHubSettings() {
  const { showToast } = useToast();

  /* ── Internal state — game / blog objects for display ── */
  const [featuredGames,    setFeaturedGames]    = useState([]);
  const [galleryAutoScroll, setGalleryAutoScroll] = useState(false);
  const [pinnedTrending,   setPinnedTrending]   = useState([null, null]);
  const [showCategoryTabs, setShowCategoryTabs] = useState(true);
  const [categories,       setCategories]       = useState(DEFAULT_CATEGORIES);
  const [blogsGridMode,    setBlogsGridMode]    = useState('auto');
  const [selectedBlogs,    setSelectedBlogs]    = useState([]);

  /* ── Pending slug resolution (set during load, resolved when allGames/allBlogs arrives) ── */
  const [pendingGallerySlugs, setPendingGallerySlugs] = useState(null);
  const [pendingPinnedSlugs,  setPendingPinnedSlugs]  = useState(null);
  const [pendingBlogSlugs,    setPendingBlogSlugs]    = useState(null);

  const [isLoading,       setIsLoading]       = useState(true);
  const [isSaving,        setIsSaving]        = useState(false);
  const [lastSaved,       setLastSaved]       = useState(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchTarget,    setSearchTarget]    = useState('gallery');
  const [searchQuery,     setSearchQuery]     = useState('');

  /* ── Data ── */
  const { data: allGames = [] } = useGames();
  const { data: allBlogs = [] } = useBlogs();

  /* ── Load hub settings ── */
  useEffect(() => {
    gamesService.getHubSettings('games').then(response => {
      const s = response?.data ?? response ?? {};

      if (s.gallery_auto_scroll !== undefined) setGalleryAutoScroll(Boolean(s.gallery_auto_scroll));
      if (s.show_category_tabs !== undefined) setShowCategoryTabs(Boolean(s.show_category_tabs));

      if (Array.isArray(s.gallery_game_slugs) && s.gallery_game_slugs.length)
        setPendingGallerySlugs(s.gallery_game_slugs);

      if (Array.isArray(s.trending_pinned_slugs))
        setPendingPinnedSlugs([s.trending_pinned_slugs[0] ?? null, s.trending_pinned_slugs[1] ?? null]);

      if (Array.isArray(s.categories_config) && s.categories_config.length)
        setCategories(s.categories_config);

      if (s.blogs_grid_mode) setBlogsGridMode(s.blogs_grid_mode);

      if (Array.isArray(s.blogs_grid_manual_slugs) && s.blogs_grid_manual_slugs.length)
        setPendingBlogSlugs(s.blogs_grid_manual_slugs);
    }).finally(() => setIsLoading(false));
  }, []);

  /* ── Resolve pending game slugs once allGames is available ── */
  useEffect(() => {
    if (!allGames.length || pendingGallerySlugs === null) return;
    setFeaturedGames(pendingGallerySlugs.map(slug => allGames.find(g => g.slug === slug)).filter(Boolean));
    setPendingGallerySlugs(null);
  }, [allGames, pendingGallerySlugs]);

  useEffect(() => {
    if (!allGames.length || pendingPinnedSlugs === null) return;
    setPinnedTrending([
      pendingPinnedSlugs[0] ? (allGames.find(g => g.slug === pendingPinnedSlugs[0]) ?? null) : null,
      pendingPinnedSlugs[1] ? (allGames.find(g => g.slug === pendingPinnedSlugs[1]) ?? null) : null,
    ]);
    setPendingPinnedSlugs(null);
  }, [allGames, pendingPinnedSlugs]);

  useEffect(() => {
    if (!allBlogs.length || pendingBlogSlugs === null) return;
    setSelectedBlogs(pendingBlogSlugs.map(slug => allBlogs.find(b => b.slug === slug)).filter(Boolean));
    setPendingBlogSlugs(null);
  }, [allBlogs, pendingBlogSlugs]);

  /* ── Search filtering ── */
  const filteredSearchItems = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (searchTarget === 'blogs') return allBlogs.filter(b => b.title.toLowerCase().includes(q));
    return allGames.filter(g => g.title.toLowerCase().includes(q));
  }, [allGames, allBlogs, searchQuery, searchTarget]);

  /* ── Drag-and-drop (HTML5) ── */
  const handleDragStart = (e, index, type) => {
    e.dataTransfer.setData('index', index);
    e.dataTransfer.setData('type', type);
  };

  const handleDrop = (e, targetIndex, type) => {
    const sourceIndex = parseInt(e.dataTransfer.getData('index'));
    const sourceType  = e.dataTransfer.getData('type');
    if (sourceType !== type) return;
    if (type === 'gallery') {
      const next = [...featuredGames];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      setFeaturedGames(next);
    } else if (type === 'categories') {
      const next = [...categories];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      setCategories(next);
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  /* ── Handlers ── */
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        gallery_game_slugs:     featuredGames.map(g => g.slug || g.id).filter(Boolean),
        gallery_auto_scroll:    galleryAutoScroll,
        trending_pinned_slugs:  pinnedTrending.filter(Boolean).map(g => g.slug || g.id),
        show_category_tabs:     showCategoryTabs,
        categories_config:      categories.map(c => ({ name: c.name, enabled: c.enabled })),
        blogs_grid_mode:        blogsGridMode,
        blogs_grid_manual_slugs: selectedBlogs.map(b => b.slug || b.id).filter(Boolean),
      };
      await gamesService.saveHubSettings('games', payload);
      showToast({ type: 'success', message: 'Hub settings saved.' });
      setLastSaved(new Date());
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to save settings.';
      showToast({ type: 'error', message: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const openSearch = (target) => {
    setSearchTarget(target);
    setIsSearchModalOpen(true);
    setSearchQuery('');
  };

  const addFromSearch = (item) => {
    if (searchTarget === 'gallery') {
      if (featuredGames.find(g => g.id === item.id)) { showToast('Already in gallery', 'info'); return; }
      if (featuredGames.length >= 12) { showToast('Max 12 games allowed', 'warning'); return; }
      setFeaturedGames([...featuredGames, item]);
    } else if (searchTarget === 'pin1') {
      const n = [...pinnedTrending]; n[0] = item; setPinnedTrending(n);
    } else if (searchTarget === 'pin2') {
      const n = [...pinnedTrending]; n[1] = item; setPinnedTrending(n);
    } else if (searchTarget === 'blogs') {
      if (selectedBlogs.find(b => b.id === item.id)) { showToast('Already selected', 'info'); return; }
      if (selectedBlogs.length >= 6) { showToast('Max 6 blogs allowed', 'warning'); return; }
      setSelectedBlogs([...selectedBlogs, item]);
    }
    setIsSearchModalOpen(false);
  };

  const removeFeatured = (id) => setFeaturedGames(featuredGames.filter(g => g.id !== id));
  const removeBlog     = (id) => setSelectedBlogs(selectedBlogs.filter(b => b.id !== id));
  const toggleCategory = (name) => setCategories(categories.map(c => c.name === name ? { ...c, enabled: !c.enabled } : c));

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <div className="admin-page-games-hub theme-admin pb-20">
        <Helmet><title>Games Hub Settings | Admin</title></Helmet>
        <div className="px-8 md:px-12 space-y-8 pt-8">
          <Skeleton height="80px"  rounded="lg" animate="shimmer" />
          <Skeleton height="420px" rounded="lg" animate="shimmer" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <Skeleton height="300px" rounded="lg" animate="shimmer" />
            <Skeleton height="300px" rounded="lg" animate="shimmer" />
          </div>
          <Skeleton height="200px" rounded="lg" animate="shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-games-hub theme-admin pb-20">
      <Helmet><title>Games Hub Settings | Admin</title></Helmet>

      {/* STICKY SAVE BAR */}
      <div className="sticky top-0 z-50 bg-[var(--theme-bg)]/80 backdrop-blur-md border-b border-[var(--theme-border)] px-8 py-4 mb-8 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <FiLayout className="text-[var(--theme-primary)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--theme-text-muted)] italic">Hub Configuration Module</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] text-xs font-black uppercase tracking-widest text-[var(--theme-text)] hover:text-[var(--theme-primary)] transition-all"
            onClick={() => window.open('/games', '_blank')}
          >
            <FiEye /> Preview Hub
          </button>
          {lastSaved && (
            <span className="text-[10px] text-[var(--theme-text-muted)] italic">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button
            className="flex items-center gap-2 px-8 py-2 rounded-xl bg-[var(--theme-primary)] text-black text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-[var(--theme-primary)]/20 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <FiRefreshCw className="animate-spin" /> : <FiSave />}
            {isSaving ? 'Saving…' : 'Save All Settings'}
          </button>
        </div>
      </div>

      <div className="px-8 md:px-12">
        <AdminPageHero
          kicker="Platform Curation"
          title="Games_Hub_Settings"
          description="Manage the public Games Hub experience — curated galleries, trending pins, category tabs, and editorial blog placements."
        />

        {/* ── SECTION A: GAME GALLERY CAROUSEL ── */}
        <AdminPanel title="Game Gallery Carousel" meta={`${featuredGames.length} / 12 slots used`}>
          {/* Auto-scroll toggle */}
          <div className="flex items-center justify-between p-5 mb-8 rounded-2xl bg-[var(--theme-bg-alt)]/40 border border-[var(--theme-border)]">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-text)] italic">Enable auto-scroll</p>
              <p className="text-[10px] font-bold text-[var(--theme-text-muted)] opacity-50 mt-1">Carousel advances automatically on the public hub page</p>
            </div>
            <button
              type="button"
              onClick={() => setGalleryAutoScroll(v => !v)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${galleryAutoScroll ? 'bg-[var(--theme-primary)]/10 border-[var(--theme-primary)]/40 text-[var(--theme-primary)]' : 'bg-[var(--theme-bg-alt)] border-[var(--theme-border)] text-[var(--theme-text-muted)]'}`}
            >
              {galleryAutoScroll ? <FiToggleRight size={16} /> : <FiToggleLeft size={16} />}
              {galleryAutoScroll ? 'On' : 'Off'}
            </button>
          </div>

          {/* Game grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-4">
            {featuredGames.map((game, idx) => (
              <div
                key={game.id}
                draggable
                onDragStart={(e) => handleDragStart(e, idx, 'gallery')}
                onDrop={(e) => handleDrop(e, idx, 'gallery')}
                onDragOver={handleDragOver}
                className="relative aspect-[3/4] rounded-2xl border-2 border-[var(--theme-border)] overflow-hidden group cursor-move hover:border-[var(--theme-primary)]/50 transition-all"
              >
                <img src={game.cover_url || game.banner_url} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all" alt={game.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <button
                  onClick={() => removeFeatured(game.id)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
                >
                  <FiX />
                </button>
                <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all">
                  <p className="text-[10px] font-black uppercase tracking-tighter text-white truncate italic">{game.title}</p>
                </div>
                <div className="absolute top-2 left-2 w-6 h-6 rounded bg-black/40 text-white flex items-center justify-center opacity-40">
                  <FiMove size={12} />
                </div>
              </div>
            ))}

            {featuredGames.length < 12 ? (
              <button
                onClick={() => openSearch('gallery')}
                className="aspect-[3/4] rounded-2xl border-2 border-dashed border-[var(--theme-border)] flex flex-col items-center justify-center gap-3 text-[var(--theme-text-muted)] hover:border-[var(--theme-primary)]/50 hover:text-[var(--theme-primary)] transition-all bg-[var(--theme-bg-alt)]/30 group"
              >
                <div className="w-10 h-10 rounded-full bg-[var(--theme-border)] flex items-center justify-center group-hover:bg-[var(--theme-primary)]/10 transition-colors">
                  <FiPlus size={20} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest italic">Add Game</span>
              </button>
            ) : (
              <div className="aspect-[3/4] rounded-2xl border-2 border-[var(--theme-primary)]/30 bg-[var(--theme-primary)]/5 flex flex-col items-center justify-center gap-2">
                <FiGrid className="text-[var(--theme-primary)] opacity-60" size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-primary)] opacity-60">12/12 max</span>
              </div>
            )}
          </div>

          {featuredGames.length === 0 && (
            <AdminEmptyState title="No games in gallery" description="Select games to appear in the top carousel." />
          )}
        </AdminPanel>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* ── SECTION B: TRENDING OVERRIDE (PIN) ── */}
          <AdminPanel title="Trending Override (Pin)" meta="Pin up to 2 games to always appear at top of Trending regardless of algorithm score.">
            <div className="space-y-6">
              {[0, 1].map(slot => (
                <div key={slot} className="p-6 rounded-[2rem] bg-[var(--theme-bg-alt)]/40 border border-[var(--theme-border)] flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] flex items-center justify-center font-black italic">
                      #{slot + 1}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40 mb-1">Pinned Position {slot + 1}</p>
                      {pinnedTrending[slot] ? (
                        <h4 className="text-sm font-black uppercase italic tracking-tighter text-[var(--theme-text)]">{pinnedTrending[slot].title}</h4>
                      ) : (
                        <h4 className="text-sm font-bold text-[var(--theme-text-muted)] italic opacity-30">No game pinned</h4>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {pinnedTrending[slot] && (
                      <button
                        onClick={() => { const n = [...pinnedTrending]; n[slot] = null; setPinnedTrending(n); }}
                        className="px-4 py-2 rounded-xl border border-[var(--theme-border)] text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      onClick={() => openSearch(slot === 0 ? 'pin1' : 'pin2')}
                      className="px-4 py-2 rounded-xl bg-[var(--theme-primary)] text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
                    >
                      {pinnedTrending[slot] ? 'Replace' : 'Select Game'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </AdminPanel>

          {/* ── SECTION C: CATEGORY TABS ── */}
          <AdminPanel title="Category Tabs" meta="Drag to reorder · Toggle to show/hide on the hub page">
            {/* Top-level show/hide toggle for the entire category tabs section */}
            <div className="flex items-center justify-between p-5 mb-6 rounded-2xl bg-[var(--theme-bg-alt)]/40 border border-[var(--theme-border)]">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-text)] italic">Show genre category tabs on the hub page</p>
                <p className="text-[10px] font-bold text-[var(--theme-text-muted)] opacity-50 mt-1">When off, the category filter row is hidden entirely on the public hub</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCategoryTabs(v => !v)}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${showCategoryTabs ? 'bg-[var(--theme-primary)]/10 border-[var(--theme-primary)]/40 text-[var(--theme-primary)]' : 'bg-[var(--theme-bg-alt)] border-[var(--theme-border)] text-[var(--theme-text-muted)]'}`}
              >
                {showCategoryTabs ? <FiToggleRight size={16} /> : <FiToggleLeft size={16} />}
                {showCategoryTabs ? 'On' : 'Off'}
              </button>
            </div>

            <div className="space-y-3">
              {categories.map((cat, idx) => (
                <div
                  key={cat.name}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx, 'categories')}
                  onDrop={(e) => handleDrop(e, idx, 'categories')}
                  onDragOver={handleDragOver}
                  className="p-4 rounded-2xl bg-[var(--theme-card)] border border-[var(--theme-border)] flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <FiMove className="text-[var(--theme-text-muted)] opacity-20 cursor-move group-hover:opacity-100 transition-opacity" />
                    <span className={`text-xs font-black uppercase tracking-widest italic ${cat.enabled ? 'text-[var(--theme-text)]' : 'text-[var(--theme-text-muted)] opacity-30 line-through'}`}>
                      {cat.name}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={cat.enabled} onChange={() => toggleCategory(cat.name)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-[var(--theme-bg-alt)] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--theme-primary)]" />
                  </label>
                </div>
              ))}
            </div>
          </AdminPanel>
        </div>

        {/* ── SECTION D: BLOGS & GUIDES GRID ── */}
        <AdminPanel title="Blogs & Guides Grid" meta="Featured editorial section on the hub page">
          <div className="flex items-center gap-10 mb-10 pb-10 border-b border-[var(--theme-border)]">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="radio" name="blogType" checked={blogsGridMode === 'auto'} onChange={() => setBlogsGridMode('auto')} className="w-5 h-5 accent-[var(--theme-primary)]" />
              <div className="space-y-1">
                <span className="text-sm font-black uppercase italic tracking-tighter text-[var(--theme-text)] group-hover:text-[var(--theme-primary)] transition-colors">Automatic (most recent blogs tagged to games)</span>
                <p className="text-[10px] font-bold text-[var(--theme-text-muted)] opacity-40 italic">Shows 6 most recent games-tagged blogs</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="radio" name="blogType" checked={blogsGridMode === 'manual'} onChange={() => setBlogsGridMode('manual')} className="w-5 h-5 accent-[var(--theme-primary)]" />
              <div className="space-y-1">
                <span className="text-sm font-black uppercase italic tracking-tighter text-[var(--theme-text)] group-hover:text-[var(--theme-primary)] transition-colors">Manual Selection</span>
                <p className="text-[10px] font-bold text-[var(--theme-text-muted)] opacity-40 italic">Pick specific blogs to showcase (up to 6)</p>
              </div>
            </label>
          </div>

          <AnimatePresence mode="wait">
            {blogsGridMode === 'manual' ? (
              <motion.div
                key="manual"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {selectedBlogs.map(blog => (
                  <div key={blog.id} className="p-4 rounded-2xl bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] flex gap-4 group">
                    <img src={blog.image_url || blog.featured_image_url} className="w-20 h-20 rounded-xl object-cover" alt={blog.title} />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black uppercase italic tracking-tighter text-[var(--theme-text)] truncate">{blog.title}</h4>
                      <p className="text-[9px] font-bold text-[var(--theme-text-muted)] opacity-40 uppercase tracking-widest mt-1">{blog.category}</p>
                      <button onClick={() => removeBlog(blog.id)} className="mt-2 text-[9px] font-black uppercase tracking-widest text-red-500 hover:underline">Remove</button>
                    </div>
                  </div>
                ))}
                {selectedBlogs.length < 6 && (
                  <button
                    onClick={() => openSearch('blogs')}
                    className="h-24 rounded-2xl border-2 border-dashed border-[var(--theme-border)] flex items-center justify-center gap-4 text-[var(--theme-text-muted)] hover:border-[var(--theme-primary)]/50 hover:text-[var(--theme-primary)] transition-all bg-[var(--theme-bg-alt)]/20"
                  >
                    <FiPlus /> <span className="text-[10px] font-black uppercase tracking-widest italic">Feature Blog</span>
                  </button>
                )}
                {selectedBlogs.length === 0 && (
                  <AdminEmptyState title="No blogs selected" description="Use Feature Blog to pick specific posts." />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-10 text-center bg-[var(--theme-bg-alt)]/20 rounded-[2rem] border-2 border-dashed border-[var(--theme-border)]"
              >
                <FiTrendingUp className="mx-auto mb-4 text-[var(--theme-primary)] opacity-40" size={32} />
                <p className="text-xs font-bold text-[var(--theme-text-muted)] italic opacity-40">System will dynamically pull the latest games-related blogs.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </AdminPanel>
      </div>

      {/* SEARCH MODAL */}
      <AnimatePresence>
        {isSearchModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
              onClick={() => setIsSearchModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black uppercase tracking-tighter italic text-[var(--theme-text)]">
                    Search_&_<span className="text-[var(--theme-primary)]">Select</span>
                  </h3>
                  <button onClick={() => setIsSearchModalOpen(false)} className="w-10 h-10 rounded-full bg-[var(--theme-bg-alt)] flex items-center justify-center text-[var(--theme-text-muted)] hover:text-white transition-all">
                    <FiX size={20} />
                  </button>
                </div>

                <div className="relative mb-8">
                  <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)]" />
                  <input
                    type="text"
                    placeholder={`Search ${searchTarget === 'blogs' ? 'blogs' : 'games'}…`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] rounded-2xl py-4 pl-14 pr-6 text-sm text-[var(--theme-text)] outline-none focus:border-[var(--theme-primary)]"
                    autoFocus
                  />
                </div>

                <div className="max-h-[400px] overflow-y-auto space-y-2 pr-4">
                  {filteredSearchItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => addFromSearch(item)}
                      className="w-full p-4 rounded-2xl border border-[var(--theme-border)] hover:border-[var(--theme-primary)]/40 hover:bg-[var(--theme-primary)]/5 flex items-center gap-4 text-left transition-all group"
                    >
                      <img src={item.cover_url || item.image_url || item.featured_image_url} className="w-12 h-12 rounded-lg object-cover" alt="" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black uppercase italic tracking-tighter text-[var(--theme-text)] group-hover:text-[var(--theme-primary)] transition-colors truncate">{item.title}</p>
                        <p className="text-[10px] font-bold text-[var(--theme-text-muted)] opacity-40 uppercase tracking-widest">{item.developer || item.category || 'Platform Content'}</p>
                      </div>
                      <FiPlus className="text-[var(--theme-text-muted)] group-hover:text-[var(--theme-primary)] transition-colors shrink-0" />
                    </button>
                  ))}
                  {filteredSearchItems.length === 0 && (
                    <div className="py-20 text-center opacity-30 italic font-bold text-sm">No results for "{searchQuery}"</div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
