import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  FiSearch, 
  FiX, 
  FiFilter, 
  FiChevronDown, 
  FiMonitor, 
  FiSmartphone, 
  FiPlay, 
  FiCpu, 
  FiLayers,
  FiArrowRight,
  FiInfo
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

import { usePageTheme } from '@/app/providers/ThemeProvider';
import { useGames } from '@/services/mutators/useGames';
import GameCard from '@/shared/components/GameCard';
import Skeleton from '@/shared/components/Skeleton';

import './GamesBrowse.css';

const GENRES = [
  'Action', 'Adventure', 'RPG', 'Strategy', 'Simulation', 
  'Sports', 'Racing', 'Fighting', 'Puzzle', 'Platformer', 
  'Shooter', 'FPS', 'TPS', 'Battle Royale', 'MOBA', 
  'Horror', 'Survival', 'Sandbox', 'MMO', 'Music', 
  'Card', 'Casual', 'Indie'
];

const PLATFORMS = [
  { id: 'PC', label: 'PC', icon: <FiMonitor /> },
  { id: 'PlayStation', label: 'PlayStation', icon: <FiPlay /> },
  { id: 'Xbox', label: 'Xbox', icon: <FiCpu /> },
  { id: 'Mobile', label: 'Mobile', icon: <FiSmartphone /> },
  { id: 'Cross-platform', label: 'Cross-platform', icon: <FiLayers /> },
];

const SORT_OPTIONS = [
  { id: 'popular', label: 'Most popular' },
  { id: 'recent', label: 'Recently added' },
  { id: 'alphabetical', label: 'Alphabetical A-Z' },
  { id: 'trending', label: 'Trending this week' },
];

const GAMES_PER_PAGE = 24;

