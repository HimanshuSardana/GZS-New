import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
    FiArrowUpRight, FiUsers, FiMapPin, FiCalendar, FiAward,
    FiInfo, FiLayers, FiShield, FiExternalLink, FiClock, FiGitBranch,
    FiCheckCircle, FiShare2, FiTrendingUp, FiZap, FiActivity, FiGlobe, FiTerminal, FiAlertCircle, FiStar, FiLock
} from 'react-icons/fi';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import { images } from '@/shared/data/images';
import { useTournament, useTournamentBracket, useTournamentRegistrations } from '@/services/mutators/useTournaments';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { adaptTournamentRecord } from '@/shared/adapters/contentAdapters';

const FALLBACK_METADATA = {
    badges: ['SOLO/TEAM', 'GZONE VERIFIED', 'LIVE FEED'],
    recentRegistrations: [
        { name:'AlphaSquad',   type:'Team', time:'2h ago'  },
        { name:'NightOwl_Pro', type:'Solo', time:'4h ago'  },
        { name:'ByteForce',    type:'Team', time:'6h ago'  },
        { name:'Recon_X',      type:'Solo', time:'8h ago'  },
        { name:'ViperElite',   type:'Team', time:'10h ago' },
    ],
    organizer: {
        name: 'GzoneSphere Official',
        contact: 'tournaments@gzonesphere.com',
        discord: 'discord.gg/gzonesphere'
    },
    prizeDistribution: [
        { place: '1st Place', tier: 'Champion', amount: '₹10,000' },
        { place: '2nd Place', tier: 'Runner Up', amount: '₹5,000' },
        { place: '3rd Place', tier: 'Third Place', amount: '₹2,500' }
    ],
    schedule: [
        { phase: 'Registration', date: 'Closed on Dec 12', status: 'Completed' },
        { phase: 'Brackets Reveal', date: 'Dec 14, 10:00 AM', status: 'Upcoming' },
        { phase: 'Main Event', date: 'Dec 15 - Dec 18', status: 'Upcoming' },
        { phase: 'Grand Finals', date: 'Dec 20, 18:00 PM', status: 'Upcoming' },
    ],
    sponsors: [
        { name: 'CoreSphere', logo: 'https://via.placeholder.com/150x80?text=CoreSphere' },
        { name: 'Delta Logic', logo: 'https://via.placeholder.com/150x80?text=DeltaLogic' },
        { name: 'ViperX', logo: 'https://via.placeholder.com/150x80?text=ViperX' },
    ]
};

const BRACKET_DATA = {
    rounds: [
        {
            title: 'QUARTER_FINALS',
            matches: [
                { id: 'QF1', t1: 'ALPHA_SQUAD', t2: 'BETA_KNIGHTS', s1: 2, s2: 1, status: 'completed' },
                { id: 'QF2', t1: 'DELTA_FORCE', t2: 'GAMMA_RAY', s1: 0, s2: 2, status: 'completed' },
                { id: 'QF3', t1: 'EPSILON_PRO', t2: 'ZETA_GZONE', s1: 2, s2: 0, status: 'live' },
                { id: 'QF4', t1: 'THETA_ELITE', t2: 'SIGMA_PLAY', s1: null, s2: null, status: 'upcoming' },
            ],
        },
        {
            title: 'SEMI_FINALS',
            matches: [
                { id: 'SF1', t1: 'ALPHA_SQUAD', t2: 'GAMMA_RAY', s1: null, s2: null, status: 'upcoming' },
                { id: 'SF2', t1: 'EPSILON_PRO', t2: 'TBD', s1: null, s2: null, status: 'upcoming' },
            ],
        },
        {
            title: 'GRAND_FINALS',
            matches: [
                { id: 'GF1', t1: 'TBD', t2: 'TBD', s1: null, s2: null, status: 'upcoming' },
            ],
        },
    ],
};

const Countdown = ({ targetDate }) => {
    const calculate = React.useCallback(() => {
        const now = new Date();
        const target = new Date(targetDate);
        const diff = target - now;
        if (diff <= 0) return '0d 0h 0m 0s';
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / 1000 / 60) % 60);
        const s = Math.floor((diff / 1000) % 60);
        return `${d}d ${h}h ${m}m ${s}s`;
    }, [targetDate]);

    const [timeLeft, setTimeLeft] = useState(() => calculate());
    useEffect(() => {
        const timer = setInterval(() => setTimeLeft(calculate()), 1000);
        return () => clearInterval(timer);
    }, [calculate]);
    return <span className="font-black text-[var(--theme-primary)]">{timeLeft}</span>;
};

