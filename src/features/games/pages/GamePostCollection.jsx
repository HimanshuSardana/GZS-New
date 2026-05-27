import { useState, useRef, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  FiMonitor, FiSmartphone,
  FiChevronLeft, FiChevronRight,
  FiEye, FiArrowRight, FiArrowDown,
  FiPlay, FiCpu,
} from 'react-icons/fi';

import { usePageTheme } from '@/app/providers/ThemeProvider';
import { useFeaturedGames, useTrendingGames } from '@/services/mutators/useGames';
import { useBlogs } from '@/services/mutators/useBlogs';
import gamesService from '@/services/features/gamesService';
import GameCard from '@/shared/components/GameCard';
import BlogCard from '@/shared/components/BlogCard';
import Skeleton from '@/shared/components/Skeleton';
import { images } from '@/shared/data/images';

/* ── Static data ─────────────────────────────────────────── */

const PLATFORMS = [
  { id: 'PC',          label: 'PC',          icon: <FiMonitor size={20} /> },
  { id: 'PlayStation', label: 'PlayStation', icon: <FiPlay size={20} /> },
  { id: 'Xbox',        label: 'Xbox',        icon: <FiCpu size={20} /> },
  { id: 'Mobile',      label: 'Mobile',      icon: <FiSmartphone size={20} /> },
];

const PLATFORM_ICONS = {
  PC:          <FiMonitor size={14} />,
  PlayStation: <FiPlay size={14} />,
  Xbox:        <FiCpu size={14} />,
  Mobile:      <FiSmartphone size={14} />,
};

const ALL_CATEGORIES = [
  'Action', 'Arcade', 'Shooter', 'FPS', 'Battle Royale',
  'RPG', 'MMORPG', 'Strategy', 'Simulation', 'Racing',
  'Sports', 'Fighting', 'Platformer', 'Puzzle', 'Horror',
  'Adventure', 'Open World', 'Sandbox', 'Mobile', 'VR/AR',
  'Indie', 'Educational',
];
const DEFAULT_CAT_COUNT = 8;

/* ── Helpers ─────────────────────────────────────────────── */

