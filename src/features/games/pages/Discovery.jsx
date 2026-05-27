import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { 
  FiCompass, FiSearch, FiZap, FiArrowRight, 
  FiHeart, FiMessageCircle, FiPlus, FiCalendar,
  FiLayout, FiEdit3, FiAward, FiStar
} from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';

import { usePageTheme } from '@/app/providers/ThemeProvider';
import { useGames } from '@/services/mutators/useGames';
import { useBlogs } from '@/services/mutators/useBlogs';
import { useTournaments } from '@/services/mutators/useTournaments';

import GameCard from '@/shared/components/GameCard';
import BlogCard from '@/shared/components/BlogCard';
import TournamentCard from '@/shared/components/TournamentCard';
import Skeleton from '@/shared/components/Skeleton';

import { MOCK_SHOWCASE } from '@/shared/data/communityData';
import { MOCK_SUB_PROFILES } from '@/shared/data/profileData';

const CATEGORIES = [
  'For You', 'Trending', 'New Arrivals', 'Esports', 
  'Indie Games', 'Mobile', 'Horror', 'RPG', 'FPS', 'Health'
];

const SEARCH_TAGS = ['Valorant', 'FIFA', 'BGMI', 'Indie Games', 'Esports', 'Game Development'];

// ── Components ───────────────────────────────────────────────────────────────

const SectionHeader = ({ title, link, linkText = 'View All' }) => (
  <div className="flex items-center justify-between mb-8">
    <h2 className="text-2xl font-black uppercase tracking-tighter text-[var(--theme-text)] italic">
      {title.split(' ').map((word, i) => (
        <span key={i} className={i === 0 ? '' : 'text-[var(--theme-primary)] ml-2'}>{word}</span>
      ))}
    </h2>
    {link && (
      <Link to={link} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] transition-all">
        {linkText} <FiArrowRight />
      </Link>
    )}
  </div>
);

const TypeBadge = ({ type }) => {
  const meta = {
    game: { label: 'Game', icon: '🎮', color: 'bg-blue-500/20 text-blue-400' },
    blog: { label: 'Blog', icon: '📝', color: 'bg-emerald-500/20 text-emerald-400' },
    tournament: { label: 'Tournament', icon: '🏆', color: 'bg-amber-500/20 text-amber-400' },
  }[type];

  return (
    <div className={`absolute top-4 left-4 z-20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-md border border-white/10 ${meta.color}`}>
      <span>{meta.icon}</span> {meta.label}
    </div>
  );
};

// ── Root Page ────────────────────────────────────────────────────────────────