export default function GamesBrowse() {
  usePageTheme('collection');

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [sortBy, setSortBy] = useState('popular');
  const [visibleCount, setVisibleCount] = useState(GAMES_PER_PAGE);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Data
  const { data: allGames = [], isLoading } = useGames();

  // Filtering Logic
  const filteredGames = useMemo(() => {
    let results = [...allGames];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(game => 
        game.title?.toLowerCase().includes(query) ||
        game.genres?.some(g => g.toLowerCase().includes(query)) ||
        game.developer?.toLowerCase().includes(query) ||
        game.publisher?.toLowerCase().includes(query)
      );
    }

    // Platform filter
    if (selectedPlatforms.length > 0) {
      results = results.filter(game => 
        game.platforms?.some(p => selectedPlatforms.includes(p))
      );
    }

    // Genre filter
    if (selectedGenres.length > 0) {
      results = results.filter(game => 
        game.genres?.some(g => selectedGenres.includes(g))
      );
    }

    // Sorting
    results.sort((a, b) => {
      if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'recent') {
        return new Date(b.published_at || b.release_date) - new Date(a.published_at || a.release_date);
      }
      if (sortBy === 'popular' || sortBy === 'trending') {
        return (b.view_count || 0) - (a.view_count || 0);
      }
      return 0;
    });

    return results;
  }, [allGames, searchQuery, selectedPlatforms, selectedGenres, sortBy]);

  const displayedGames = filteredGames.slice(0, visibleCount);

  // Handlers
  const togglePlatform = (id) => {
    setSelectedPlatforms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleGenre = (genre) => {
    setSelectedGenres(prev => 
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const clearFilters = () => {
    setSelectedPlatforms([]);
    setSelectedGenres([]);
    setSearchQuery('');
    setSortBy('popular');
  };

  const removePlatform = (id) => setSelectedPlatforms(prev => prev.filter(p => p !== id));
  const removeGenre = (genre) => setSelectedGenres(prev => prev.filter(g => g !== genre));

  const loadMore = () => setVisibleCount(prev => prev + GAMES_PER_PAGE);

  return (
    <div className="games-browse-page">
      <Helmet>
        <title>Browse All Games | GzoneSphere Library</title>
        <meta name="description" content="Explore our extensive library of games across all platforms. Filter by genre, platform, and more to find your next adventure." />
      </Helmet>

      {/* 1. PAGE HEADER */}
      <header className="browse-header container">
        <nav className="breadcrumb">
          <span>Home</span>
          <FiChevronDown className="rotate-[-90deg]" size={12} />
          <span>Games</span>
          <FiChevronDown className="rotate-[-90deg]" size={12} />
          <span className="active">Browse All</span>
        </nav>
        <div className="header-content">
          <h1>Browse All Games</h1>
          <p className="game-count">{allGames.length} games in library</p>
        </div>
      </header>

      {/* 2. SEARCH BAR (Sticky) */}
      <div className="search-container-wrapper">
        <div className="search-container container">
          <div className="search-input-box">
            <FiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by title, genre, or developer..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search" onClick={() => setSearchQuery('')}>
                <FiX />
              </button>
            )}
          </div>
          
          {/* Active Filter Chips */}
          {(selectedPlatforms.length > 0 || selectedGenres.length > 0) && (
            <div className="active-filters">
              {selectedPlatforms.map(p => (
                <div key={p} className="filter-chip">
                  <span>{p}</span>
                  <button onClick={() => removePlatform(p)}><FiX size={10} /></button>
                </div>
              ))}
              {selectedGenres.map(g => (
                <div key={g} className="filter-chip">
                  <span>{g}</span>
                  <button onClick={() => removeGenre(g)}><FiX size={10} /></button>
                </div>
              ))}
              <button className="clear-all-link" onClick={clearFilters}>Clear All</button>
            </div>
          )}
        </div>
      </div>

      <div className="browse-main container">
        {/* 3. FILTER SIDEBAR (Desktop) */}
        <aside className="filter-sidebar">
          <div className="filter-section">
            <h3>Platform</h3>
            <div className="platform-pills">
              {PLATFORMS.map(p => (
                <button 
                  key={p.id} 
                  className={`platform-pill ${selectedPlatforms.includes(p.id) ? 'active' : ''}`}
                  onClick={() => togglePlatform(p.id)}
                >
                  {p.icon}
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h3>Genre</h3>
            <div className="genre-checkboxes">
              {GENRES.map(genre => (
                <label key={genre} className="genre-checkbox">
                  <input 
                    type="checkbox" 
                    checked={selectedGenres.includes(genre)}
                    onChange={() => toggleGenre(genre)}
                  />
                  <span className="checkmark" />
                  <span className="label">{genre}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h3>Sort By</h3>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
              {SORT_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          <button className="sidebar-clear-btn" onClick={clearFilters}>
            Clear All Filters
          </button>
        </aside>

        {/* 4. RESULTS AREA */}
        <main className="results-area">
          <div className="results-header">
            <p className="results-count">
              Showing {displayedGames.length} of {filteredGames.length} games
            </p>
            <button className="mobile-filter-trigger" onClick={() => setIsFilterSheetOpen(true)}>
              <FiFilter /> Filters
            </button>
          </div>

          {isLoading ? (
            <div className="games-grid">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="skeleton-card">
                  <Skeleton height="350px" rounded="2xl" animate="shimmer" />
                </div>
              ))}
            </div>
          ) : displayedGames.length > 0 ? (
            <>
              <div className="games-grid">
                {displayedGames.map(game => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>

              {/* 5. PAGINATION */}
              {visibleCount < filteredGames.length && (
                <div className="pagination-area">
                  <p>Showing {displayedGames.length} of {filteredGames.length} games</p>
                  <button className="load-more-btn" onClick={loadMore}>
                    Load More <FiArrowRight />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-illustration">
                <FiInfo size={48} />
              </div>
              <h2>No games match your filters</h2>
              <p>Try adjusting your search or filters to find what you're looking for.</p>
              <button className="gzs-btn-primary" onClick={clearFilters}>
                Clear All Filters
              </button>
            </div>
          )}
        </main>
      </div>

      {/* MOBILE FILTER SHEET */}
      <AnimatePresence>
        {isFilterSheetOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="sheet-overlay"
              onClick={() => setIsFilterSheetOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="filter-sheet"
            >
              <div className="sheet-header">
                <h3>Filters</h3>
                <button onClick={() => setIsFilterSheetOpen(false)}><FiX size={24} /></button>
              </div>
              <div className="sheet-content">
                {/* Same content as sidebar but formatted for mobile */}
                <div className="filter-section">
                  <h3>Platform</h3>
                  <div className="platform-pills">
                    {PLATFORMS.map(p => (
                      <button 
                        key={p.id} 
                        className={`platform-pill ${selectedPlatforms.includes(p.id) ? 'active' : ''}`}
                        onClick={() => togglePlatform(p.id)}
                      >
                        {p.icon}
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-section">
                  <h3>Genre</h3>
                  <div className="genre-checkboxes grid grid-cols-2">
                    {GENRES.map(genre => (
                      <label key={genre} className="genre-checkbox">
                        <input 
                          type="checkbox" 
                          checked={selectedGenres.includes(genre)}
                          onChange={() => toggleGenre(genre)}
                        />
                        <span className="checkmark" />
                        <span className="label">{genre}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="filter-section">
                  <h3>Sort By</h3>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
                    {SORT_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="sheet-footer">
                <button className="clear-btn" onClick={clearFilters}>Clear All</button>
                <button className="apply-btn" onClick={() => setIsFilterSheetOpen(false)}>Show Results</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