function calcReadTime(text = '') {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function filterByPlatform(items, platform) {
  if (!platform) return items;
  return items.filter(item => {
    const platforms = Array.isArray(item.platforms)
      ? item.platforms
      : [item.platform].filter(Boolean);
    return platforms.includes(platform);
  });
}

function filterByCategory(items, category) {
  if (!category) return items;
  return items.filter(item => {
    const genres = Array.isArray(item.genres)
      ? item.genres
      : [item.genre].filter(Boolean);
    return genres.includes(category) || item.category === category;
  });
}

/* ── Component ───────────────────────────────────────────── */

export default function GamePostCollection() {
  usePageTheme('games');

  const [activePlatform,    setActivePlatform]    = useState(null);
  const [activeCategory,    setActiveCategory]    = useState(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showLeftArrow,     setShowLeftArrow]     = useState(false);
  const [showRightArrow,    setShowRightArrow]    = useState(true);
  const [hubSettings,       setHubSettings]       = useState(null);
  const galleryRef = useRef(null);

  /* ── Data fetching ─────────────────────────────────────── */

  const { data: featuredRaw = [], isLoading: featuredLoading } = useFeaturedGames();
  const { data: trendingRaw = [], isLoading: trendingLoading } = useTrendingGames();
  const { data: blogsRaw    = [], isLoading: blogsLoading    } = useBlogs();

  useEffect(() => {
    gamesService.getHubSettings('games').then(res => {
      setHubSettings(res?.data || null);
    }).catch(() => {});
  }, []);

  /* ── Derived / filtered data ───────────────────────────── */

  const featuredGames = useMemo(() => {
    const byPlatform = filterByPlatform(featuredRaw, activePlatform);
    const slugs = hubSettings?.gallery_game_slugs;
    if (!slugs?.length) return byPlatform;
    const slugMap = Object.fromEntries(byPlatform.map(g => [g.slug || g.id, g]));
    const ordered = slugs.map(s => slugMap[s]).filter(Boolean);
    const pinnedSet = new Set(slugs);
    const rest = byPlatform.filter(g => !pinnedSet.has(g.slug || g.id));
    return [...ordered, ...rest];
  }, [featuredRaw, activePlatform, hubSettings]);

  const trendingGames = useMemo(() => {
    const byPlatform = filterByPlatform(trendingRaw, activePlatform);
    const byCategory = filterByCategory(byPlatform, activeCategory);
    const pinnedSlugs = hubSettings?.trending_pinned_slugs || [];
    if (!pinnedSlugs.length) return byCategory.slice(0, 6);
    const pinnedSet = new Set(pinnedSlugs);
    const pinned = pinnedSlugs.map(s => byCategory.find(g => (g.slug || g.id) === s)).filter(Boolean);
    const rest = byCategory.filter(g => !pinnedSet.has(g.slug || g.id));
    return [...pinned, ...rest].slice(0, 6);
  }, [trendingRaw, activePlatform, activeCategory, hubSettings]);

  const categoryList = useMemo(() => {
    const config = hubSettings?.categories_config;
    if (!config?.length) return ALL_CATEGORIES;
    return config.filter(c => c.enabled).map(c => c.name);
  }, [hubSettings]);

  const visibleCategories = showAllCategories
    ? categoryList
    : categoryList.slice(0, DEFAULT_CAT_COUNT);

  const blogsToShow = useMemo(() => {
    const mode = hubSettings?.blogs_grid_mode;
    const manualSlugs = hubSettings?.blogs_grid_manual_slugs || [];
    if (mode === 'manual' && manualSlugs.length) {
      const slugMap = Object.fromEntries(blogsRaw.map(b => [b.slug || b.id, b]));
      return manualSlugs.map(s => slugMap[s]).filter(Boolean);
    }
    return blogsRaw
      .filter(b => b.category === 'games' || (Array.isArray(b.tags) && b.tags.includes('games')))
      .slice(0, 6);
  }, [blogsRaw, hubSettings]);

  /* ── Carousel scroll logic ─────────────────────────────── */

  const syncArrows = () => {
    const el = galleryRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 10);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;
    el.addEventListener('scroll', syncArrows, { passive: true });
    syncArrows();
    return () => el.removeEventListener('scroll', syncArrows);
  }, [featuredGames]);

  useEffect(() => {
    if (!hubSettings?.gallery_auto_scroll) return;
    const interval = setInterval(() => {
      const el = galleryRef.current;
      if (!el) return;
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 10) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: 420, behavior: 'smooth' });
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [hubSettings?.gallery_auto_scroll]);

  const scrollCarousel = (dir) =>
    galleryRef.current?.scrollBy({ left: dir === 'left' ? -420 : 420, behavior: 'smooth' });

  /* ── Actions ───────────────────────────────────────────── */

  const scrollToGallery = () =>
    document.getElementById('gh-gallery-anchor')?.scrollIntoView({ behavior: 'smooth' });

  const togglePlatform = (id) =>
    setActivePlatform(prev => (prev === id ? null : id));

  const toggleCategory = (cat) =>
    setActiveCategory(prev => (prev === cat ? null : cat));

  /* ── Render ────────────────────────────────────────────── */

  return (
    <>
      <Helmet><title>Games | GzoneSphere</title></Helmet>

      <div className="gh-page">

        {/* ── BLOCK 1: HERO ──────────────────────────────────── */}
        <section className="gh-hero">
          <div className="gh-hero__bg">
            <img
              src={images.hero_bg}
              alt=""
              className="gh-hero__bg-img"
              aria-hidden="true"
              loading="eager"
              decoding="async"
            />
            <div className="gh-hero__bg-overlay" />
          </div>

          <div className="gh-hero__content">
            <h1 className="gh-hero__title">
              Discover Games on GzoneSphere
            </h1>
            <p className="gh-hero__sub">
              Explore games by platform, category, and genre. Find detailed game
              profiles and meaningful gaming communities.
            </p>
            <div className="gh-hero__ctas">
              <button onClick={scrollToGallery} className="gh-hero__btn-primary">
                Explore Games <FiArrowDown size={16} />
              </button>
              <Link to="/blog" className="gh-hero__btn-secondary">
                Browse Blog <FiArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── BLOCK 2: PLATFORM SELECTOR STRIP ──────────────── */}
        <section className="gh-platform-strip">
          <div className="gh-platform-strip__inner">
            {PLATFORMS.map(p => (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.id)}
                className={
                  'gh-platform-strip__card' +
                  (activePlatform === p.id ? ' gh-platform-strip__card--active' : '')
                }
              >
                <span className="gh-platform-strip__icon">{p.icon}</span>
                <span className="gh-platform-strip__label">{p.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── BLOCK 3: GAME GALLERY CAROUSEL ────────────────── */}
        <section id="gh-gallery-anchor" className="gh-carousel">
          <div className="gh-carousel__header">
            <div className="gh-carousel__title-group">
              <p className="gh-carousel__eyebrow">Featured Games</p>
              <h2 className="gh-carousel__title">Game Gallery</h2>
            </div>
            <div className="gh-carousel__controls">
              <button
                className={
                  'gh-carousel__btn gh-carousel__btn--prev' +
                  (!showLeftArrow ? ' gh-carousel__btn--hidden' : '')
                }
                onClick={() => scrollCarousel('left')}
                aria-label="Scroll left"
              >
                <FiChevronLeft size={20} />
              </button>
              <button
                className={
                  'gh-carousel__btn gh-carousel__btn--next' +
                  (!showRightArrow ? ' gh-carousel__btn--hidden' : '')
                }
                onClick={() => scrollCarousel('right')}
                aria-label="Scroll right"
              >
                <FiChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="gh-carousel__track" ref={galleryRef}>
            {featuredLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="gh-carousel__slide gh-carousel__slide--skeleton">
                  <Skeleton height="420px" rounded="lg" animate="shimmer" />
                </div>
              ))
            ) : featuredGames.length > 0 ? (
              featuredGames.map(game => (
                <div key={game.id ?? game.slug} className="gh-carousel__slide">
                  <GameCard game={game} />
                </div>
              ))
            ) : (
              <div className="gh-carousel__empty">
                <p>No featured games found for this platform.</p>
              </div>
            )}
          </div>
        </section>

        {/* ── BLOCK 4: CATEGORY TABS ─────────────────────────── */}
        {hubSettings?.show_category_tabs !== false && (
        <section className="gh-category-tabs">
          <div className="gh-category-tabs__inner">
            {visibleCategories.map(cat => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={
                  'gh-category-tabs__pill' +
                  (activeCategory === cat ? ' gh-category-tabs__pill--active' : '')
                }
              >
                {cat}
              </button>
            ))}
            <button
              className="gh-category-tabs__more"
              onClick={() => setShowAllCategories(prev => !prev)}
            >
              {showAllCategories ? 'Show Less' : 'Explore More'}
            </button>
          </div>
        </section>
        )}

        {/* ── BLOCK 5: TRENDING GAMES ────────────────────────── */}
        <section className="gh-trending">
          <div className="gh-trending__header">
            <p className="gh-trending__eyebrow">Trending Now</p>
            <h2 className="gh-trending__title">Top Games This Week</h2>
          </div>

          <div className="gh-trending__grid">
            {trendingLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height="260px" rounded="lg" animate="shimmer" />
              ))
            ) : trendingGames.length > 0 ? (
              trendingGames.map(game => {
                const slug      = game.slug || game.id;
                const platforms = Array.isArray(game.platforms)
                  ? game.platforms
                  : [game.platform].filter(Boolean);
                const genre = Array.isArray(game.genres)
                  ? game.genres[0]
                  : (game.genre || null);
                const views = game.views || game.view_count || 0;

                return (
                  <div key={game.id ?? slug} className="gh-trending__card">
                    <div className="gh-trending__card-img-wrap">
                      <img
                        src={game.cover_url || game.banner_url}
                        alt={game.title}
                        className="gh-trending__card-img"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>

                    <div className="gh-trending__card-body">
                      {genre && (
                        <span className="gh-trending__card-genre">{genre}</span>
                      )}
                      <h3 className="gh-trending__card-title">{game.title}</h3>

                      <div className="gh-trending__card-meta">
                        <div className="gh-trending__card-platforms">
                          {platforms.slice(0, 3).map(p => (
                            <span
                              key={p}
                              className="gh-trending__card-platform-icon"
                              title={p}
                            >
                              {PLATFORM_ICONS[p] ?? <FiMonitor size={14} />}
                            </span>
                          ))}
                        </div>
                        <span className="gh-trending__card-views">
                          <FiEye size={12} />
                          {views >= 1000
                            ? `${(views / 1000).toFixed(1)}K`
                            : views}
                        </span>
                      </div>

                      <Link
                        to={`/games/${slug}`}
                        className="gh-trending__card-cta"
                      >
                        View Game <FiArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="gh-trending__empty">
                <p>No trending games found for this filter.</p>
              </div>
            )}
          </div>
        </section>

        {/* ── BLOCK 6: BLOGS & GUIDES GRID ──────────────────── */}
        <section className="gh-blogs-grid">
          <div className="gh-blogs-grid__header">
            <div className="gh-blogs-grid__title-group">
              <p className="gh-blogs-grid__eyebrow">Gaming Editorial</p>
              <h2 className="gh-blogs-grid__title">Blogs &amp; Guides</h2>
            </div>
            <Link to="/blog?category=games" className="gh-blogs-grid__viewall">
              View All <FiArrowRight size={16} />
            </Link>
          </div>

          <div className="gh-blogs-grid__grid">
            {blogsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height="380px" rounded="lg" animate="shimmer" />
              ))
            ) : blogsToShow.length > 0 ? (
              blogsToShow.map(blog => {
                const readTime = calcReadTime(
                  blog.content || blog.body || blog.description || blog.excerpt || '',
                );
                return (
                  <BlogCard
                    key={blog.id ?? blog.slug}
                    id={blog.slug || blog.id}
                    image={blog.featured_image_url || blog.image || blog.cover_url}
                    title={blog.title}
                    description={`${readTime} min read — ${blog.excerpt || blog.description || ''}`}
                    likes={blog.like_count ?? blog.likes ?? 0}
                  />
                );
              })
            ) : (
              <div className="gh-blogs-grid__empty">
                <p>No gaming blogs found.</p>
              </div>
            )}
          </div>
        </section>

      </div>
    </>
  );
}
