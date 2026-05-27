import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiType, FiSave, FiEye, FiSearch, FiX, 
  FiPlus, FiMove, FiStar, FiTrendingUp, FiLayers,
  FiImage
} from 'react-icons/fi';
import { useToast } from '@/shared/components/Toast';

import { AdminPageHero, AdminPanel, AdminEmptyState } from '../components/AdminContentShell';
import { useBlogs } from '@/services/mutators/useBlogs';
import { useGames } from '@/services/mutators/useGames';

export default function BlogFeaturedContent() {
  const { showToast } = useToast();
  // State
  const [heroBlog, setHeroBlog] = useState(null);
  const [sidebarBlogs, setSidebarBlogs] = useState([]);
  const [mostReadOverride, setMostReadOverride] = useState(null);
  const [categories, setCategories] = useState([
    { id: 'all', label: 'All Intel', enabled: true },
    { id: 'news', label: 'Daily News', enabled: true },
    { id: 'guides', label: 'Pro Guides', enabled: true },
    { id: 'interviews', label: 'Inside Studio', enabled: true },
    { id: 'meta', label: 'Meta Reports', enabled: true },
  ]);
  const [galleryGames, setGalleryGames] = useState([]);
  
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchTarget, setSearchTarget] = useState('sidebar'); // 'hero' | 'sidebar' | 'mostRead' | 'games'
  const [searchQuery, setSearchQuery] = useState('');

  const { data: allBlogs = [] } = useBlogs();
  const { data: allGames = [] } = useGames();

  // Search logic
  const filteredSearchItems = useMemo(() => {
    if (searchTarget === 'games') {
      return allGames.filter(g => g.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return allBlogs.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [allBlogs, allGames, searchQuery, searchTarget]);

  // Drag and Drop (HTML5)
  const handleDragStart = (e, index, type) => {
    e.dataTransfer.setData('index', index);
    e.dataTransfer.setData('type', type);
  };

  const handleDrop = (e, targetIndex, type) => {
    const sourceIndex = parseInt(e.dataTransfer.getData('index'));
    const sourceType = e.dataTransfer.getData('type');
    if (sourceType !== type) return;

    if (type === 'sidebar') {
      const newList = [...sidebarBlogs];
      const [movedItem] = newList.splice(sourceIndex, 1);
      newList.splice(targetIndex, 0, movedItem);
      setSidebarBlogs(newList);
    } else if (type === 'categories') {
      const newList = [...categories];
      const [movedItem] = newList.splice(sourceIndex, 1);
      newList.splice(targetIndex, 0, movedItem);
      setCategories(newList);
    } else if (type === 'games') {
      const newList = [...galleryGames];
      const [movedItem] = newList.splice(sourceIndex, 1);
      newList.splice(targetIndex, 0, movedItem);
      setGalleryGames(newList);
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  // Handlers
  const handleSave = () => {
    showToast('Blog featured content published!', 'success');
  };

  const openSearch = (target) => {
    setSearchTarget(target);
    setIsSearchModalOpen(true);
    setSearchQuery('');
  };

  const selectFromSearch = (item) => {
    if (searchTarget === 'hero') {
      setHeroBlog(item);
    } else if (searchTarget === 'mostRead') {
      setMostReadOverride(item);
    } else if (searchTarget === 'sidebar') {
      if (sidebarBlogs.find(b => b.id === item.id)) return showToast('Already in sidebar', 'info');
      if (sidebarBlogs.length >= 3) return showToast('Max 3 sidebar blogs allowed', 'warning');
      setSidebarBlogs([...sidebarBlogs, item]);
    } else if (searchTarget === 'games') {
      if (galleryGames.find(g => g.id === item.id)) return showToast('Already in gallery', 'info');
      setGalleryGames([...galleryGames, item]);
    }
    setIsSearchModalOpen(false);
  };

  return (
    <div className="admin-page-blogs-featured theme-admin pb-20">
      <Helmet><title>Blog Curation | Admin</title></Helmet>

      {/* STICKY SAVE BAR */}
      <div className="sticky top-0 z-50 bg-[var(--theme-bg)]/80 backdrop-blur-md border-b border-[var(--theme-border)] px-8 py-4 mb-8 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <FiStar className="text-[var(--theme-primary)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--theme-text-muted)] italic">Editorial Control Panel</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] text-xs font-black uppercase tracking-widest text-[var(--theme-text)] hover:text-[var(--theme-primary)] transition-all"
            onClick={() => window.open('/blog', '_blank')}
          >
            <FiEye /> View Hub
          </button>
          <button 
            className="flex items-center gap-2 px-8 py-2 rounded-xl bg-[var(--theme-primary)] text-black text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-[var(--theme-primary)]/20"
            onClick={handleSave}
          >
            <FiSave /> Publish Changes
          </button>
        </div>
      </div>

      <div className="px-8 md:px-12">
        <AdminPageHero 
          kicker="Editorial Strategy"
          title="Blog_Featured_Mgmt"
          description="Control the narrative. Manage hero placements, sidebar curation, and cross-platform game integrations on the GzoneSphere Intel Hub."
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 1. HERO BLOG SELECTION */}
          <div className="lg:col-span-2">
            <AdminPanel title="Hero Spotlight" meta="Primary banner on Blogs Hub">
              <div className="relative aspect-video rounded-[2.5rem] border-2 border-[var(--theme-border)] overflow-hidden bg-[var(--theme-bg-alt)] group">
                {heroBlog ? (
                  <>
                    <img src={heroBlog.image_url} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute bottom-10 left-10 right-10 space-y-2">
                      <span className="px-3 py-1 bg-[var(--theme-primary)] text-black text-[10px] font-black uppercase tracking-widest italic rounded-md">{heroBlog.category}</span>
                      <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">{heroBlog.title}</h3>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-[var(--theme-text-muted)] opacity-30">
                    <FiImage size={48} />
                    <p className="text-sm font-black uppercase tracking-widest italic">No Hero Selected</p>
                  </div>
                )}
                <div className="absolute top-6 right-6 flex gap-2">
                   <button 
                    onClick={() => openSearch('hero')}
                    className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest italic rounded-xl hover:bg-[var(--theme-primary)] hover:text-black transition-all"
                  >
                    Change Hero Intel
                  </button>
                </div>
              </div>
            </AdminPanel>
          </div>

          {/* 3. MOST READ OVERRIDE */}
          <div className="lg:col-span-1">
            <AdminPanel title="Pinned Viral Intel" meta="Fixed 'Most Read' slot #1">
              <div className="p-8 rounded-[2rem] bg-[var(--theme-bg-alt)] border-2 border-dashed border-[var(--theme-border)] flex flex-col items-center text-center gap-4">
                {mostReadOverride ? (
                  <div className="w-full">
                    <FiTrendingUp className="text-[var(--theme-primary)] mx-auto mb-4" size={32} />
                    <h4 className="text-sm font-black uppercase italic tracking-tighter text-[var(--theme-text)] mb-1">{mostReadOverride.title}</h4>
                    <p className="text-[10px] font-bold text-[var(--theme-text-muted)] opacity-40 uppercase tracking-widest mb-6">Pinned Strategy</p>
                    <button onClick={() => setMostReadOverride(null)} className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:underline">Clear Override</button>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-muted)] opacity-30">
                      <FiTrendingUp size={24} />
                    </div>
                    <p className="text-[10px] font-bold text-[var(--theme-text-muted)] opacity-40 italic">System currently uses real view counts. <br/>Pin a blog to override.</p>
                  </>
                )}
                {!mostReadOverride && (
                  <button onClick={() => openSearch('mostRead')} className="gzs-btn-primary !px-6 py-2 text-[10px] font-black uppercase tracking-widest">Pin Intel</button>
                )}
              </div>
            </AdminPanel>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 2. GLOBAL FEATURED SIDEBAR */}
          <AdminPanel title="Global Sidebar Feed" meta="Pick 3 blogs for the sidebar • Drag to reorder">
            <div className="space-y-4">
              {sidebarBlogs.map((blog, idx) => (
                <div 
                  key={blog.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx, 'sidebar')}
                  onDrop={(e) => handleDrop(e, idx, 'sidebar')}
                  onDragOver={handleDragOver}
                  className="p-4 rounded-2xl bg-[var(--theme-card)] border border-[var(--theme-border)] flex items-center gap-4 group hover:border-[var(--theme-primary)]/40 transition-all cursor-move"
                >
                  <FiMove className="text-[var(--theme-text-muted)] opacity-20 group-hover:opacity-100" />
                  <img src={blog.image_url} className="w-12 h-12 rounded-lg object-cover" alt="" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black uppercase italic tracking-tighter text-[var(--theme-text)] truncate">{blog.title}</h4>
                  </div>
                  <button onClick={() => setSidebarBlogs(sidebarBlogs.filter(b => b.id !== blog.id))} className="text-[var(--theme-text-muted)] hover:text-red-500 transition-colors">
                    <FiX size={16} />
                  </button>
                </div>
              ))}
              {sidebarBlogs.length < 3 && (
                <button 
                  onClick={() => openSearch('sidebar')}
                  className="w-full h-16 rounded-2xl border-2 border-dashed border-[var(--theme-border)] flex items-center justify-center gap-3 text-[var(--theme-text-muted)] hover:border-[var(--theme-primary)]/40 hover:text-[var(--theme-primary)] transition-all bg-[var(--theme-bg-alt)]/20"
                >
                  <FiPlus /> <span className="text-[10px] font-black uppercase tracking-widest italic">Add Sidebar Blog</span>
                </button>
              )}
            </div>
          </AdminPanel>

          {/* 4. CATEGORY DISPLAY ORDER */}
          <AdminPanel title="Category Sequence" meta="Drag to reorder listing tabs">
            <div className="space-y-3">
              {categories.map((cat, idx) => (
                <div 
                  key={cat.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx, 'categories')}
                  onDrop={(e) => handleDrop(e, idx, 'categories')}
                  onDragOver={handleDragOver}
                  className="p-4 rounded-2xl bg-[var(--theme-bg-alt)]/40 border border-[var(--theme-border)] flex items-center justify-between group cursor-move"
                >
                  <div className="flex items-center gap-4">
                    <FiLayers className="text-[var(--theme-text-muted)] opacity-20 group-hover:opacity-100" />
                    <span className="text-xs font-black uppercase italic tracking-widest text-[var(--theme-text)]">{cat.label}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-[var(--status-success)] shadow-[0_0_8px_var(--status-success)]" />
                    <span className="text-[8px] font-black uppercase text-[var(--theme-text-muted)] opacity-40">Active</span>
                  </div>
                </div>
              ))}
            </div>
          </AdminPanel>
        </div>

        {/* 5. GAME GALLERY IN BLOGS */}
        <AdminPanel title="Interconnected Games Strip" meta="Select games to feature in the blog listing gallery">
          <div className="flex flex-wrap gap-4 mb-8">
            {galleryGames.map((game, idx) => (
              <div 
                key={game.id}
                draggable
                onDragStart={(e) => handleDragStart(e, idx, 'games')}
                onDrop={(e) => handleDrop(e, idx, 'games')}
                onDragOver={handleDragOver}
                className="relative w-24 h-32 rounded-xl border border-[var(--theme-border)] overflow-hidden group cursor-move"
              >
                <img src={game.cover_url} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all" alt="" />
                <button 
                  onClick={() => setGalleryGames(galleryGames.filter(g => g.id !== game.id))}
                  className="absolute top-1 right-1 w-6 h-6 rounded bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                >
                  <FiX size={12} />
                </button>
              </div>
            ))}
            <button 
              onClick={() => openSearch('games')}
              className="w-24 h-32 rounded-xl border-2 border-dashed border-[var(--theme-border)] flex flex-col items-center justify-center gap-2 text-[var(--theme-text-muted)] hover:border-[var(--theme-primary)]/50 hover:text-[var(--theme-primary)] transition-all bg-[var(--theme-bg-alt)]/20"
            >
              <FiPlus />
              <span className="text-[8px] font-black uppercase italic">Add</span>
            </button>
          </div>
          {galleryGames.length === 0 && <AdminEmptyState title="No games linked" description="Feature relevant games to bridge content and play." />}
        </AdminPanel>
      </div>

      {/* SEARCH MODAL (Reuse pattern from GamesHubSettings) */}
      <AnimatePresence>
        {isSearchModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsSearchModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-[3rem] overflow-hidden shadow-2xl">
              <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black uppercase tracking-tighter italic text-[var(--theme-text)]">Search_Intel</h3>
                  <button onClick={() => setIsSearchModalOpen(false)} className="w-10 h-10 rounded-full bg-[var(--theme-bg-alt)] flex items-center justify-center text-[var(--theme-text-muted)] hover:text-white transition-all"><FiX size={20} /></button>
                </div>
                <div className="relative mb-8">
                  <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)]" />
                  <input type="text" placeholder={`Search ${searchTarget === 'games' ? 'games' : 'blogs'}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] rounded-2xl py-4 pl-14 pr-6 text-sm text-[var(--theme-text)] outline-none focus:border-[var(--theme-primary)]" autoFocus />
                </div>
                <div className="max-h-[400px] overflow-y-auto space-y-2 pr-4">
                  {filteredSearchItems.map(item => (
                    <button key={item.id} onClick={() => selectFromSearch(item)} className="w-full p-4 rounded-2xl border border-[var(--theme-border)] hover:border-[var(--theme-primary)]/40 hover:bg-[var(--theme-primary)]/5 flex items-center gap-4 text-left transition-all group">
                      <img src={item.cover_url || item.image_url} className="w-12 h-12 rounded-lg object-cover" alt="" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black uppercase italic tracking-tighter text-[var(--theme-text)] group-hover:text-[var(--theme-primary)] transition-colors truncate">{item.title}</p>
                        <p className="text-[10px] font-bold text-[var(--theme-text-muted)] opacity-40 uppercase tracking-widest">{item.category || item.developer}</p>
                      </div>
                      <FiPlus />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
