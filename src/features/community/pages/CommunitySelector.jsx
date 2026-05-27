import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    FiBookOpen,
    FiBriefcase,
    FiCalendar,
    FiCode,
    FiEdit3,
    FiFeather,
    FiHeart,
    FiMessageCircle,
    FiPlus,
    FiSearch,
    FiUserPlus,
    FiVideo,
    FiAward,
    FiMusic,
    FiGlobe,
    FiX,
} from 'react-icons/fi';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import { COMMUNITY_BRANCHES, MOCK_UPCOMING_EVENTS } from '@/shared/data/communityData';
import LiveActivityPulse from '../components/LiveActivityPulse';
import core from '@/services/api/core';

// ── Constants ─────────────────────────────────────────────────────────────────

const ENROLLED_BRANCHES = ['dev', 'esports'];
const BRANCH_ORDER = ['dev', 'esports', 'content', 'business', 'art', 'writing', 'audio', 'general', 'newcomers'];

const BRANCH_META = {
    dev:       { label: 'Game Creation & Development',     icon: FiCode,      color: '#14B8A6' },
    esports:   { label: 'Esports, Play & Performance',    icon: FiAward,     color: '#EF4444' },
    content:   { label: 'Content, Media & Community',     icon: FiVideo,     color: '#F59E0B' },
    business:  { label: 'Business, Strategy & Ops',       icon: FiBriefcase, color: '#3B82F6' },
    art:       { label: 'Art, Visual & Character Design',  icon: FiEdit3,    color: '#EC4899' },
    writing:   { label: 'Writing, Narrative & Editorial',  icon: FiFeather,  color: '#22C55E' },
    audio:     { label: 'Music, Audio & Sound Design',    icon: FiMusic,     color: '#64748B' },
    general:   { label: 'General — Cross-Domain',         icon: FiGlobe,     color: '#6366F1' },
    newcomers: { label: 'Newcomers',                      icon: FiBookOpen,  color: '#0EA5E9' },
};

const LATEST_PREVIEWS = {
    dev:       'Lumen optimization gains on UE5.4 are wild — anyone else seeing this?',
    esports:   'Scrim signups for tonight are still open if your team needs one more.',
    content:   'New creator feedback threads are up and ready for reviews.',
    business:  'A fresh studio growth discussion kicked off this morning.',
    art:       'Members are sharing character sheets and critique requests today.',
    writing:   'Story prompts and worldbuilding notes are trending right now.',
    audio:     'Sound designers are swapping ambience packs and mix tips.',
    general:   'Introductions, open chat, and cross-branch updates are flowing.',
    newcomers: 'Start here for help, onboarding, and your first branch recommendations.',
};

const EVENT_TYPE_ICONS = {
    tournament: '🏆', game_jam: '🎮', ama: '🎤',
    workshop: '📚', watch_party: '📺', jam: '🎮',
};

const SHOWCASE_ITEMS = [
    { title: 'Veil of Ash · Trailer', domain: 'dev',     color: '#14B8A6', likes: 241, kind: 'VID' },
    { title: 'Cyber Samurai concept',  domain: 'art',     color: '#EC4899', likes: 312, kind: 'ART' },
    { title: 'VCT Highlight Reel',     domain: 'esports', color: '#EF4444', likes: 189, kind: 'VID' },
    { title: 'Boss Theme — WIP',       domain: 'audio',   color: '#64748B', likes: 94,  kind: 'MP3' },
];

const DOMAIN_COLORS = {
    dev: '#14B8A6', esports: '#EF4444', content: '#F59E0B', business: '#3B82F6',
    art: '#EC4899', writing: '#22C55E', audio: '#64748B', general: '#6366F1', newcomers: '#0EA5E9',
};

const SEARCH_TYPES   = ['All', 'Posts', 'People', 'Groups', 'Events'];
const SEARCH_BRANCHES = ['All', 'Dev', 'Esports', 'Content', 'Art', 'Writing', 'Audio', 'Business', 'General'];
const RECENCY_OPTIONS = [
    { value: 'any', label: 'Any time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This week' },
    { value: 'month', label: 'This month' },
];

// ── Primitive helpers ─────────────────────────────────────────────────────────

function Avatar({ url, name, size = 32 }) {
    return url ? (
        <img
            src={url}
            alt={name || ''}
            className="rounded-full object-cover shrink-0"
            style={{ width: size, height: size }}
        />
    ) : (
        <div
            className="rounded-full flex items-center justify-center shrink-0 font-bold text-white"
            style={{ width: size, height: size, background: '#6366F1', fontSize: size * 0.35 }}
        >
            {(name || '?')[0].toUpperCase()}
        </div>
    );
}

