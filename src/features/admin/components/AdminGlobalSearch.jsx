/**
 * AdminGlobalSearch.jsx — Full-screen Cmd+K search overlay for the admin panel.
 *
 * Always mounted in AdminLayout, shows/hides via internal state.
 * Open: Ctrl+K / Cmd+K keyboard shortcut OR CustomEvent 'admin:open-search'
 * Close: Escape key OR click on backdrop
 *
 * Search: debounced 300ms, triggers at query.length >= 2.
 * Results: categorised mock — TODO: replace with GET /admin/search?q=
 * Navigation: click result or Enter on keyboard-focused result.
 * Recent searches: last 5 queries in localStorage key 'gzs_admin_searches'.
 */
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiUser, FiCodepen, FiAward, FiBookOpen, FiBriefcase, FiClock, FiX } from 'react-icons/fi';
import { MOCK_ADMIN_USERS } from '@/shared/data/adminData';

const LS_KEY = 'gzs_admin_searches';
const MAX_RECENT = 5;

// ── Mock fixtures — TODO: replace with GET /admin/search?q={query} ───────────
const MOCK_GAMES = [
  { id: 'g1', title: 'Valorant', status: 'Published' },
  { id: 'g2', title: 'Apex Legends', status: 'Published' },
  { id: 'g3', title: 'Minecraft', status: 'Published' },
  { id: 'g4', title: 'Unreal Tournament', status: 'Draft' },
];
const MOCK_TOURNAMENTS = [
  { id: 't1', name: 'Cyber Cup 2026', status: 'Live' },
  { id: 't2', name: 'Spring Esports Championship', status: 'Upcoming' },
  { id: 't3', name: 'Game Dev Jam #4', status: 'Completed' },
];
const MOCK_BLOGS = [
  { id: 'b1', title: 'Top 10 Unity Tips for Beginners', author: 'dev_alex', status: 'Published' },
  { id: 'b2', title: 'How to Build Your Esports Career', author: 'pro_gamer', status: 'Published' },
  { id: 'b3', title: 'Audio Design in Modern Games', author: 'audio_pro', status: 'Draft' },
];
const MOCK_COMPANIES = [
  { id: 'c1', name: 'Phantom Studios', verified: true },
  { id: 'c2', name: 'PixelForge', verified: false },
  { id: 'c3', name: 'ArenaX Games', verified: true },
];

function generateResults(query) {
  if (!query || query.length < 2) return null;
  const q = query.toLowerCase();
  return {
    users:       MOCK_ADMIN_USERS.filter(u => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)).slice(0, 3).map(u => ({ id: u.id, type: 'user', primary: u.username, secondary: u.email })),
    games:       MOCK_GAMES.filter(g => g.title.toLowerCase().includes(q)).slice(0, 3).map(g => ({ id: g.id, type: 'game', primary: g.title, secondary: g.status })),
    tournaments: MOCK_TOURNAMENTS.filter(t => t.name.toLowerCase().includes(q)).slice(0, 2).map(t => ({ id: t.id, type: 'tournament', primary: t.name, secondary: t.status })),
    blogs:       MOCK_BLOGS.filter(b => b.title.toLowerCase().includes(q)).slice(0, 2).map(b => ({ id: b.id, type: 'blog', primary: b.title, secondary: `by ${b.author} · ${b.status}` })),
    companies:   MOCK_COMPANIES.filter(c => c.name.toLowerCase().includes(q)).slice(0, 2).map(c => ({ id: c.id, type: 'company', primary: c.name, secondary: c.verified ? 'Verified' : 'Unverified' })),
  };
}

function resolveRoute(result) {
  switch (result.type) {
    case 'user':       return `/admin/users/${result.id}`;
    case 'game':       return `/admin/games/${result.id}/edit`;
    case 'tournament': return `/admin/tournaments/${result.id}/edit`;
    case 'blog':       return `/admin/blogs/${result.id}/edit`;
    case 'company':    return `/admin/companies`;
    default:           return '/admin';
  }
}

const CATEGORY_META = {
  users:       { label: 'Users',       Icon: FiUser },
  games:       { label: 'Games',       Icon: FiCodepen },
  tournaments: { label: 'Tournaments', Icon: FiAward },
  blogs:       { label: 'Blogs',       Icon: FiBookOpen },
  companies:   { label: 'Companies',   Icon: FiBriefcase },
};

function getRecent() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function saveRecent(query) {
  if (!query.trim()) return;
  const prev = getRecent();
  try { localStorage.setItem(LS_KEY, JSON.stringify([query, ...prev.filter(q => q !== query)].slice(0, MAX_RECENT))); } catch { /* ignore */ }
}

