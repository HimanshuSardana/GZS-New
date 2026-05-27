import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/useAuth';
import communityService from '@/services/features/communityService';
import gamesService from '@/services/features/gamesService';
import tournamentService from '@/services/features/tournamentService';

// ── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(dateStr) {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function StatSkeleton() {
    return <div className="h-6 w-16 bg-[var(--theme-border)] rounded animate-pulse mx-auto" />;
}

// ── Sub-block A: Chat Preview ─────────────────────────────────────────────────

function ChatPreview({ gameSlug, community }) {
    const { user } = useAuth();

    const { data: messages = [], isLoading } = useQuery({
        queryKey: ['game-chat-preview', gameSlug],
        queryFn: () => communityService.getGameChatPreview(gameSlug, 5),
        refetchInterval: 30_000,
        enabled: !!gameSlug,
    });

    const branchSlug = community?.community_branch_slug;

    return (
        <div className="lg:col-span-2 gp-card min-h-[500px] flex flex-col justify-between gp-animate-in relative overflow-hidden">
            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-12 border-b border-[var(--theme-border)] pb-8">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--gp-primary)] flex items-center justify-center border-2 border-white shadow-xl">
                            <div className="w-3 h-3 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]" />
                        </div>
                        <div>
                            <h3 className="text-[26px] font-heading tracking-tight text-[var(--theme-text)] uppercase leading-none mb-2">
                                LIVE CHATROOM
                            </h3>
                            <div className="flex items-center gap-3">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--gp-primary)] opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--gp-primary)]" />
                                </span>
                                <p className="text-[10px] font-black text-[var(--gp-primary)] uppercase tracking-widest mt-0.5">
                                    COMMUNITY CHAT
                                </p>
                            </div>
                        </div>
                    </div>
                    {branchSlug && (
                        <a
                            href={`/community/${branchSlug}`}
                            className="text-[10px] font-black uppercase tracking-widest text-[var(--gp-primary)] border border-[var(--gp-primary)] px-4 py-2 rounded-xl hover:bg-[var(--gp-primary)] hover:text-white transition-all"
                        >
                            JOIN DISCUSSION →
                        </a>
                    )}
                </div>

                {/* Messages */}
                <div className="relative">
                    <div
                        className="space-y-6 max-h-[340px] overflow-y-auto pr-4 scrollbar-hide transition-all"
                        style={!user ? { filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none' } : {}}
                    >
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="p-6 rounded-2xl bg-[var(--theme-bg-section)] border border-[var(--theme-border)] animate-pulse">
                                    <div className="h-3 w-24 bg-[var(--theme-border)] rounded mb-3" />
                                    <div className="h-4 w-full bg-[var(--theme-border)] rounded" />
                                </div>
                            ))
                        ) : messages.length > 0 ? (
                            messages.map((msg, i) => (
                                <div
                                    key={msg.id ?? i}
                                    className="p-6 rounded-2xl border-l-4 bg-[var(--theme-bg-section)] border-[var(--gp-primary)] shadow-sm hover:translate-x-2 transition-all"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-black uppercase tracking-widest text-[11px] text-[var(--gp-primary)]">
                                            @{msg.sub_profile_username || msg.username}
                                        </span>
                                        <span className="text-[9px] font-bold text-[var(--theme-text-subtle)] opacity-50 uppercase">
                                            {relativeTime(msg.created_at)}
                                        </span>
                                    </div>
                                    <p className="gzs-body text-[14px] leading-relaxed text-[var(--theme-text)] font-medium">
                                        {msg.text}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-[var(--theme-text-muted)] text-[13px] font-medium py-12">
                                No messages yet. Be the first to post!
                            </p>
                        )}
                    </div>

                    {/* Auth blur gate overlay */}
                    {!user && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                            <p className="text-[13px] font-black uppercase tracking-widest text-[var(--theme-text)]">
                                Sign in to read the chat
                            </p>
                            <a
                                href="/login"
                                className="gp-btn-primary !px-8 !py-3 !text-xs"
                            >
                                SIGN IN
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Input / CTA */}
            <div className="mt-12">
                {user && branchSlug ? (
                    <div className="flex gap-4 bg-[var(--theme-bg-section)] p-2 rounded-3xl border border-[var(--theme-border)] focus-within:border-[var(--gp-primary)] transition-all">
                        <input
                            type="text"
                            placeholder="SEND A MESSAGE TO THE HUB..."
                            className="flex-1 bg-transparent border-none px-6 py-4 text-xs font-bold uppercase tracking-widest outline-none text-[var(--theme-text)] placeholder:text-[var(--theme-text-subtle)]"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && branchSlug) {
                                    window.location.href = `/community/${branchSlug}`;
                                }
                            }}
                        />
                        <a
                            href={`/community/${branchSlug}`}
                            className="gp-btn-primary !px-10 !h-14 !rounded-2xl flex items-center"
                        >
                            GO TO HUB
                        </a>
                    </div>
                ) : !user ? (
                    <div className="text-center">
                        <a href="/login" className="gp-btn-primary !px-10 !py-4">
                            SIGN IN TO CHAT
                        </a>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

// ── Sub-block B: Tournament Widget ────────────────────────────────────────────

function TournamentWidget({ gameSlug }) {
    const { data, isLoading } = useQuery({
        queryKey: ['tournaments', 'game', gameSlug],
        queryFn: () => tournamentService.getTournaments({ game_slug: gameSlug, status: 'active,upcoming', limit: 1 }),
        enabled: !!gameSlug,
        staleTime: 60_000,
    });

    const tournament = Array.isArray(data) ? data[0] : data?.tournaments?.[0] ?? data?.data?.[0];

    if (isLoading) {
        return (
            <div className="gp-card bg-[var(--theme-bg-section)] border-[var(--theme-border)] p-8 animate-pulse">
                <div className="h-3 w-32 bg-[var(--theme-border)] rounded mb-4" />
                <div className="h-5 w-48 bg-[var(--theme-border)] rounded mb-6" />
                <div className="h-8 w-28 bg-[var(--theme-border)] rounded" />
            </div>
        );
    }

    if (!tournament) return null;

    const statusLabel = tournament.status === 'active' ? 'Live' : 'Upcoming';
    const statusColor = tournament.status === 'active' ? '#22C55E' : 'var(--gp-primary)';

    return (
        <div className="gp-card bg-[var(--theme-bg-section)] border border-[var(--gp-primary)] p-8">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--gp-primary)' }}>
                        ACTIVE TOURNAMENT
                    </span>
                    <h4 className="text-[16px] font-black text-[var(--theme-text)] uppercase leading-tight mt-1">
                        {tournament.name || tournament.title}
                    </h4>
                </div>
                <span
                    className="text-[10px] font-black px-3 py-1 rounded-full text-white"
                    style={{ background: statusColor }}
                >
                    {statusLabel}
                </span>
            </div>

            <div className="flex flex-wrap gap-4 text-[12px] text-[var(--theme-text-muted)] mb-6">
                {tournament.start_date && (
                    <span>Starts {new Date(tournament.start_date).toLocaleDateString()}</span>
                )}
                {tournament.prize_pool && <span>Prize: {tournament.prize_pool}</span>}
                {tournament.max_participants && (
                    <span>{tournament.registered_count ?? 0}/{tournament.max_participants} teams</span>
                )}
            </div>

            <a
                href={`/tournaments/${tournament.slug ?? tournament.id}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest text-white transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--gp-primary)' }}
            >
                REGISTER NOW →
            </a>
        </div>
    );
}

// ── Sub-block C: Stats Bar ────────────────────────────────────────────────────

function StatsBar({ gameSlug }) {
    const { data, isLoading } = useQuery({
        queryKey: ['game-stats', gameSlug],
        queryFn: () => communityService.getGameStats(gameSlug),
        enabled: !!gameSlug,
        staleTime: 60_000,
    });

    const stats = [
        { label: 'Members with this game', value: data?.members_with_game },
        { label: 'Active discussions',      value: data?.active_discussions },
        { label: 'Posts this week',         value: data?.posts_this_week },
    ];

    return (
        <div className="flex border-t border-b border-[var(--theme-border)] my-6">
            {stats.map((stat, i) => (
                <div
                    key={i}
                    className="flex-1 py-5 px-4 text-center"
                    style={{ borderLeft: i > 0 ? '1px solid var(--theme-border)' : 'none' }}
                >
                    <div className="text-[22px] font-black text-[var(--theme-text)] font-heading leading-none mb-1">
                        {isLoading || stat.value == null ? <StatSkeleton /> : stat.value.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-[var(--theme-text-muted)] uppercase tracking-wider">
                        {stat.label}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Sub-block D: Inline Review Widget ─────────────────────────────────────────

const STAR_COUNT = 5;

function StarPicker({ value, onChange }) {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex gap-2">
            {Array.from({ length: STAR_COUNT }).map((_, i) => {
                const filled = i < (hover || value);
                return (
                    <button
                        key={i}
                        type="button"
                        onClick={() => onChange(i + 1)}
                        onMouseEnter={() => setHover(i + 1)}
                        onMouseLeave={() => setHover(0)}
                        className="text-[28px] leading-none transition-transform hover:scale-110 focus:outline-none"
                        style={{ color: filled ? 'var(--gp-primary)' : 'var(--theme-border)' }}
                        aria-label={`Rate ${i + 1} star${i !== 0 ? 's' : ''}`}
                    >
                        ★
                    </button>
                );
            })}
        </div>
    );
}

function ReviewWidget({ gameSlug }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [rating, setRating] = useState(0);
    const [text, setText] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const mutation = useMutation({
        mutationFn: (data) => gamesService.submitUserReview(gameSlug, data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['user-reviews', gameSlug] });
            setSubmitted(true);
            const pending = res?.status === 'pending' || res?.status === 'flagged';
            showToast(
                pending
                    ? 'Review submitted — pending moderation.'
                    : 'Review posted successfully!',
                pending ? 'info' : 'success'
            );
        },
        onError: (err) => {
            const msg = err?.response?.data?.error || 'Failed to submit review.';
            showToast(msg, 'error');
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!rating) { showToast('Please select a star rating.', 'error'); return; }
        if (text.trim().length < 10) { showToast('Review must be at least 10 characters.', 'error'); return; }
        mutation.mutate({ rating, text: text.trim() });
    };

    if (!user) {
        return (
            <div className="gp-card bg-[var(--gp-primary)] border-transparent text-white p-10 flex flex-col items-center justify-center gap-6 text-center">
                <h3 className="text-[22px] font-heading uppercase leading-tight">SHARE YOUR REVIEW</h3>
                <p className="text-[13px] opacity-80">Sign in to rate and review this game.</p>
                <a href="/login" className="bg-white text-[var(--gp-primary)] px-8 py-3 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all">
                    SIGN IN
                </a>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="gp-card bg-[var(--gp-primary)] border-transparent text-white p-10 flex flex-col items-center justify-center gap-4 text-center">
                <div className="text-[48px]">★</div>
                <h3 className="text-[22px] font-heading uppercase">REVIEW SUBMITTED</h3>
                <p className="text-[13px] opacity-80">Thanks! Your review is pending moderation.</p>
                <button
                    onClick={() => { setSubmitted(false); setRating(0); setText(''); }}
                    className="mt-2 text-[11px] font-black uppercase tracking-widest underline opacity-70 hover:opacity-100"
                >
                    Edit Review
                </button>
            </div>
        );
    }

    return (
        <div className="gp-card bg-[var(--gp-primary)] border-transparent text-white flex flex-col justify-between relative overflow-hidden" style={{ animationDelay: '150ms' }}>
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-white/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10">
                <h3 className="text-[26px] font-heading tracking-tight mb-10 border-b border-white/20 pb-8 text-white uppercase leading-none">
                    SHARE YOUR<br />REVIEW
                </h3>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block mb-3">
                            YOUR RATING
                        </span>
                        <StarPicker value={rating} onChange={setRating} />
                        {rating > 0 && (
                            <span className="text-[12px] font-bold opacity-70 mt-2 block">
                                {rating} / {STAR_COUNT}
                            </span>
                        )}
                    </div>

                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="DESCRIBE YOUR EXPERIENCE..."
                        maxLength={300}
                        rows={4}
                        className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-[13px] font-medium outline-none resize-none placeholder:text-white/40 focus:bg-white/20 transition-all text-white"
                    />

                    <div className="flex justify-between items-center">
                        <span className="text-[10px] opacity-50">{text.length}/300</span>
                        {toast && (
                            <span className={`text-[11px] font-bold ${toast.type === 'error' ? 'text-red-200' : 'text-green-200'}`}>
                                {toast.msg}
                            </span>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="w-full bg-white text-[var(--gp-primary)] text-[13px] font-black uppercase tracking-widest py-5 rounded-2xl hover:bg-gray-50 transition-all shadow-xl hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {mutation.isPending ? 'POSTING...' : 'POST TO HUB'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function CommunitySection({ community, gameSlug }) {
    if (!community) return null;

    return (
        <section className="gp-content-section">
            <div className="mb-20 gp-animate-in">
                <span className="gp-section-label">THE HUB</span>
                <h2 className="gp-section-heading">COMMUNITY HUB</h2>
            </div>

            {/* Stats bar */}
            <StatsBar gameSlug={gameSlug} />

            {/* Main grid: chat + review */}
            <div className="grid lg:grid-cols-3 gap-12 mt-8">
                <ChatPreview gameSlug={gameSlug} community={community} />

                <div className="flex flex-col gap-10 lg:col-span-1">
                    <ReviewWidget gameSlug={gameSlug} />
                    <TournamentWidget gameSlug={gameSlug} />
                </div>
            </div>
        </section>
    );
}