function DomainBadge({ domain }) {
    const color = DOMAIN_COLORS[domain] || '#6366F1';
    return (
        <span
            className="rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{ background: `${color}20`, color }}
        >
            {domain}
        </span>
    );
}

function ConnectButton({ userId }) {
    const [sent, setSent] = useState(false);
    return (
        <button
            disabled={sent}
            onClick={() => {
                core.post(`/social/friend-requests/${userId}`).then(r => r.data).catch(() => {});
                setSent(true);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition shrink-0"
            style={sent
                ? { background: '#F1F5F9', color: '#94A3B8' }
                : { background: '#EEF2FF', color: '#6366F1' }}
        >
            <FiUserPlus size={10} />
            {sent ? 'Sent' : 'Connect'}
        </button>
    );
}

// ── Task 3: Community-wide search bar ─────────────────────────────────────────

function CommunitySearchBar() {
    const navigate   = useNavigate();
    const [query,    setQuery]   = useState('');
    const [focused,  setFocused] = useState(false);
    const [typeF,    setTypeF]   = useState('All');
    const [branchF,  setBranchF] = useState('All');
    const [verified, setVerified] = useState(false);
    const [recency,  setRecency] = useState('any');
    const [results,  setResults] = useState(null);
    const [loading,  setLoading] = useState(false);
    const debounce   = useRef(null);
    const wrapperRef = useRef(null);

    const runSearch = useCallback(async (q, type, branch, verif, rec) => {
        if (q.length < 2) { setResults(null); return; }
        setLoading(true);
        try {
            const params = new URLSearchParams({
                q,
                type: type.toLowerCase(),
                verified_only: verif,
                recency: rec,
            });
            if (branch !== 'All') params.set('branch', branch.toLowerCase());
            const data = await core.get(`/community/search?${params}`).then(r => r.data);
            setResults(data?.data || null);
        } catch {
            setResults(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        clearTimeout(debounce.current);
        debounce.current = setTimeout(() => runSearch(query, typeF, branchF, verified, recency), 300);
        return () => clearTimeout(debounce.current);
    }, [query, typeF, branchF, verified, recency, runSearch]);

    useEffect(() => {
        function onClickOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setFocused(false);
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    const hasResults = results && (
        results.people?.length || results.posts?.length ||
        results.groups?.length || results.events?.length
    );
    const showDrop = focused && query.length >= 2;

    return (
        <div ref={wrapperRef} className="relative px-8 pb-3 pt-2">
            {/* Input row */}
            <div
                className="flex items-center gap-3 rounded-2xl px-4 py-3 transition"
                style={{
                    background: '#fff',
                    border: `1.5px solid ${focused ? '#6366F1' : '#E2E8F0'}`,
                    boxShadow: focused ? '0 0 0 3px #6366F115' : 'none',
                }}
            >
                <FiSearch size={16} style={{ color: '#94A3B8', flexShrink: 0 }} />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setFocused(true)}
                    placeholder="Search posts, people, groups, events across all branches..."
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                    style={{ color: '#0F172A' }}
                />
                {query && (
                    <button onClick={() => { setQuery(''); setResults(null); }} className="p-0.5">
                        <FiX size={14} style={{ color: '#94A3B8' }} />
                    </button>
                )}
            </div>

            {/* Filter chips */}
            {focused && (
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                    {/* Type */}
                    <div className="flex gap-1">
                        {SEARCH_TYPES.map((t) => (
                            <button
                                key={t}
                                onClick={() => setTypeF(t)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                                style={typeF === t ? { background: '#6366F1', color: '#fff' } : { background: '#F1F5F9', color: '#475569' }}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <span className="w-px h-4 bg-slate-200 shrink-0" />
                    {/* Branch */}
                    <div className="flex gap-1 flex-wrap">
                        {SEARCH_BRANCHES.map((b) => (
                            <button
                                key={b}
                                onClick={() => setBranchF(b)}
                                className="px-2 py-0.5 rounded-md text-[11px] font-medium transition"
                                style={branchF === b ? { background: '#0F172A', color: '#fff' } : { background: '#F1F5F9', color: '#64748B' }}
                            >
                                {b}
                            </button>
                        ))}
                    </div>
                    <span className="w-px h-4 bg-slate-200 shrink-0" />
                    {/* Verified toggle */}
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={verified}
                            onChange={(e) => setVerified(e.target.checked)}
                            className="rounded"
                        />
                        Verified only
                    </label>
                    <span className="w-px h-4 bg-slate-200 shrink-0" />
                    {/* Recency */}
                    {RECENCY_OPTIONS.map((r) => (
                        <button
                            key={r.value}
                            onClick={() => setRecency(r.value)}
                            className="px-2 py-0.5 rounded-md text-[11px] font-medium transition"
                            style={recency === r.value ? { background: '#F59E0B', color: '#fff' } : { background: '#F1F5F9', color: '#64748B' }}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Dropdown */}
            {showDrop && (
                <div
                    className="absolute left-8 right-8 z-50 mt-1 rounded-2xl overflow-hidden overflow-y-auto"
                    style={{ maxHeight: 400, background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                >
                    {loading && <div className="px-4 py-6 text-center text-sm text-slate-400">Searching…</div>}
                    {!loading && !hasResults && <div className="px-4 py-6 text-center text-sm text-slate-400">No results for "{query}"</div>}
                    {!loading && hasResults && (
                        <>
                            {results.people?.length > 0 && (
                                <SearchSection label="People" icon="👤">
                                    {results.people.map((p) => (
                                        <SearchRow key={p.id} onClick={() => { navigate(`/u/${p.username}`); setFocused(false); }}>
                                            <Avatar url={p.avatar_url} name={p.username} size={28} />
                                            <span className="flex-1 text-sm font-semibold text-slate-800">{p.username}</span>
                                            {p.domain && <DomainBadge domain={p.domain} />}
                                            <span className="text-xs text-slate-400 ml-2">{p.trust_score?.toFixed(1)} ★</span>
                                        </SearchRow>
                                    ))}
                                </SearchSection>
                            )}
                            {results.posts?.length > 0 && (
                                <SearchSection label="Posts" icon="📝">
                                    {results.posts.map((p) => (
                                        <SearchRow key={p.id} onClick={() => { navigate(`/community/${p.branch_slug}`); setFocused(false); }}>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-slate-700 truncate">{p.text}</p>
                                                <p className="text-xs text-slate-400">{p.author_username} · {p.branch_slug}</p>
                                            </div>
                                        </SearchRow>
                                    ))}
                                </SearchSection>
                            )}
                            {results.groups?.length > 0 && (
                                <SearchSection label="Groups" icon="👥">
                                    {results.groups.map((g) => (
                                        <SearchRow key={g.id} onClick={() => { navigate(`/community/${g.branch_slug}/groups/${g.id}`); setFocused(false); }}>
                                            <span className="flex-1 text-sm font-medium text-slate-800">{g.name}</span>
                                            <span className="text-xs text-slate-400">{g.branch_slug} · {g.member_count} members</span>
                                        </SearchRow>
                                    ))}
                                </SearchSection>
                            )}
                            {results.events?.length > 0 && (
                                <SearchSection label="Events" icon="📅">
                                    {results.events.map((e) => (
                                        <SearchRow key={e.id}>
                                            <span className="flex-1 text-sm font-medium text-slate-800">{e.title}</span>
                                            <span className="text-xs text-slate-400">{e.branch_slug} · {e.rsvp_count} RSVPs</span>
                                        </SearchRow>
                                    ))}
                                </SearchSection>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

function SearchSection({ label, icon, children }) {
    return (
        <div>
            <div className="px-4 py-2 flex items-center gap-1.5 border-b border-slate-100 sticky top-0 bg-white z-10">
                <span>{icon}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</span>
            </div>
            {children}
        </div>
    );
}

function SearchRow({ children, onClick }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 transition text-left"
        >
            {children}
        </button>
    );
}

// ── Task 1A: Pinned Announcements ─────────────────────────────────────────────

function PinnedAnnouncementsStrip({ announcements }) {
    if (!announcements.length) return null;
    return (
        <div className="flex gap-3 overflow-x-auto pb-1 mb-4">
            {announcements.map((a) => (
                <div
                    key={a.id}
                    className="flex-shrink-0 rounded-xl border p-4 flex flex-col gap-2"
                    style={{ minWidth: 260, maxWidth: 300, background: '#FFFBEB', borderColor: '#FDE68A' }}
                >
                    <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-400 text-white tracking-widest">
                            PINNED
                        </span>
                        <span className="text-[10px] text-amber-600">
                            {a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}
                        </span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 leading-snug line-clamp-2">
                        {(a.title || '').slice(0, 80)}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2 flex-1">
                        {(a.body || '').slice(0, 120)}
                    </p>
                    <div className="flex items-center gap-2 mt-auto">
                        <Avatar url={a.author?.avatar_url} name={a.author?.username || 'Admin'} size={18} />
                        <span className="text-[11px] text-slate-500 flex-1 truncate">{a.author?.username || 'Admin'}</span>
                        {a.link && (
                            <Link to={a.link} className="text-xs font-semibold text-amber-600 hover:underline shrink-0">
                                Read →
                            </Link>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Task 1B+C: Featured post + tournament/weekly winner ───────────────────────

function FeaturedRow({ featuredPost, tournament, weeklyWinner }) {
    return (
        <div className="grid grid-cols-3 gap-4 mb-4">
            {/* Featured post — 2/3 */}
            <div className="col-span-2">
                {featuredPost ? (
                    <div
                        className="rounded-2xl border h-full p-5 flex flex-col gap-3"
                        style={{ background: 'linear-gradient(135deg,#EEF2FF,#F8FAFC)', borderColor: '#C7D2FE', minHeight: 160 }}
                    >
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-yellow-400 text-white tracking-wider">
                                FEATURED TODAY
                            </span>
                            {featuredPost.branch_slug && <DomainBadge domain={featuredPost.branch_slug} />}
                        </div>
                        <h3 className="text-base font-bold text-slate-800 leading-snug">
                            {featuredPost.title}
                        </h3>
                        <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed flex-1">
                            {featuredPost.excerpt}
                        </p>
                        <div className="flex items-center justify-between mt-auto pt-1">
                            <div className="flex items-center gap-2">
                                <Avatar url={featuredPost.author?.avatar_url} name={featuredPost.author?.username} size={26} />
                                <span className="text-sm font-medium text-slate-600">{featuredPost.author?.username}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-400">
                                <span className="flex items-center gap-1"><FiHeart size={11} /> {featuredPost.likes || 0}</span>
                                <span className="flex items-center gap-1"><FiMessageCircle size={11} /> {featuredPost.comments || 0}</span>
                            </div>
                        </div>
                        {featuredPost.branch_slug && (
                            <Link to={`/community/${featuredPost.branch_slug}`} className="text-xs font-semibold text-indigo-600 hover:underline self-start">
                                Read Post →
                            </Link>
                        )}
                    </div>
                ) : (
                    <div
                        className="rounded-2xl border h-full p-5 flex items-center justify-center"
                        style={{ background: '#F8FAFC', borderColor: '#E2E8F0', minHeight: 160 }}
                    >
                        <p className="text-sm text-slate-400">No featured post today</p>
                    </div>
                )}
            </div>

            {/* Tournament or Weekly Winner — 1/3 */}
            <div className="col-span-1">
                {tournament ? (
                    <div
                        className="rounded-2xl border h-full p-4 flex flex-col gap-2"
                        style={{ background: 'linear-gradient(135deg,#FFF7ED,#FFFBEB)', borderColor: '#FED7AA', minHeight: 160 }}
                    >
                        <p className="text-[10px] font-black text-amber-600 tracking-wider">🏆 ACTIVE TOURNAMENT</p>
                        <p className="text-sm font-bold text-slate-800 leading-snug">{tournament.title}</p>
                        {tournament.game_slug && <p className="text-xs text-slate-500">{tournament.game_slug}</p>}
                        <div className="flex flex-wrap items-center gap-2">
                            <span
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                style={{
                                    background: tournament.status === 'live' ? '#EF444420' : '#3B82F620',
                                    color: tournament.status === 'live' ? '#EF4444' : '#3B82F6',
                                }}
                            >
                                {(tournament.status || '').toUpperCase()}
                            </span>
                            {tournament.prize_pool && (
                                <span className="text-xs font-semibold text-emerald-600">{tournament.prize_pool}</span>
                            )}
                        </div>
                        <div className="mt-auto pt-2">
                            <Link to={`/tournaments/${tournament.slug}`} className="text-xs font-bold text-amber-600 hover:underline">
                                View →
                            </Link>
                        </div>
                    </div>
                ) : weeklyWinner ? (
                    <div
                        className="rounded-2xl border h-full p-4 flex flex-col gap-2"
                        style={{ background: '#F8FAFC', borderColor: '#E2E8F0', minHeight: 160 }}
                    >
                        <p className="text-[10px] font-black text-slate-500 tracking-wider">⭐ WEEKLY SHOWCASE WINNER</p>
                        {weeklyWinner.media_urls?.[0] && (
                            <img
                                src={weeklyWinner.media_urls[0]}
                                alt={weeklyWinner.title}
                                className="w-full rounded-lg object-cover"
                                style={{ height: 64 }}
                            />
                        )}
                        <p className="text-sm font-bold text-slate-800 line-clamp-2 flex-1">{weeklyWinner.title}</p>
                        <div className="flex items-center gap-1.5 mt-auto">
                            <Avatar url={weeklyWinner.author?.avatar_url} name={weeklyWinner.author?.username} size={20} />
                            <span className="text-xs text-slate-500 truncate">{weeklyWinner.author?.username}</span>
                            {weeklyWinner.author_domain && <DomainBadge domain={weeklyWinner.author_domain} />}
                        </div>
                    </div>
                ) : (
                    <div
                        className="rounded-2xl border h-full p-4 flex items-center justify-center"
                        style={{ background: '#F8FAFC', borderColor: '#E2E8F0', minHeight: 160 }}
                    >
                        <p className="text-xs text-slate-400 text-center">No active tournaments</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Wrapper that fetches and coordinates all three sub-blocks
function FeaturedContentBlock() {
    const [announcements, setAnnouncements] = useState([]);
    const [featuredPost,  setFeaturedPost]  = useState(null);
    const [tournament,    setTournament]    = useState(null);
    const [weeklyWinner,  setWeeklyWinner]  = useState(null);

    useEffect(() => {
        core.get('/community/announcements').then(r => r.data)
            .then((d) => setAnnouncements(d?.data || []))
            .catch(() => {});

        core.get('/community/featured-post').then(r => r.data)
            .then((d) => setFeaturedPost(d?.data || null))
            .catch(() => {});

        core.get('/tournaments?status=live&limit=1').then(r => r.data)
            .then((d) => {
                const list = d?.data;
                setTournament(Array.isArray(list) ? (list[0] || null) : null);
            })
            .catch(() => {});

        core.get('/community/showcase/weekly-winner').then(r => r.data)
            .then((d) => setWeeklyWinner(d?.data || null))
            .catch(() => {});
    }, []);

    const anything = announcements.length || featuredPost || tournament || weeklyWinner;
    if (!anything) return null;

    return (
        <div className="mb-6">
            <PinnedAnnouncementsStrip announcements={announcements} />
            <FeaturedRow
                featuredPost={featuredPost}
                tournament={tournament}
                weeklyWinner={weeklyWinner}
            />
        </div>
    );
}

// ── Task 2A: Friends Online sidebar section ───────────────────────────────────

function FriendsOnlineSection() {
    const [friends, setFriends] = useState([]);
    const token = localStorage.getItem('gzs_access_token');

    useEffect(() => {
        if (!token) return;
        const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        core.get('/social/friends').then(r => r.data)
            .then((d) => {
                const all = d?.data || [];
                setFriends(
                    all.filter((f) => f.last_active_at && f.last_active_at > cutoff).slice(0, 8),
                );
            })
            .catch(() => {});
    }, [token]);

    return (
        <div className="rounded-2xl border p-4" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Friends Online</h3>
                <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                    style={{ background: '#22C55E20', color: '#22C55E' }}
                >
                    {friends.length} online
                </span>
            </div>

            {!token ? (
                <p className="text-xs text-slate-400">Sign in to see friends online.</p>
            ) : friends.length === 0 ? (
                <p className="text-xs text-slate-400">No friends active in the last 30 minutes.</p>
            ) : (
                <div className="flex flex-col gap-2.5">
                    {friends.map((f) => (
                        <Link key={f.id} to={`/u/${f.username}`} className="flex items-center gap-2 group">
                            <div className="relative shrink-0">
                                <Avatar url={f.avatar_url} name={f.username} size={28} />
                                <span
                                    className="absolute bottom-0 right-0 w-2 h-2 rounded-full border-2 border-white"
                                    style={{ background: '#22C55E' }}
                                />
                            </div>
                            <span className="text-xs font-medium text-slate-700 group-hover:text-indigo-600 transition flex-1 truncate">
                                {f.username}
                            </span>
                            {f.active_branch && <DomainBadge domain={f.active_branch} />}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Task 2B: Who's New sidebar section ───────────────────────────────────────

function WhosNewSection() {
    const [members, setMembers] = useState([]);

    useEffect(() => {
        core.get('/community/new-members?limit=5').then(r => r.data)
            .then((d) => setMembers(d?.data || []))
            .catch(() => {});
    }, []);

    if (!members.length) return null;

    return (
        <div className="rounded-2xl border p-4" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-3">New to GzoneSphere</h3>
            <div className="flex flex-col gap-3">
                {members.map((m) => (
                    <div key={m.id} className="flex items-center gap-2">
                        <Avatar url={m.avatar_url} name={m.username} size={28} />
                        <div className="flex-1 min-w-0">
                            <Link to={`/u/${m.username}`} className="text-xs font-semibold text-slate-800 hover:text-indigo-600 transition truncate block">
                                {m.username}
                            </Link>
                            {m.domain && <DomainBadge domain={m.domain} />}
                        </div>
                        <ConnectButton userId={m.id} />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Task 2C: Recommended Connections sidebar section ──────────────────────────

function RecommendedSection() {
    const [recs, setRecs] = useState([]);
    const token = localStorage.getItem('gzs_access_token');

    useEffect(() => {
        if (!token) return;
        core.get('/community/recommended-connections?limit=5').then(r => r.data)
            .then((d) => setRecs(d?.data || []))
            .catch(() => {});
    }, [token]);

    if (!token || !recs.length) return null;

    return (
        <div className="rounded-2xl border p-4" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-3">Recommended</h3>
            <div className="flex flex-col gap-3">
                {recs.map((r) => (
                    <div key={r.id} className="flex items-start gap-2">
                        <Avatar url={r.avatar_url} name={r.username} size={28} />
                        <div className="flex-1 min-w-0">
                            <Link to={`/u/${r.username}`} className="text-xs font-semibold text-slate-800 hover:text-indigo-600 transition truncate block">
                                {r.username}
                            </Link>
                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                {r.domain && <DomainBadge domain={r.domain} />}
                                {r.primary_role && (
                                    <span className="text-[10px] text-slate-400 truncate">{r.primary_role}</span>
                                )}
                            </div>
                        </div>
                        <ConnectButton userId={r.id} />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Event card (unchanged from original) ─────────────────────────────────────

function EventCard({ event }) {
    const [rsvpd, setRsvpd] = useState(false);
    const typeIcon  = EVENT_TYPE_ICONS[event.event_type] || '📅';
    const typeLabel = (event.event_type || '').replace('_', ' ');
    const dateStr   = new Date(event.start_at || event.starts_at).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });

    return (
        <div className="community-event-card">
            <div className="flex items-center gap-2">
                <span className="text-base">{typeIcon}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">{typeLabel}</span>
            </div>
            <p className="text-sm font-bold text-[var(--theme-text)] line-clamp-2 leading-snug">{event.title}</p>
            {event.host && (
                <div className="flex items-center gap-2">
                    <Avatar url={event.host.avatar_url} name={event.host.display_name} size={20} />
                    <span className="text-xs text-[var(--theme-text-muted)]">{event.host.display_name}</span>
                </div>
            )}
            <div className="mt-auto pt-2 flex items-end justify-between">
                <div>
                    <p className="text-[11px] text-[var(--theme-text-muted)] flex items-center gap-1">
                        <FiCalendar size={9} /> {dateStr}
                    </p>
                    <p className="text-[11px] text-[var(--theme-text-muted)] mt-0.5">{event.rsvp_count} going</p>
                </div>
                <button
                    onClick={async () => {
                        const next = !rsvpd;
                        setRsvpd(next);
                        try {
                            if (next) await core.post(`/community/events/${event.id}/rsvp`);
                            else await core.delete(`/community/events/${event.id}/rsvp`);
                        } catch {
                            setRsvpd(!next);
                        }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        rsvpd
                            ? 'bg-[var(--theme-primary)] text-white'
                            : 'bg-[var(--theme-bg-alt)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-primary)]/20 hover:text-[var(--theme-primary)]'
                    }`}
                >
                    {rsvpd ? 'Going ✓' : 'RSVP'}
                </button>
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CommunitySelector() {
    usePageTheme('community');

    const [branchFilter, setBranchFilter] = useState('all');
    const [followedIds]  = useState(new Set(ENROLLED_BRANCHES));
    const [showcaseItems, setShowcaseItems] = useState(SHOWCASE_ITEMS);

    useEffect(() => {
        core.get('/community/showcase/trending?limit=4')
            .then(r => {
                const items = r.data?.data || r.data || [];
                if (items.length > 0) setShowcaseItems(items.map(item => ({
                    title: item.title,
                    domain: item.branch_slug || item.domain,
                    color: DOMAIN_COLORS[item.branch_slug] || '#6366F1',
                    likes: item.likes || 0,
                    kind: item.media_type === 'video' ? 'VID' : item.media_type === 'audio' ? 'MP3' : 'ART',
                })));
            })
            .catch(() => {});
    }, []);

    const branchCards = BRANCH_ORDER
        .map((slug) => COMMUNITY_BRANCHES.find((b) => b.slug === slug))
        .filter(Boolean)
        .filter((b) => branchFilter === 'joined' ? followedIds.has(b.slug) : true)
        .sort((a, b) => {
            if (branchFilter === 'active') {
                return (b.member_count || 0) - (a.member_count || 0);
            }
            return BRANCH_ORDER.indexOf(a.slug) - BRANCH_ORDER.indexOf(b.slug);
        });

    const totalOnline  = branchCards.reduce((s, b) => s + Math.round((b?.member_count || 1000) * 0.08), 0);
    const totalMembers = branchCards.reduce((s, b) => s + (b?.member_count || 0), 0);

    return (
        <div className="min-h-screen" style={{ background: '#F1F5F9' }}>
            <Helmet>
                <title>Community Hub | GzoneSphere</title>
                <meta name="description" content="Connect with GzoneSphere's diverse communities. Join a Branch, find teammates (LFG), and participate in global gaming discussions." />
            </Helmet>

            {/* ── HERO ───────────────────────────────────────────── */}
            <div className="community-hub-hero">
                <div className="flex items-end justify-between mb-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#7C3AED' }}>
                            COMMUNITY HUB · /community
                        </p>
                        <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: '#0F172A', letterSpacing: '-0.025em' }}>
                            Find your people.
                        </h1>
                        <p className="text-sm max-w-lg" style={{ color: '#475569' }}>
                            Nine community branches. Real-time chat. LFG boards. Showcase posts. All connected through your sub-profiles.
                        </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <Link
                            to="/community/general/events"
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold"
                            style={{ background: '#fff', border: '1px solid #E2E8F0', color: '#334155' }}
                        >
                            <FiCalendar size={14} /> Events
                        </Link>
                        <Link
                            to="/community/general/showcase"
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                            style={{ background: '#1D6ADB' }}
                        >
                            <FiPlus size={14} /> New Showcase
                        </Link>
                    </div>
                </div>

                {/* Stats bar */}
                <div className="flex flex-wrap gap-2">
                    <div className="hub-stats-pill">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <b>{totalOnline.toLocaleString()}</b>
                        <span className="text-xs" style={{ color: '#64748B' }}>members online now</span>
                    </div>
                    <div className="hub-stats-pill">
                        <b>{BRANCH_ORDER.length}</b>
                        <span className="text-xs" style={{ color: '#64748B' }}>branches</span>
                    </div>
                    <div className="hub-stats-pill">
                        <b>284</b>
                        <span className="text-xs" style={{ color: '#64748B' }}>live discussions</span>
                    </div>
                    <div className="hub-stats-pill">
                        <b>{(totalMembers / 1000).toFixed(0)}K</b>
                        <span className="text-xs" style={{ color: '#64748B' }}>total members</span>
                    </div>
                </div>
            </div>

            {/* ── TASK 3: SEARCH BAR ─────────────────────────────── */}
            <CommunitySearchBar />

            {/* ── LIVE TICKER ────────────────────────────────────── */}
            <LiveActivityPulse />

            {/* ── TWO-COLUMN BODY ────────────────────────────────── */}
            <div className="px-8 py-6 flex gap-6 items-start">

                {/* Main column — 70% */}
                <div className="flex-1 min-w-0">

                    {/* ── TASK 1: FEATURED CONTENT BLOCK ────────── */}
                    <FeaturedContentBlock />

                    {/* ── BRANCHES GRID ─────────────────────────── */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-sm font-bold" style={{ color: '#0F172A' }}>
                                All {BRANCH_ORDER.length} Branches
                            </h2>
                            <div className="flex gap-1.5">
                                {[['all', 'All'], ['joined', `Joined (${followedIds.size})`], ['active', 'Most active']].map(([val, lbl]) => (
                                    <button
                                        key={val}
                                        onClick={() => setBranchFilter(val)}
                                        className="hub-pill"
                                        style={branchFilter === val ? { background: '#1D6ADB', color: '#fff' } : {}}
                                    >
                                        {lbl}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {branchCards.map((branch) => {
                                const meta = BRANCH_META[branch?.slug];
                                if (!meta || !branch) return null;
                                const Icon = meta.icon;
                                const onlineCount = Math.max(12, Math.round((branch.member_count || 1000) * 0.08));
                                const isJoined = followedIds.has(branch.slug);
                                const latestMsg = LATEST_PREVIEWS[branch.slug] || '';

                                return (
                                    <div
                                        key={branch.id}
                                        className="branch-grid-card"
                                        style={{ borderLeft: `4px solid ${meta.color}` }}
                                    >
                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-2.5">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="flex items-center justify-center rounded-xl shrink-0"
                                                        style={{ width: 44, height: 44, background: `${meta.color}1A`, color: meta.color }}
                                                    >
                                                        <Icon size={22} />
                                                    </div>
                                                    <div>
                                                        <Link
                                                            to={`/community/${branch.slug}`}
                                                            className="text-sm font-bold hover:underline"
                                                            style={{ color: '#0F172A', letterSpacing: '-0.01em' }}
                                                        >
                                                            {meta.label.split('—')[0].trim()}
                                                        </Link>
                                                        <p className="text-[10px] font-medium mt-0.5" style={{ color: '#94A3B8', fontFamily: 'monospace' }}>
                                                            /community/{branch.slug}
                                                        </p>
                                                    </div>
                                                </div>
                                                {isJoined && <span className="chip-verified text-[10px]">Joined</span>}
                                            </div>

                                            <div className="flex gap-3 mb-3 text-xs" style={{ color: '#64748B' }}>
                                                <span><b style={{ color: '#0F172A' }}>{(branch.member_count || 0).toLocaleString()}</b> members</span>
                                                <span className="flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                    <b style={{ color: '#0F172A' }}>{onlineCount}</b> online
                                                </span>
                                            </div>

                                            {latestMsg && (
                                                <div
                                                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
                                                    style={{ background: '#F8FAFC' }}
                                                >
                                                    <FiMessageCircle size={12} style={{ color: '#94A3B8', flexShrink: 0 }} />
                                                    <span className="flex-1 truncate" style={{ color: '#475569' }}>"{latestMsg}"</span>
                                                    <span style={{ color: '#94A3B8', fontSize: 10 }}>2m</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── BOTTOM PANELS: Showcase + Events ──────── */}
                    <div className="grid grid-cols-1 gap-4 pb-10 lg:grid-cols-2">
                        {/* Trending Showcase */}
                        <div className="rounded-2xl border p-4" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-bold" style={{ color: '#0F172A' }}>Trending Showcase · This Week</h3>
                                <Link to="/community/general/showcase" className="text-xs font-semibold" style={{ color: '#1D6ADB' }}>
                                    See all →
                                </Link>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                                {showcaseItems.map((item) => (
                                    <div key={item.title}>
                                        <div
                                            className="showcase-thumb rounded-lg mb-2 flex items-center justify-center text-xs font-bold text-white"
                                            style={{ height: 90, background: `linear-gradient(135deg, ${item.color}, ${item.color}60)` }}
                                        >
                                            {item.kind}
                                        </div>
                                        <p className="text-xs font-semibold truncate" style={{ color: '#0F172A' }}>{item.title}</p>
                                        <div className="flex items-center gap-2 text-[11px]" style={{ color: '#64748B' }}>
                                            <span className="rounded-full px-1.5 py-0.5 font-medium" style={{ background: `${item.color}15`, color: item.color }}>
                                                {item.domain}
                                            </span>
                                            <span className="flex items-center gap-1"><FiHeart size={10} /> {item.likes}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Upcoming Events */}
                        <div className="rounded-2xl border p-4" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-bold" style={{ color: '#0F172A' }}>Upcoming Events · Next 7 Days</h3>
                                <button className="text-xs font-semibold" style={{ color: '#1D6ADB' }}>Calendar →</button>
                            </div>
                            <div className="flex flex-col gap-2">
                                {(MOCK_UPCOMING_EVENTS || []).slice(0, 4).map((event) => {
                                    const meta = BRANCH_META[event?.branch_slug] || BRANCH_META.general;
                                    const dateObj = new Date(event?.start_at || '2024-01-01');
                                    const dayLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();

                                    return (
                                        <div
                                            key={event.id}
                                            className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                                            style={{ background: '#F8FAFC' }}
                                        >
                                            <div
                                                className="text-center rounded-lg border flex-shrink-0 px-2 py-1"
                                                style={{ background: '#fff', borderColor: '#E2E8F0', minWidth: 44 }}
                                            >
                                                <p className="text-[9px]" style={{ color: '#94A3B8' }}>{dayLabel.split(' ')[0]}</p>
                                                <p className="text-sm font-extrabold" style={{ color: '#0F172A' }}>{dayLabel.split(' ')[1]}</p>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold truncate" style={{ color: '#0F172A' }}>{event.title}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5 text-[11px]" style={{ color: '#64748B' }}>
                                                    <span className="rounded-full px-1.5 py-0 font-medium" style={{ background: `${meta.color}15`, color: meta.color }}>
                                                        {event.branch_slug}
                                                    </span>
                                                    <span>· {event.rsvp_count} RSVPs</span>
                                                </div>
                                            </div>
                                            <button
                                                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold flex-shrink-0"
                                                style={{ background: '#fff', border: '1px solid #E2E8F0', color: '#334155' }}
                                            >
                                                RSVP
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── TASK 2: RIGHT SIDEBAR — 30% ─────────────────── */}
                <div className="w-[300px] shrink-0 sticky top-4 self-start flex flex-col gap-4 pb-10">
                    <FriendsOnlineSection />
                    <WhosNewSection />
                    <RecommendedSection />
                </div>
            </div>
        </div>
    );
}