export default function AdminGlobalSearch() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState(getRecent);

  const open = useCallback(() => {
    setIsOpen(true); setQuery(''); setDebouncedQuery(''); setFocusedIndex(0);
    setRecentSearches(getRecent());
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const close = useCallback(() => { setIsOpen(false); setQuery(''); setDebouncedQuery(''); }, []);

  // Global keyboard shortcut
  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); isOpen ? close() : open(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, open, close]);

  // CustomEvent from navbar button
  useEffect(() => {
    window.addEventListener('admin:open-search', open);
    return () => window.removeEventListener('admin:open-search', open);
  }, [open]);

  // Debounce
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedQuery(query); setFocusedIndex(0); }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const results = useMemo(() => generateResults(debouncedQuery), [debouncedQuery]);
  const flatResults = useMemo(() => results ? Object.values(results).flat() : [], [results]);

  function goToResult(result) {
    saveRecent(query || debouncedQuery);
    setRecentSearches(getRecent());
    close();
    navigate(resolveRoute(result));
  }

  function onInputKeyDown(e) {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIndex(i => (i + 1) % Math.max(flatResults.length, 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFocusedIndex(i => (i - 1 + Math.max(flatResults.length, 1)) % Math.max(flatResults.length, 1)); }
    if (e.key === 'Enter' && flatResults[focusedIndex]) goToResult(flatResults[focusedIndex]);
  }

  if (!isOpen) return null;

  const hasResults = results && Object.values(results).some(a => a.length > 0);
  const showEmpty = debouncedQuery.length >= 2 && !hasResults;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
      style={{ background: 'rgba(2,6,23,0.72)', backdropFilter: 'blur(6px)' }}
      onClick={close}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--theme-border)]">
          <FiSearch size={18} className="text-[var(--theme-text-muted)] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search users, games, tournaments, blogs, companies…"
            className="flex-1 bg-transparent text-base text-[var(--theme-text)] placeholder:text-[var(--theme-text-muted)] outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center rounded border border-[var(--theme-border)] px-1.5 py-0.5 text-[10px] text-[var(--theme-text-muted)] font-mono">ESC</kbd>
          <button onClick={close} className="text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"><FiX size={16} /></button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* Recent searches */}
          {!query && recentSearches.length > 0 && (
            <div className="p-3">
              <p className="px-2 pb-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">Recent searches</p>
              {recentSearches.map(term => (
                <button key={term} onClick={() => { setQuery(term); inputRef.current?.focus(); }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-[var(--theme-text-muted)] hover:bg-[var(--theme-bg-alt)] transition-colors">
                  <FiClock size={13} className="shrink-0" />{term}
                </button>
              ))}
            </div>
          )}

          {/* Empty state */}
          {showEmpty && (
            <div className="flex items-center justify-center py-12 text-sm text-[var(--theme-text-muted)]">
              No results for &ldquo;{debouncedQuery}&rdquo;
            </div>
          )}

          {/* Categorised results */}
          {hasResults && (
            <div className="p-3 space-y-1">
              {Object.entries(results).map(([category, items]) => {
                if (!items.length) return null;
                const { label, Icon } = CATEGORY_META[category] || { label: category, Icon: FiSearch };
                return (
                  <div key={category}>
                    <p className="px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">{label} ({items.length})</p>
                    {items.map(result => {
                      const flatIdx = flatResults.findIndex(r => r.id === result.id && r.type === result.type);
                      const isFocused = flatIdx === focusedIndex;
                      return (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => goToResult(result)}
                          onMouseEnter={() => setFocusedIndex(flatIdx)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${isFocused ? 'bg-[var(--theme-primary)]/15 ring-1 ring-[var(--theme-primary)]/30' : 'hover:bg-[var(--theme-bg-alt)]'}`}
                        >
                          <span className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 ${isFocused ? 'bg-[var(--theme-primary)]/20 text-[var(--theme-primary)]' : 'bg-[var(--theme-bg-alt)] text-[var(--theme-text-muted)]'}`}>
                            <Icon size={14} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-[var(--theme-text)] truncate">{result.primary}</p>
                            <p className="text-xs text-[var(--theme-text-muted)] truncate">{result.secondary}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* Zero-query + no recent */}
          {!query && recentSearches.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-[var(--theme-text-muted)]">
              <FiSearch size={28} className="opacity-20" />
              <p className="text-sm">Start typing to search the admin panel</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