export default function TournamentDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('OVERVIEW');
    const [flashedMatches, setFlashedMatches] = useState(new Set());
    const prevBracketRef = React.useRef(null);
    usePageTheme('tournaments-page');

    const { data: apiTournament, isLoading } = useTournament(slug);
    const { data: liveBracketData, refetch: refetchBracket } = useTournamentBracket(slug);

    const tournament = useMemo(() => {
        if (!apiTournament) return null;
        return {
            ...FALLBACK_METADATA,
            ...adaptTournamentRecord(apiTournament),
            heroImage: apiTournament.banner_url || apiTournament.heroImage || images.tournamentHero,
            highlights: apiTournament.highlights || [
                { label: "Top Competitors", desc: "Showcase your skills against the best players in the domain." },
                { label: "Fair Competition", desc: "Anti-cheat and verified seeding for a balanced experience." },
                { label: "Real Prizes", desc: "Get rewarded with cash and exclusive digital assets." }
            ],
            notes: apiTournament.notes || "Participants must be 18+ and have a verified GzoneSphere profile. Any form of spectral manipulation or external scripting will result in an immediate domain ban. Appeal process is available through the Mission Control Discord hub.",
            registeredCount: apiTournament.registered_count || 24,
            maxSlots: apiTournament.slots || 32,
            recentPlayers: [
                { name: "Operator_Alpha", avatar: "https://i.pravatar.cc/100?u=1" },
                { name: "User_Sigma", avatar: "https://i.pravatar.cc/100?u=2" },
                { name: "Delta_Nine", avatar: "https://i.pravatar.cc/100?u=3" },
                { name: "Zeta_Flux", avatar: "https://i.pravatar.cc/100?u=4" },
                { name: "Ether_01", avatar: "https://i.pravatar.cc/100?u=5" },
            ],
            extendedPrizes: [
                { placement: '1st Place', prize: apiTournament.prize || '₹10,000', reward: 'CHAMPION_BADGE + 500 XP' },
                { placement: '2nd Place', prize: '₹5,000', reward: 'ELITE_BADGE + 300 XP' },
                { placement: '3rd Place', prize: '₹2,500', reward: 'STABLE_BADGE + 150 XP' },
                { placement: 'Top 10', prize: '₹500', reward: 'DOMAIN_XP' },
                { placement: 'Participants', prize: '₹0', reward: 'DOMAIN_BADGE' },
            ],
            timeline: [
                { stage: 'Registration Opens', time: 'Jan 01, 10:00', status: 'Done' },
                { stage: 'Registration Closes', time: apiTournament.date || 'Jan 10, 18:00', status: 'Done' },
                { stage: 'Bracket Announcement', time: 'Jan 11, 12:00', status: 'Done' },
                { stage: 'Check-in Window', time: 'Feb 12, 09:00', status: 'Live' },
                { stage: 'Tournament Start', time: 'Feb 12, 14:00', status: 'Upcoming' },
                { stage: 'Finals', time: 'Feb 15, 20:00', status: 'Upcoming' },
                { stage: 'Results Announced', time: 'Feb 16, 12:00', status: 'Upcoming' },
            ],
            entryExpiry: '2026-12-30T18:00:00Z',
            winner: { name: 'Operator_Zero_One', avatar: 'https://i.pravatar.cc/150?u=winner', prize: '₹50,000' }
        };
    }, [apiTournament]);

    if (isLoading) return <DetailSkeleton />;
    if (!tournament) return <TournamentNotFound />;

    const status = tournament.status?.toLowerCase() || 'registration_open';

    const isRegClosed = status === 'registration_closed' || (
        status !== 'live' && status !== 'completed' &&
        tournament.registration_closes &&
        new Date(tournament.registration_closes) < new Date() &&
        tournament.start_date && new Date(tournament.start_date) > new Date()
    );

    // Participant list for reg-closed sidebar
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: participantList = [] } = useTournamentRegistrations(isRegClosed ? (tournament.id || slug) : null);

    // Polling for live bracket
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        if (status !== 'live') return;
        const interval = setInterval(() => {
            refetchBracket().then(({ data: fresh }) => {
                if (!fresh || !prevBracketRef.current) { prevBracketRef.current = fresh; return; }
                const prev = prevBracketRef.current;
                const changed = new Set();
                const prevMatches = prev?.brackets?.matches || prev?.rounds?.flatMap(r => r.matches) || [];
                const freshMatches = fresh?.brackets?.matches || fresh?.rounds?.flatMap(r => r.matches) || [];
                freshMatches.forEach((m, i) => {
                    const p = prevMatches[i];
                    if (!p || JSON.stringify(m) !== JSON.stringify(p)) changed.add(m.id || i);
                });
                if (changed.size > 0) {
                    setFlashedMatches(changed);
                    setTimeout(() => setFlashedMatches(new Set()), 1000);
                }
                prevBracketRef.current = fresh;
            });
        }, 15000);
        return () => clearInterval(interval);
    }, [status, refetchBracket]);

    // Default to BRACKET tab when reg is closed
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        if (isRegClosed) setActiveTab('BRACKET');
    }, [isRegClosed]);

    return (
        <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] font-body selection:bg-[var(--theme-primary)]/30 theme-tournaments pb-32">
            <Helmet>
                <title>{`${tournament.name} | GzoneSphere Tournaments`}</title>
            </Helmet>

            {/* Cinematic Hero: Mission Objective */}
            {/* Cinematic Hero: Mission Objective */}
            <section className="relative min-h-[60vh] md:min-h-[75vh] flex items-center overflow-hidden pt-20 md:pt-32">
                <motion.div
                    initial={{ opacity: 0, scale: 1.2 }}
                    animate={{ opacity: 0.3, scale: 1 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="absolute inset-0 bg-cover bg-center grayscale"
                    style={{ backgroundImage: `url(${tournament.heroImage})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--theme-bg)] via-[var(--theme-bg)]/80 to-transparent" />
                <div className="relative z-10 container mx-auto px-6 md:px-8 lg:px-12">
                    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-6xl space-y-8 md:space-y-12">
                        <div className="flex flex-wrap items-center gap-4 md:gap-6">
                             <div className={`flex items-center gap-3 md:gap-4 px-4 md:px-6 py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider italic shadow-2xl border border-white/20 ${status === 'live' ? 'bg-red-600' : 'bg-[var(--theme-primary)]'}`}>
                                <div className="w-2 h-2 bg-[var(--theme-card)] rounded-full animate-pulse shadow-[0_0_10px_white]" />
                                {status.toUpperCase()}
                            </div>
                            {tournament.badges.map((b, i) => (
                                <span key={i} className="text-[10px] md:text-xs font-black uppercase tracking-wide text-[var(--theme-text-muted)] bg-[var(--theme-card)]/40 border border-[var(--theme-border)] px-4 md:px-6 py-2 rounded-full backdrop-blur-3xl italic">
                                    {b}
                                </span>
                            ))}
                        </div>
                        <h1 className="text-5xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter text-[var(--theme-text)] leading-[0.9] md:leading-[0.8] italic">
                           {tournament.name}
                        </h1>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-12 pt-4 md:pt-8">
                            <HeroStat icon={<FiAward />} label="ASSET_POOL" value={tournament.prize} color="text-[var(--theme-primary)]" />
                            <HeroStat icon={<FiCalendar />} label="DOMAIN_START" value={tournament.date} color="text-[var(--status-success)]" />
                            <HeroStat icon={<FiTerminal />} label="SYNC_MODE" value={tournament.type || 'PROTOCOL_ALPHA'} color="text-[var(--theme-primary)]" />
                        </div>

                        <div className="flex flex-wrap gap-4 pt-2">
                            {status === 'registration_open' && !isRegClosed && (
                                <button onClick={() => navigate(`/tournaments/${slug}/register`)} className="flex items-center gap-2 px-8 py-4 rounded-full bg-[var(--theme-primary)] text-white text-[10px] md:text-xs font-black uppercase tracking-wider hover:brightness-110 transition-all shadow-lg shadow-[var(--theme-primary)]/30 w-full sm:w-auto justify-center">
                                    Register Now <FiArrowUpRight size={14} />
                                </button>
                            )}
                            {isRegClosed && (
                                <Link to={`/tournaments/${slug}/brackets`} className="flex items-center gap-2 px-8 py-4 rounded-full bg-[var(--theme-card)] border-2 border-[var(--theme-border)] text-[var(--theme-text)] text-[10px] md:text-xs font-black uppercase tracking-wider hover:border-[var(--theme-primary)] transition-all w-full sm:w-auto justify-center">
                                    View Bracket <FiArrowUpRight size={14} />
                                </Link>
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* STATUS-BASED CONTENT (Part B) */}
            <section className="container mx-auto px-6 md:px-12 -mt-20 md:-mt-32 relative z-[20] space-y-8 mb-20">
                {/* 1. COMPLETED STATE */}
                {status === 'completed' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        {/* Completion Banner */}
                        <div className="bg-[var(--status-success)] text-white px-8 py-4 rounded-2xl flex items-center gap-4 shadow-2xl font-black uppercase tracking-widest italic text-xs">
                            <FiCheckCircle size={20} /> Tournament Completed // Archive Synchronized
                        </div>
                        
                        {/* Winner Highlight Card */}
                        <div className="bg-gradient-to-r from-amber-400 to-amber-600 rounded-[3rem] p-8 md:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-12 shadow-[0_20px_50px_rgba(245,158,11,0.3)] border-4 border-white/20">
                             <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 text-center md:text-left">
                                <div className="w-32 h-32 bg-[var(--theme-card)]/20 backdrop-blur-xl rounded-[2rem] flex items-center justify-center text-7xl text-white shadow-inner relative overflow-hidden">
                                    <FiAward className="relative z-10" />
                                    <div className="absolute inset-0 bg-[var(--theme-card)]/10 animate-pulse" />
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white/60 italic leading-none flex items-center gap-2">
                                        <FiStar /> DOMAIN_CHAMPION_VALDIATED
                                    </p>
                                    <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white italic leading-none">{tournament.winner.name}</h2>
                                </div>
                             </div>
                             <div className="text-center lg:text-right space-y-2">
                                 <p className="text-[10px] md:text-xs font-black uppercase tracking-wider text-white/60 italic">TOTAL_BOUNTY_CLAIMED</p>
                                 <p className="text-6xl md:text-8xl font-black text-white italic tracking-tighter leading-none">{tournament.winner.prize}</p>
                             </div>
                        </div>

                        {/* Final Standings Table (Top 3) */}
                        <div className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-[3rem] overflow-hidden shadow-xl">
                            <div className="px-10 py-6 border-b border-[var(--theme-border)] bg-[var(--theme-bg-alt)]/50 flex justify-between items-center">
                                <h3 className="text-sm font-black uppercase tracking-widest italic opacity-60">Final Standings // Podium_Sync</h3>
                                <button onClick={() => setActiveTab('RESULTS')} className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-primary)] hover:underline">View Full Standings →</button>
                            </div>
                            <div className="divide-y divide-[var(--theme-border)]/50">
                                {tournament.extendedPrizes.slice(0, 3).map((p, i) => (
                                    <div key={i} className="px-10 py-6 flex items-center justify-between group hover:bg-[var(--theme-primary)]/5 transition-colors">
                                        <div className="flex items-center gap-6">
                                            <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black italic ${i === 0 ? 'bg-amber-400 text-black' : i === 1 ? 'bg-slate-300 text-black' : 'bg-amber-700 text-white'}`}>#{i+1}</span>
                                            <span className="text-xl font-black uppercase tracking-tight italic">{i === 0 ? tournament.winner.name : `Runner_Up_0${i}`}</span>
                                        </div>
                                        <span className="text-xl font-black text-[var(--theme-primary)] italic">{p.prize}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 2. LIVE STATE */}
                {status === 'live' && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                        <div className="bg-red-600 text-white px-8 py-6 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_20px_50px_rgba(220,38,38,0.3)] relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="w-4 h-4 bg-[var(--theme-card)] rounded-full animate-ping" />
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 italic leading-none mb-1">Status: Operational</p>
                                    <h3 className="text-4xl font-black uppercase tracking-tighter italic leading-none">🔴 TOURNAMENT_LIVE</h3>
                                </div>
                            </div>
                            <button onClick={() => setActiveTab('BRACKET')} className="px-10 py-4 bg-[var(--theme-card)] text-red-600 rounded-full font-black uppercase tracking-widest text-xs italic hover:scale-105 transition-all relative z-10 shadow-xl">Watch Live Brackets</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Placeholder Live Matches */}
                            {BRACKET_DATA.rounds[0].matches.slice(0, 3).map(match => (
                                <div key={match.id} className="bg-[var(--theme-card)] border-2 border-red-500/20 rounded-[2rem] p-6 space-y-4 hover:border-red-500/50 transition-all">
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest opacity-40">
                                        <span>Match {match.id}</span>
                                        <span className="text-red-500 animate-pulse">Live</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-black italic">{match.t1}</span>
                                            <span className="text-lg font-black text-red-500">{match.s1 ?? 0}</span>
                                        </div>
                                        <div className="h-px bg-[var(--theme-border)]/50" />
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-black italic">{match.t2}</span>
                                            <span className="text-lg font-black text-red-500">{match.s2 ?? 0}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* 3. REGISTRATION CLOSED STATE */}
                {isRegClosed && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="bg-[var(--theme-card)] border-2 border-amber-500/30 rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-2xl text-amber-500 opacity-80"><FiLock /></div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black uppercase tracking-tighter italic text-amber-400">Registration is Closed</h3>
                                    <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-60">
                                        {tournament.bracket_announcement
                                            ? `Bracket announced ${new Date(tournament.bracket_announcement).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                            : 'Brackets will be announced soon'}
                                        {tournament.start_date
                                            ? ` · Tournament starts ${new Date(tournament.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                                            : ''}
                                    </p>
                                </div>
                            </div>
                            <Link
                                to={`/tournaments/${slug}/brackets`}
                                className="px-8 py-3 bg-[var(--theme-primary)] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all shrink-0"
                            >
                                View Bracket →
                            </Link>
                        </div>
                    </motion.div>
                )}
            </section>

            {/* BLOCK 1: About the Tournament */}
            <section className="container mx-auto px-6 md:px-12 page-section">
                <div className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-12 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--theme-primary)]/5 blur-[80px] rounded-full" />
                    <div className="relative z-10 flex flex-col lg:flex-row gap-12 lg:gap-20">
                        <div className="flex-1 space-y-8 md:space-y-10">
                            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic flex items-center gap-4">
                                <FiInfo className="text-[var(--theme-primary)]" /> ABOUT_THE_ENGAGEMENT
                            </h3>
                            <div className="divide-y divide-[var(--theme-border)]/50">
                                <AboutRow label="Tournament Name" value={tournament.name} />
                                <AboutRow label="Category" value={tournament.type || 'Official Match'} />
                                <AboutRow label="Entry Deadline" value={<Countdown targetDate={tournament.entryExpiry} />} />
                                <AboutRow label="Tournament Format" value="Single Elimination" />
                                <AboutRow label="Domain Registry" value={tournament.game || 'Global Nexus'} />
                            </div>
                        </div>
                        <div className="lg:w-1/3 bg-[var(--theme-bg-alt)] border-2 border-[var(--theme-border)] rounded-3xl p-8 md:p-10 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] rounded-full flex items-center justify-center text-2xl md:text-3xl">
                                <FiClock />
                            </div>
                            <h4 className="text-base md:text-lg font-black uppercase tracking-widest italic leading-none">MISSION_EXPIRY</h4>
                            <div className="text-3xl md:text-4xl font-black italic tracking-tighter">
                                <Countdown targetDate={tournament.entryExpiry} />
                            </div>
                            <p className="text-[10px] font-black uppercase opacity-40 italic tracking-wide">REMAINING_WINDOW_CYCLES</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Protocol Navigation: Mission Tabs */}
            <nav className="sticky top-16 md:top-20 z-50 bg-[var(--theme-bg)]/90 border-y border-[var(--theme-border)] backdrop-blur-3xl overflow-x-auto scrollbar-none">
                <div className="container mx-auto flex gap-8 md:gap-16 px-6 md:px-12 min-w-max">
                    {[
                        { label: 'Overview', key: 'OVERVIEW' },
                        { label: 'Schedule', key: 'SCHEDULE' },
                        { label: 'Bracket', key: 'BRACKET' },
                        { label: 'Results', key: 'RESULTS' },
                        { label: 'Rules', key: 'RULES' },
                    ].map(({ label, key }) => (
                        <button key={key} onClick={() => setActiveTab(key)}
                            className={`py-6 md:py-8 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all relative shrink-0
                                ${activeTab === key ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'}
                            `}
                        >
                            {label}
                            {activeTab === key && (
                                <motion.span layoutId="tab-indicator-alt" className="absolute bottom-0 left-0 w-full h-1 bg-[var(--theme-primary)] rounded-full shadow-[0_0_15px_var(--theme-primary)]" />
                            )}
                        </button>
                    ))}
                </div>
            </nav>

            <main className="py-12 md:py-24 bg-[var(--theme-bg-alt)]/30">
                <div className="container mx-auto px-6 md:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
                        <div className="space-y-16 md:space-y-24">
                            <AnimatePresence mode="wait">
                                {activeTab === 'OVERVIEW' && (
                                    <motion.div key="overview" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-16 md:space-y-24">
                                        <div className="space-y-8 md:space-y-12">
                                            <div className="flex items-center gap-4 md:gap-6">
                                                <div className="w-12 md:w-16 h-[2px] md:h-[3px] bg-[var(--theme-primary)] rounded-full" />
                                                <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter italic flex items-center gap-4 md:gap-6 text-[var(--theme-text)]">
                                                    <FiTerminal className="text-[var(--theme-primary)]" /> MISSION_PROTOCOL
                                                </h2>
                                            </div>
                                            <p className="text-lg md:text-2xl text-[var(--theme-text-muted)] font-bold leading-relaxed max-w-5xl border-l-2 md:border-l-4 border-dashed border-[var(--theme-border)] pl-6 md:pl-12 italic uppercase tracking-wider opacity-80">
                                                {tournament.description}
                                            </p>
                                        </div>

                                        {/* BLOCK 2: Tournament Highlights */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                                            {tournament.highlights.map((h, i) => (
                                                <div key={i} className="p-8 md:p-10 rounded-[2rem] bg-[var(--theme-card)] border border-[var(--theme-border)] hover:border-[var(--theme-primary)]/30 transition-all group shadow-sm">
                                                    <div className="w-12 h-12 bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] rounded-2xl flex items-center justify-center text-xl mb-6 group-hover:bg-[var(--theme-primary)] group-hover:text-white transition-all">
                                                        <FiZap />
                                                    </div>
                                                    <h4 className="text-lg md:text-xl font-black uppercase tracking-tight italic mb-3">{h.label}</h4>
                                                    <p className="text-[10px] text-[var(--theme-text-muted)] font-bold leading-relaxed opacity-60 uppercase tracking-widest">{h.desc}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
                                            <div className="p-8 md:p-12 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-[2.5rem] md:rounded-[4rem] flex flex-col items-center justify-center space-y-6 md:space-y-8 group hover:border-[var(--theme-primary)] transition-all">
                                                 <FiShield size={40} className="text-[var(--theme-primary)]" />
                                                 <div className="text-center">
                                                     <p className="text-[10px] font-black uppercase tracking-wider opacity-40 italic mb-2">VERIFIED_SOURCE</p>
                                                     <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic">{tournament.organizer.name}</h3>
                                                 </div>
                                                 <a href={`https://${tournament.organizer.discord}`} target="_blank" className="gzs-btn-primary !px-8 !py-3 !text-[10px]">SYNC_HUB</a>
                                            </div>

                                            {/* Important Notes */}
                                            {tournament.notes && (
                                                <div className="bg-[var(--theme-primary)]/5 border border-[var(--theme-primary)]/20 rounded-3xl p-8">
                                                    <p className="text-[10px] font-black uppercase tracking-wider text-[var(--theme-primary)] mb-4">Important Notes</p>
                                                    <p className="text-xs text-[var(--theme-text-muted)] leading-relaxed font-bold italic opacity-80">{tournament.notes}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Match Timing & Rules */}
                                        {(() => {
                                            const mt = (apiTournament?.game_config_json?.match_timing) || {};
                                            const dur = mt.estimated_match_duration || tournament.estimated_match_duration;
                                            const ot  = mt.overtime_rules || tournament.overtime_rules;
                                            const rp  = mt.reschedule_policy || tournament.reschedule_policy;
                                            const ns  = mt.noshow_rule || tournament.noshow_rule;
                                            if (!dur && !ot && !rp && !ns) return null;
                                            return (
                                                <div className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-[2.5rem] p-8 md:p-10">
                                                    <h3 className="text-lg font-black uppercase tracking-tighter italic flex items-center gap-3 mb-6">
                                                        <FiClock className="text-[var(--theme-primary)]" /> Match Timing &amp; Rules
                                                    </h3>
                                                    <dl className="space-y-4">
                                                        {[
                                                            { label: 'Estimated time per match', value: dur || 'TBD' },
                                                            { label: 'Overtime rules', value: ot || 'Standard overtime applies' },
                                                            { label: 'Rescheduling policy', value: rp || 'Contact organisers 24h in advance' },
                                                            { label: 'No-show / forfeit rule', value: ns || 'Forfeit after 15 minutes of no-show' },
                                                        ].map(({ label, value }) => (
                                                            <div key={label} className="flex flex-col sm:flex-row sm:items-start gap-2">
                                                                <dt className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-60 sm:w-48 shrink-0 italic">{label}</dt>
                                                                <dd className="text-sm font-bold text-[var(--theme-text)]">{value}</dd>
                                                            </div>
                                                        ))}
                                                    </dl>
                                                </div>
                                            );
                                        })()}
                                    </motion.div>
                                )}

                                {activeTab === 'SCHEDULE' && (
                                    <motion.div key="schedule" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 md:space-y-16">
                                        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic flex items-center gap-6 md:gap-8"><FiClock className="text-[var(--theme-primary)]" /> TEMPORAL_SEQUENCE</h2>
                                        <div className="relative pl-8 md:pl-12 space-y-8 md:space-y-10 border-l-2 md:border-l-4 border-dashed border-[var(--theme-border)]">
                                            {tournament.timeline.map((step, i) => (
                                                <div key={i} className="relative">
                                                    <div className={`absolute -left-[2.7rem] md:-left-[3.7rem] top-4 w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl border-4 border-[var(--theme-bg)] flex items-center justify-center z-10 ${step.status === 'Done' ? 'bg-[var(--status-success)]' : step.status === 'Live' ? 'bg-red-600' : 'bg-gray-400'}`}>
                                                        {step.status === 'Done' ? <FiCheckCircle className="text-white" size={16} /> : <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                                                    </div>
                                                    <div className="p-6 md:p-10 rounded-2xl md:rounded-3xl bg-[var(--theme-card)] border border-[var(--theme-border)] hover:border-[var(--theme-primary)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-10">
                                                        <div className="space-y-2">
                                                            <p className="text-[10px] font-black uppercase tracking-wider opacity-40 italic">{step.time}</p>
                                                            <h4 className="text-xl md:text-3xl font-black uppercase tracking-tighter italic">{step.stage}</h4>
                                                        </div>
                                                        <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase italic tracking-wider self-start md:self-auto ${step.status === 'Live' ? 'bg-red-600 text-white animate-pulse' : 'bg-[var(--theme-bg-alt)] opacity-60 text-[var(--theme-text)]'}`}>{step.status}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'BRACKET' && (
                                    <motion.div key="bracket" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 md:space-y-10">
                                        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                                            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter flex items-center gap-4">
                                                <FiGitBranch className="text-[var(--theme-primary)]" /> BRACKET_MAP
                                            </h2>
                                            <div className="flex flex-wrap items-center gap-4 text-[9px] font-black uppercase tracking-wider text-[var(--theme-text-muted)]">
                                                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" /> LIVE</span>
                                                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[var(--theme-primary)] inline-block" /> COMPLETED</span>
                                                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gray-500 inline-block" /> UPCOMING</span>
                                                {status === 'live' && (
                                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-[9px] font-black uppercase text-red-400">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" /> LIVE · Updates every 15s
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto rounded-2xl pb-6">
                                            <div className="flex gap-12 md:gap-16 min-w-max px-2 py-4 items-start">
                                                {BRACKET_DATA.rounds.map((round) => (
                                                    <div key={round.title} className="flex flex-col gap-6">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-50 text-center">{round.title.replace(/_/g, ' ')}</p>
                                                        <div className="flex flex-col gap-8">
                                                            {round.matches.map((match) => (
                                                                <BracketMatch key={match.id} match={match} isFlashing={flashedMatches.has(match.id)} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'RESULTS' && (
                                    <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 md:space-y-10">
                                        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter flex items-center gap-4">
                                            <FiAward className="text-[var(--theme-primary)]" /> MISSION_RESULTS
                                        </h2>

                                        {/* Champion Card */}
                                        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10 p-8 md:p-10 rounded-3xl bg-gradient-to-br from-[var(--theme-primary)]/20 to-[var(--theme-bg-alt)] border border-[var(--theme-primary)]/30 shadow-xl">
                                            <div className="w-20 h-20 md:w-24 md:h-24 bg-[var(--theme-primary)]/20 rounded-3xl flex items-center justify-center text-[var(--theme-primary)] shrink-0">
                                                <FiAward size={48} />
                                            </div>
                                            <div className="text-center md:text-left">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--theme-primary)] mb-2">Champion — 1st Place</p>
                                                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-[var(--theme-text)] leading-none">
                                                    {tournament.winner?.name || tournament.extendedPrizes[0]?.placement}
                                                </h2>
                                                <p className="text-xl md:text-2xl font-black text-[var(--theme-primary)] mt-2">{tournament.extendedPrizes[0]?.prize}</p>
                                            </div>
                                        </div>

                                        {/* Full Results Table */}
                                        <div className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-2xl md:rounded-3xl overflow-hidden overflow-x-auto">
                                            <table className="w-full text-left border-collapse min-w-[500px]">
                                                <thead>
                                                    <tr className="bg-[var(--theme-bg-alt)] border-b border-[var(--theme-border)]">
                                                        <th className="px-6 md:px-8 py-5 text-[10px] font-black uppercase tracking-widest opacity-40">Place</th>
                                                        <th className="px-6 md:px-8 py-5 text-[10px] font-black uppercase tracking-widest opacity-40">Prize</th>
                                                        <th className="px-6 md:px-8 py-5 text-[10px] font-black uppercase tracking-widest opacity-40">Reward</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[var(--theme-border)]/50">
                                                    {tournament.extendedPrizes.map((p, i) => (
                                                        <tr key={i} className="hover:bg-[var(--theme-primary)]/5 transition-colors">
                                                            <td className="px-6 md:px-8 py-4 font-black text-base uppercase italic tracking-tight">{p.placement}</td>
                                                            <td className="px-6 md:px-8 py-4 font-black text-lg text-[var(--theme-primary)]">{p.prize}</td>
                                                            <td className="px-6 md:px-8 py-4 text-[10px] font-black uppercase tracking-widest opacity-40">{p.reward}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Sidebar Sector */}
                        <aside style={{ position:'sticky', top:100, display:'flex', flexDirection:'column', gap:12 }}>

                            {isRegClosed ? (
                                /* Participant list when registration is closed */
                                <div style={{ background:'var(--theme-card)', border:'1px solid var(--theme-border)', borderRadius:12, padding:16 }}>
                                    <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--theme-text-muted)', marginBottom:12 }}>
                                        Participants ({participantList.length})
                                    </div>
                                    {participantList.length === 0 ? (
                                        <p style={{ fontSize:11, color:'var(--theme-text-muted)', fontStyle:'italic' }}>Participant list will be published soon.</p>
                                    ) : participantList.slice(0, 10).map((reg, i) => (
                                        <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0', borderBottom:'1px solid var(--theme-border)' }}>
                                            <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--theme-bg-section)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'var(--theme-primary)', flexShrink:0 }}>
                                                {((reg.team_name || reg.player_name || '?')[0]).toUpperCase()}
                                            </div>
                                            <div style={{ flex:1, minWidth:0 }}>
                                                <div style={{ fontSize:12, fontWeight:600, color:'var(--theme-text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{reg.team_name || reg.player_name || `Player #${i + 1}`}</div>
                                                <div style={{ fontSize:10, color:'var(--theme-text-muted)' }}>{reg.status}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {participantList.length > 10 && (
                                        <p style={{ margin:'8px 0 0', fontSize:10, color:'var(--theme-text-muted)' }}>+ {participantList.length - 10} more participants</p>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* Registration Progress Card */}
                                    <div style={{ background:'var(--theme-card)', border:'1px solid var(--theme-border)', borderRadius:12, padding:16 }}>
                                        <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--theme-text-muted)', marginBottom:12 }}>Registration Status</div>

                                        <div style={{ marginBottom:12 }}>
                                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                                                <span style={{ fontSize:13, fontWeight:700, color:'var(--theme-text)' }}>
                                                    {tournament.current_participants || tournament.registeredCount || 0} / {tournament.max_participants || tournament.maxSlots || 'TBD'} spots filled
                                                </span>
                                                <span style={{ fontSize:11, color:'var(--theme-primary)', fontWeight:600 }}>
                                                    {(tournament.max_participants || tournament.maxSlots)
                                                        ? `${Math.round(((tournament.current_participants || tournament.registeredCount || 0) / (tournament.max_participants || tournament.maxSlots)) * 100)}%`
                                                        : ''}
                                                </span>
                                            </div>
                                            {(tournament.max_participants || tournament.maxSlots) && (
                                                <div style={{ height:6, background:'var(--theme-bg-section)', borderRadius:4, overflow:'hidden' }}>
                                                    <div style={{
                                                        height:'100%',
                                                        background:'var(--theme-primary)',
                                                        borderRadius:4,
                                                        width:`${Math.min(100, Math.round(((tournament.current_participants || tournament.registeredCount || 0) / (tournament.max_participants || tournament.maxSlots)) * 100))}%`,
                                                        transition:'width 1s ease'
                                                    }} />
                                                </div>
                                            )}
                                        </div>

                                        {(status === 'registration_open' || status === 'upcoming') && (
                                            <Link to={`/tournaments/${tournament.slug || slug}/register`}
                                                style={{ display:'block', width:'100%', padding:'10px 0', background:'var(--theme-primary)', color:'#fff', borderRadius:8, fontSize:13, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', textDecoration:'none', textAlign:'center' }}>
                                                Register Now
                                            </Link>
                                        )}
                                    </div>

                                    {/* Recent Registrations Card */}
                                    <div style={{ background:'var(--theme-card)', border:'1px solid var(--theme-border)', borderRadius:12, padding:16 }}>
                                        <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--theme-text-muted)', marginBottom:12 }}>Recent Registrations</div>
                                        {(tournament.recentRegistrations || FALLBACK_METADATA.recentRegistrations).slice(0, 5).map((reg, i) => (
                                            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0', borderBottom:'1px solid var(--theme-border)' }}>
                                                <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--theme-bg-section)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'var(--theme-primary)', flexShrink:0 }}>
                                                    {(reg.name || '?')[0].toUpperCase()}
                                                </div>
                                                <div style={{ flex:1, minWidth:0 }}>
                                                    <div style={{ fontSize:12, fontWeight:600, color:'var(--theme-text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{reg.name}</div>
                                                    <div style={{ fontSize:10, color:'var(--theme-text-muted)' }}>{reg.type} · {reg.time}</div>
                                                </div>
                                            </div>
                                        ))}
                                        <p style={{ margin:'10px 0 0', fontSize:10, color:'var(--theme-text-muted)' }}>Full list available after registration closes.</p>
                                    </div>
                                </>
                            )}
                        </aside>
                    </div>
                </div>
            </main>
        </div>
    );
}

function HeroStat({ icon, label, value, color }) {
    return (
        <div className="flex items-center gap-8 bg-[var(--theme-card)]/50 p-6 rounded-full border-2 border-transparent hover:border-[var(--theme-border)] transition-all">
            <div className={`w-16 h-16 rounded-2xl bg-[var(--theme-bg-alt)] flex items-center justify-center ${color} text-3xl border border-[var(--theme-border)] group-hover:scale-110 transition-all shadow-inner`}>{icon}</div>
            <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] mb-1 italic opacity-40 leading-none">{label}</p>
                <p className="text-2xl font-black uppercase tracking-tighter text-[var(--theme-text)] italic leading-none">{value}</p>
            </div>
        </div>
    );
}

const AboutRow = ({ label, value }) => (
    <div className="flex items-center justify-between py-6">
        <span className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-40">{label}</span>
        <span className="text-xl font-black italic tracking-tighter uppercase">{value}</span>
    </div>
);

function DetailSkeleton() {
    return (
        <div className="min-h-screen bg-[var(--theme-bg)] flex flex-col items-center justify-center animate-pulse p-20">
            <div className="w-48 h-48 bg-[var(--theme-bg-alt)] rounded-[4rem] mb-12" />
            <div className="h-16 w-full max-w-4xl bg-[var(--theme-bg-alt)] rounded-2xl mb-8" />
            <div className="h-40 w-full max-w-4xl bg-[var(--theme-bg-alt)] rounded-3xl" />
        </div>
    );
}

function BracketMatch({ match, isFlashing }) {
    const w1 = match.s1 !== null && match.s2 !== null && match.s1 > match.s2;
    const w2 = match.s1 !== null && match.s2 !== null && match.s2 > match.s1;
    const borderCls = isFlashing
        ? 'border-green-400'
        : match.status === 'live' ? 'border-red-500'
        : match.status === 'completed' ? 'border-[var(--theme-primary)]/40'
        : 'border-[var(--theme-border)]';
    return (
        <div className={`w-60 rounded-2xl bg-[var(--theme-card)] border-2 ${borderCls} overflow-hidden shadow-lg relative`}
            style={{ transition: 'border-color 0.3s ease', boxShadow: isFlashing ? '0 0 16px rgba(74,222,128,0.4)' : undefined }}
        >
            {match.status === 'live' && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
            <div className="px-4 py-1.5 border-b border-[var(--theme-border)]/50 flex justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40">{match.id}</span>
                <span className={`text-[9px] font-black uppercase tracking-wider ${match.status === 'live' ? 'text-red-500' : match.status === 'completed' ? 'text-[var(--theme-primary)]' : 'opacity-30'}`}>{match.status}</span>
            </div>
            <div className="p-3 space-y-2">
                <BracketTeam name={match.t1} score={match.s1} isWinner={w1} />
                <p className="text-center text-[9px] font-black uppercase text-[var(--theme-text-muted)] opacity-30 tracking-widest">VS</p>
                <BracketTeam name={match.t2} score={match.s2} isWinner={w2} />
            </div>
        </div>
    );
}

function BracketTeam({ name, score, isWinner }) {
    return (
        <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${isWinner ? 'bg-[var(--theme-primary)]/10 border border-[var(--theme-primary)]/20' : 'bg-[var(--theme-bg-alt)]'}`}>
            <span className={`text-xs font-black uppercase tracking-tight truncate max-w-[130px] ${isWinner ? 'text-[var(--theme-text)]' : 'text-[var(--theme-text-muted)] opacity-60'}`}>{name}</span>
            <span className={`text-sm font-black shrink-0 ml-2 ${isWinner ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-text-muted)] opacity-40'}`}>{score ?? '—'}</span>
        </div>
    );
}

function TournamentNotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--theme-bg)] text-[var(--theme-text)] p-32 text-center space-y-16">
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic">SHARD_MISMATCH</h1>
            <Link to="/tournaments" className="gzs-btn-primary px-12 py-6">BACK_TO_HUB</Link>
        </div>
    );
}