export default function Discovery() {
  usePageTheme('collection');
  const navigate = useNavigate();
  
  const [activeCategory, setActiveCategory] = useState('For You');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: games = [], isLoading: gamesLoading } = useGames();
  const { data: blogs = [], isLoading: blogsLoading } = useBlogs();
  const { data: tournaments = [], isLoading: tournamentsLoading } = useTournaments();

  const isLoading = gamesLoading || blogsLoading || tournamentsLoading;

  // Curated Content Logic
  const trendingItems = useMemo(() => {
    if (isLoading) return [];
    const mixed = [
      ...games.slice(0, 2).map(i => ({ ...i, type: 'game' })),
      ...blogs.slice(0, 2).map(i => ({ ...i, type: 'blog' })),
      ...tournaments.slice(0, 2).map(i => ({ ...i, type: 'tournament' }))
    ];
    return mixed.slice(0, 6);
  }, [games, blogs, tournaments, isLoading]);

  const newGames = useMemo(() => 
    [...games].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8)
  , [games]);

  const upcomingTournaments = useMemo(() => 
    [...tournaments].sort((a, b) => new Date(a.start_date) - new Date(b.start_date)).slice(0, 3)
  , [tournaments]);

  const editorPick = useMemo(() => {
    if (games.length > 0) return games[0];
    return null;
  }, [games]);

  if (isLoading) return (
    <div className="min-h-screen bg-[var(--theme-bg)] pt-32 px-6 lg:px-12 space-y-12">
      <Skeleton height="400px" rounded="3xl" animate="shimmer" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Skeleton height="300px" rounded="2xl" />
        <Skeleton height="300px" rounded="2xl" />
        <Skeleton height="300px" rounded="2xl" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] pb-40">
      <Helmet>
        <title>Discovery Hub | Explore GzoneSphere</title>
        <meta name="description" content="Discover curated games, trending blogs, and elite tournaments on GzoneSphere." />
      </Helmet>

      {/* 1. HERO / SEARCH BAR */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--theme-primary)]/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic text-[var(--theme-text)] mb-8"
          >
            Explore The <span className="text-[var(--theme-primary)]">Gaming Frontier</span>
          </motion.h1>

          <div className="relative max-w-2xl mx-auto mb-6">
            <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)]" size={24} />
            <input 
              type="text" 
              placeholder="Search games, blogs, players, tournaments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-full py-5 pl-16 pr-8 text-lg focus:border-[var(--theme-primary)] outline-none shadow-2xl"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {SEARCH_TAGS.map(tag => (
              <button 
                key={tag}
                onClick={() => setSearchQuery(tag)}
                className="px-4 py-1.5 bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] rounded-full text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] hover:border-[var(--theme-primary)] transition-all"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 space-y-24">
        
        {/* 2. FEATURED SPOTLIGHT */}
        {editorPick && (
          <section className="relative h-[500px] rounded-[3rem] overflow-hidden group shadow-2xl border border-white/5">
            <img src={editorPick.cover_url || "https://picsum.photos/1200/600?random=spotlight"} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Editor pick" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 p-12 flex flex-col justify-center max-w-2xl">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--theme-primary)] mb-4">
                <FiStar /> Editor's Pick
              </span>
              <h2 className="text-5xl font-black uppercase tracking-tighter italic text-white mb-6 leading-tight">
                {editorPick.title}
              </h2>
              <p className="text-white/70 text-lg mb-10 line-clamp-3 font-medium">
                {editorPick.description}
              </p>
              <div className="flex gap-4">
                <Link to={`/games/${editorPick.slug}`} className="gzs-btn-primary !px-10 py-4 italic font-black uppercase text-sm tracking-widest">
                  Explore Project
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* 3. DISCOVERY CATEGORIES */}
        <section className="overflow-x-auto pb-4 scrollbar-none">
          <div className="flex gap-4 min-w-max">
            {CATEGORIES.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 ${
                  activeCategory === cat 
                    ? 'bg-[var(--theme-primary)] border-[var(--theme-primary)] text-white shadow-lg shadow-[var(--theme-primary)]/20' 
                    : 'bg-[var(--theme-card)] border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:border-[var(--theme-primary)]/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* 4. TRENDING NOW */}
        <section>
          <SectionHeader title="Trending Now" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trendingItems.map((item) => (
              <div key={item.id} className="relative group">
                <TypeBadge type={item.type} />
                {item.type === 'game' && <GameCard game={item} />}
                {item.type === 'blog' && (
                  <BlogCard 
                    id={item.id}
                    image={item.image_url || item.banner_url || item.image}
                    title={item.title}
                    description={item.description || item.excerpt}
                    likes={item.likes_count || item.likes}
                  />
                )}
                {item.type === 'tournament' && <TournamentCard tournament={item} />}
              </div>
            ))}
          </div>
        </section>

        {/* 5. NEW IN GAMES */}
        <section>
          <SectionHeader title="New Arrivals" link="/games/browse" />
          <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-thin scrollbar-thumb-[var(--theme-border)]">
            {newGames.map(game => (
              <div key={game.id} className="min-w-[300px]">
                <GameCard game={game} />
              </div>
            ))}
          </div>
        </section>

        {/* 6. COMMUNITY HIGHLIGHTS */}
        <section>
          <SectionHeader title="Community Highlights" link="/community" linkText="View Showcase" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {MOCK_SHOWCASE.slice(0, 3).map(post => (
              <div key={post.id} className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-[2.5rem] overflow-hidden group shadow-sm hover:shadow-2xl transition-all hover:border-[var(--theme-primary)]/40">
                <div className="h-64 relative overflow-hidden">
                  <img src={post.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={post.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] flex items-center justify-center font-black text-xs italic">
                      {post.user[0]}
                    </div>
                    <span className="text-xs font-bold text-[var(--theme-text)]">@{post.user}</span>
                  </div>
                  <h4 className="text-lg font-black uppercase italic tracking-tighter text-[var(--theme-text)] mb-4">{post.title}</h4>
                  <div className="flex items-center gap-6 text-[var(--theme-text-muted)]">
                    <span className="flex items-center gap-1.5 text-xs font-bold"><FiHeart /> {post.likes}</span>
                    <span className="flex items-center gap-1.5 text-xs font-bold"><FiMessageCircle /> {post.comments}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. TOURNAMENTS STARTING SOON */}
        <section>
          <SectionHeader title="Starting Soon" link="/tournaments" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {upcomingTournaments.map(t => (
              <div key={t.id} className="space-y-4">
                <TournamentCard tournament={t} />
                <button className="w-full py-4 rounded-2xl bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] text-xs font-black uppercase tracking-widest text-[var(--theme-text)] hover:bg-[var(--theme-primary)] hover:text-white transition-all">
                  Register Now
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 8. RECOMMENDED PROFILES */}
        <section className="pb-20">
          <SectionHeader title="People to Follow" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {MOCK_SUB_PROFILES.slice(0, 4).map(profile => (
              <div 
                key={profile.id}
                onClick={() => navigate(`/u/${profile.username}`)}
                className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-[2rem] p-6 flex flex-col items-center text-center group cursor-pointer hover:border-[var(--theme-primary)] transition-all shadow-sm"
              >
                <div className="w-20 h-20 rounded-3xl bg-[var(--theme-bg-alt)] border-2 border-[var(--theme-border)] overflow-hidden mb-4 group-hover:border-[var(--theme-primary)] transition-all">
                  <img src={profile.avatar_url} className="w-full h-full object-cover" alt={profile.username} />
                </div>
                <h4 className="font-black text-sm uppercase italic tracking-tighter text-[var(--theme-text)] group-hover:text-[var(--theme-primary)] transition-colors">
                  {profile.display_name}
                </h4>
                <p className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider mb-4">
                  {profile.type} · {profile.primary_role}
                </p>
                <div className="flex flex-wrap justify-center gap-1.5 mb-6">
                  {(profile.active_roles || []).slice(0, 2).map(role => (
                    <span key={role} className="px-2 py-0.5 bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] rounded-md text-[8px] font-black uppercase tracking-widest text-[var(--theme-text-muted)]">
                      {role}
                    </span>
                  ))}
                </div>
                <button className="gzs-btn-primary w-full py-2.5 text-[10px] font-black uppercase tracking-widest">
                  <FiPlus /> Follow
                </button>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

