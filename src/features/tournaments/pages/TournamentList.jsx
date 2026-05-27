import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowUpRight, FiSearch, FiFilter, FiActivity, FiCalendar, FiAward } from 'react-icons/fi';
import Breadcrumb from '@/shared/components/Breadcrumb';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import { usePublicTournaments } from '@/services/mutators/useTournaments';
import { Helmet } from 'react-helmet-async';
import { adaptTournamentRecord } from '@/shared/adapters/contentAdapters';
import TournamentCard from '@/shared/components/TournamentCard';
import Skeleton from '@/shared/components/Skeleton';

const DOMAIN_PILLS  = ['All', 'Esports', 'Dev', 'Art', 'Writing', 'Music'];
const STATUS_PILLS  = ['All', 'Live', 'Open', 'Upcoming'];
const PLATFORM_PILLS = ['All', 'PC', 'Mobile', 'Console'];

export default function TournamentList() {
    const { data: tournaments = [], isLoading } = usePublicTournaments();
    const tournamentItems = tournaments.map(adaptTournamentRecord);
    const [filterGame, setFilterGame] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterDomain, setFilterDomain] = useState('All');
    const [sortBy, setSortBy] = useState('date');
    const [search, setSearch] = useState('');
    usePageTheme('tournaments-page');

    const handleSortByChange = useCallback((e) => setSortBy(e.target.value), []);
    const handleSearchChange = useCallback((e) => setSearch(e.target.value), []);
    const handleResetFilters = useCallback(() => {
        setFilterGame('ALL');
        setFilterStatus('All');
        setFilterDomain('All');
        setSortBy('date');
        setSearch('');
    }, []);

    const filteredTournaments = useMemo(() => {
        const statusMap = { 'All': null, 'Live': 'live', 'Open': 'registration_open', 'Upcoming': 'upcoming' };
        return tournamentItems
            .filter((t) => {
                const matchesGame   = filterGame === 'ALL' || (t.game || t.game_id || '')?.toLowerCase().includes(filterGame.toLowerCase());
                const mappedStatus  = statusMap[filterStatus];
                const matchesStatus = !mappedStatus || (t.status || '').toLowerCase() === mappedStatus;
                const matchesSearch = !search || (t.name || t.title || '').toLowerCase().includes(search.toLowerCase()) || (t.game || '').toLowerCase().includes(search.toLowerCase());
                const matchesDomain = filterDomain === 'All' || (t.tournament_type || t.type || '')?.toLowerCase() === filterDomain.toLowerCase();
                return matchesGame && matchesStatus && matchesSearch && matchesDomain;
            })
            .sort((a, b) => {
                if (sortBy === 'prize') return ((b.prize_pool?.total || b.prize || '₹0').replace(/[^0-9]/g, '') - (a.prize_pool?.total || a.prize || '₹0').replace(/[^0-9]/g, ''));
                if (sortBy === 'registrations') return (b.current_participants || 0) - (a.current_participants || 0);
                return new Date(a.start_date || a.date || 0) - new Date(b.start_date || b.date || 0);
            });
    }, [tournamentItems, filterGame, filterStatus, filterDomain, sortBy, search]);


    return (
        <div className="theme-tournaments min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] flex flex-col">
            <Helmet>
                <title>The Vault | GzoneSphere Tournaments</title>
                <meta name="description" content="Browse the ultimate tournament vault on GzoneSphere. Compete for major prize pools in Esports, Writing, Art, and Development across PC, Console, and Mobile." />
                <meta property="og:title" content="The Vault | GzoneSphere Tournaments" />
                <meta property="og:description" content="Browse the ultimate tournament vault on GzoneSphere. Compete for major prize pools in Esports, Writing, Art, and Development." />
                <meta name="twitter:card" content="summary_large_image" />
                <link rel="canonical" href={window.location.href} />
            </Helmet>

            {/* ── HERO ──────────────────────────────────────────── */}
            <section className="relative pt-32 pb-20 flex flex-col items-center justify-center text-center overflow-hidden">
                <div
                    className="absolute inset-0 bg-[var(--theme-bg-alt)] opacity-50"
                    style={{
                        backgroundImage: `radial-gradient(circle at 2px 2px, var(--theme-primary) 1px, transparent 0)`,
                        backgroundSize: '40px 40px'
                    }}
                    aria-hidden="true"
                />
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--theme-primary)] to-transparent" aria-hidden="true" />

                <div className="relative z-10 px-6 md:px-12 container-global">
                    <span className="inline-block mb-4 px-4 py-1 rounded-full text-xs font-black tracking-widest uppercase bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] border border-[var(--theme-primary)]/20 animate-pulse">
                        <FiActivity className="inline-block mr-1" /> LIVE COMPETITION
                    </span>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight text-[var(--theme-text)] leading-none mb-6 font-heading">
                        THE TOURNAMENT <span className="text-[var(--theme-primary)]">VAULT</span>
                    </h1>
                    <p className="text-[var(--theme-text-muted)] text-sm md:text-base tracking-widest uppercase mb-4 font-bold max-w-2xl mx-auto">
                        Find your next battleground. Registration for over <span className="text-[var(--theme-text)]">₹100k+</span> in prize pools active today.
                    </p>
                </div>
            </section>

            {/* ── MAIN CONTENT ────────────────────────────────────── */}
            <section className="flex-1 py-12">
                <div className="container-global">
                    <Breadcrumb items={[
                        { label: 'Platform', to: '/' },
                        { label: 'tournaments', to: '/tournaments' },
                        { label: 'The Vault' },
                    ]} />

                    {/* Filter Bar */}
                    <div className="mb-10 bg-[var(--theme-card)] p-5 rounded-2xl border border-[var(--theme-border)] space-y-4">
                        {/* Search row */}
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search tournaments..."
                                    className="bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] text-[var(--theme-text)] text-sm rounded-xl pl-11 pr-4 py-2.5 w-full outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/20 placeholder:text-[var(--theme-text-muted)] font-medium"
                                    value={search}
                                    onChange={handleSearchChange}
                                />
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-black uppercase text-[var(--theme-text-muted)] tracking-widest">Sort:</span>
                                <select
                                    className="appearance-none bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] text-[var(--theme-text)] text-xs rounded-xl px-3 py-2.5 outline-none font-bold cursor-pointer"
                                    value={sortBy}
                                    onChange={handleSortByChange}
                                >
                                    <option value="date">Start Date</option>
                                    <option value="prize">Prize (High-Low)</option>
                                    <option value="registrations">Most Registered</option>
                                </select>
                            </div>
                        </div>

                        {/* Domain pills */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] shrink-0">Domain:</span>
                            {DOMAIN_PILLS.map(d => (
                                <button
                                    key={d}
                                    onClick={() => setFilterDomain(d)}
                                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide transition-all ${
                                        filterDomain === d
                                            ? 'bg-[var(--theme-primary)] text-white shadow-md'
                                            : 'bg-[var(--theme-bg-alt)] text-[var(--theme-text-muted)] border border-[var(--theme-border)] hover:border-[var(--theme-primary)]/40'
                                    }`}
                                >{d}</button>
                            ))}
                        </div>

                        {/* Status + Platform pills */}
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] shrink-0">Status:</span>
                                {STATUS_PILLS.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setFilterStatus(s)}
                                        className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide transition-all ${
                                            filterStatus === s
                                                ? s === 'Live' ? 'bg-red-600 text-white animate-pulse' : 'bg-[var(--theme-primary)] text-white shadow-md'
                                                : 'bg-[var(--theme-bg-alt)] text-[var(--theme-text-muted)] border border-[var(--theme-border)] hover:border-[var(--theme-primary)]/40'
                                        }`}
                                    >
                                        {s === 'Live' && filterStatus === 'Live' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-1" />}
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Results Count */}
                    <div className="mb-6 flex items-center gap-2">
                        <div className="h-0.5 flex-1 bg-[var(--theme-border)]"></div>
                        <span className="gzs-label-sm !text-xs uppercase opacity-60">
                            SHOWING {filteredTournaments.length} CHALLENGES
                        </span>
                        <div className="h-0.5 flex-1 bg-[var(--theme-border)]"></div>
                    </div>

                    {/* Loaders */}
                    {isLoading ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="flex flex-col gap-4">
                                    <Skeleton height="180px" rounded="lg" animate="shimmer" />
                                    <Skeleton height="24px" width="70%" />
                                    <Skeleton height="60px" />
                                    <Skeleton height="40px" rounded="lg" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {/* Grid */}
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredTournaments.map((t) => (
                                    <TournamentCard key={t.id} tournament={t} />
                                ))}
                            </div>

                            {filteredTournaments.length === 0 && (
                                <div className="py-32 text-center bg-[var(--theme-card)] rounded-3xl border border-dashed border-[var(--theme-border)]">
                                    <div className="w-20 h-20 rounded-full bg-[var(--theme-bg-alt)] flex items-center justify-center mx-auto mb-6">
                                        <FiSearch className="w-8 h-8 text-[var(--theme-text-muted)]" />
                                    </div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight text-[var(--theme-text)] mb-3">ZERO MATCHES FOUND</h3>
                                    <p className="text-[var(--theme-text-muted)] text-sm max-w-sm mx-auto tracking-wide uppercase font-bold">
                                        No tournaments match these filters. Try expanding your search.
                                    </p>
                                    <button 
                                        onClick={handleResetFilters}
                                        className="mt-8 text-[var(--theme-primary)] font-black text-xs uppercase tracking-widest hover:underline underline-offset-4"
                                    >
                                        RESET FILTERS →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}








