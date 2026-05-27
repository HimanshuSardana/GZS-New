import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
    FiPlus, FiSearch, FiFilter, FiBriefcase, FiCheckCircle,
    FiEdit3, FiMusic, FiCode, FiX, FiClock, FiGlobe,
    FiZap, FiArrowRight, FiTarget, FiLock, FiSend,
    FiTrash2, FiSliders, FiEdit, FiActivity, FiUsers, FiStar,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { MOCK_LFG_POSTS_RICH } from '@/shared/data/communityData';
import { useLFGPosts } from '@/services/mutators/useCommunity';
import { useToast } from '@/shared/components/Toast';
import core from '@/services/api/core';

// ── Constants ────────────────────────────────────────────────────────────────

const MOCK_ME_ID = 'u3-sync-master-uuid';

const GOAL_COLORS = {
    hiring:     'bg-blue-50 text-blue-700 border-blue-200',
    collab:     'bg-purple-50 text-purple-700 border-purple-200',
    commission: 'bg-orange-50 text-orange-700 border-orange-200',
    coaching:   'bg-green-50 text-green-700 border-green-200',
    feedback:   'bg-teal-50 text-teal-700 border-teal-200',
    partner:    'bg-pink-50 text-pink-700 border-pink-200',
};

const AVAILABILITY_COLORS = {
    'This Weekend': 'bg-yellow-50 text-yellow-700',
    'This Week':    'bg-blue-50 text-blue-700',
    'Ongoing':      'bg-green-50 text-green-700',
};

const GOAL_TYPES_BY_BRANCH = {
    esports:  ['Find ranked teammates', 'Find tournament squad', 'Find scrimmage partner', 'Find coach', 'Offer coaching'],
    dev:      ['Find co-developer', 'Game jam team', 'Startup idea partner', 'Freelance work', 'Hire developer'],
    art:      ['Commission request', 'Collaboration offer', 'Seeking feedback partner'],
    writing:  ['Co-author request', 'Feedback exchange', 'Worldbuilding collaborator'],
    audio:    ['Seeking composer', 'Seeking voice actor', 'Seeking sound designer', 'Offering services'],
    content:  ['Collab partner request', 'Co-stream proposal', 'Seeking video editor', 'Seeking thumbnail designer'],
    business: ['Seeking co-founder', 'Seeking advisor', 'Seeking investor', 'Partnership proposal'],
};
const DEFAULT_GOAL_TYPES = ['Collaboration', 'Hiring', 'Commission', 'Feedback'];

const SKILLS_BY_BRANCH = {
    esports:  ['IGL', 'Entry fragger', 'Sentinel', 'Initiator', 'Controller', 'Duelist', 'Shot calling', 'VOD review'],
    dev:      ['Unity', 'Unreal Engine', 'C++', 'C#', 'Godot', 'Shaders', 'Gameplay programming', 'Level design', 'UI/UX'],
    art:      ['2D illustration', '3D modeling', 'Pixel art', 'Concept art', 'Character design', 'Environment art', 'VFX'],
    writing:  ['Narrative design', 'Worldbuilding', 'Dialogue', 'Lore writing', 'Quest design', 'Screenwriting'],
    audio:    ['Music composition', 'Sound design', 'Voice acting', 'FMOD', 'Wwise', 'Mixing', 'Mastering'],
    content:  ['Video editing', 'Thumbnail design', 'Stream layout', 'Shorts/Reels', 'Commentary', 'Scripting'],
    business: ['Market research', 'Pitching', 'PR', 'Community management', 'Publishing', 'Funding'],
};
const DEFAULT_SKILLS = ['Teamwork', 'Communication', 'Remote collaboration'];

const GAMES_LIST = ['Valorant', 'CS2', 'League of Legends', 'Dota 2', 'Apex Legends', 'Rocket League', 'Other'];
const PLATFORMS = ['PC', 'Console', 'Mobile', 'Cross-platform'];
const TIMEZONES = ['IST', 'UTC', 'EST', 'PST', 'CET', 'AEST'];
const CONTACT_PREFS = [
    { value: 'dm',       label: 'DM on platform' },
    { value: 'comments', label: 'Listed in comments' },
    { value: 'external', label: 'External contact' },
];
const AVAILABILITY_OPTIONS = ['This Weekend', 'This Week', 'Ongoing', 'Specific date'];
const HOURS_OPTIONS = ['<10h', '10-20h', '20-30h', '30-40h', '40h+'];
const SCRIM_TYPES = ['Casual', 'Ranked', 'Tournament Prep'];
const POST_TYPES = [
    { id: 'teammates',    label: 'Looking for teammates',    color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { id: 'collaborators', label: 'Looking for collaborators', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { id: 'offering',    label: 'Offering skills',           color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];

// ── Utilities ────────────────────────────────────────────────────────────────

const NOW = new Date('2026-04-27');

function getDaysUntil(isoDate) {
    return Math.max(0, Math.ceil((new Date(isoDate) - NOW) / 86400000));
}

function timeAgo(isoDate) {
    const days = Math.floor((NOW - new Date(isoDate)) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return '1d ago';
    return `${days}d ago`;
}

// ── Shared form field wrapper ─────────────────────────────────────────────────

function Field({ label, children }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-60 block">
                {label}
            </label>
            {children}
        </div>
    );
}

// ── Goal type pill ────────────────────────────────────────────────────────────

function GoalPill({ typeId }) {
    const type = POST_TYPES.find(t => t.id === typeId) || POST_TYPES[1];
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${type.color}`}>
            {type.label}
        </span>
    );
}

// ── LFG Post Card ─────────────────────────────────────────────────────────────

function LFGPostCard({ post, isOwn, onApply, onExpire }) {
    const [expanded, setExpanded] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const daysLeft  = getDaysUntil(post.expires_at);
    const avColor   = AVAILABILITY_COLORS[post.availability] || 'bg-slate-100 text-slate-600';
    const isExpiring = post.auto_expire && daysLeft <= 7;

    const handleConnect = () => {
        setIsSent(true);
        onApply(post);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--theme-card)]/60 backdrop-blur-xl border-2 border-[var(--theme-border)] rounded-3xl p-8 flex flex-col hover:border-[var(--theme-primary)]/40 transition-all group relative overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-tr from-[var(--theme-primary)]/[0.025] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            {/* Author row */}
            <div className="flex items-start gap-3 mb-5 relative z-10">
                <div className="relative shrink-0">
                    <img
                        src={post.author.avatar_url}
                        alt={post.author.display_name}
                        className="w-11 h-11 rounded-2xl object-cover border-2 border-[var(--theme-border)]"
                    />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--theme-card)] ${
                        post.author.availability_status === 'online' ? 'bg-green-500' :
                        post.author.availability_status === 'away'   ? 'bg-yellow-500' : 'bg-slate-500'
                    }`} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                        <p className="text-sm font-black uppercase tracking-tight italic text-[var(--theme-text)] group-hover:text-[var(--theme-primary)] transition-colors leading-tight">
                            {post.author.display_name}
                        </p>
                        {post.author.verified && <FiCheckCircle className="text-[var(--theme-primary)]" size={12} />}
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--theme-text-muted)] opacity-50">
                        {post.author.primary_role}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <GoalPill typeId={post.lfg_type || (post.goal_category === 'hiring' ? 'offering' : 'collaborators')} />
                    <button 
                        onClick={() => setIsBookmarked(!isBookmarked)}
                        className={`text-sm ${isBookmarked ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-text-muted)] opacity-30 hover:opacity-100'}`}
                    >
                        <FiStar fill={isBookmarked ? 'currentColor' : 'none'} size={14} />
                    </button>
                </div>
            </div>

            {/* Description */}
            <div className="relative z-10 mb-4">
                <p className={`text-sm font-bold italic text-[var(--theme-text-muted)] leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
                    {post.description}
                </p>
                {post.description.length > 180 && (
                    <button
                        onClick={() => setExpanded((e) => !e)}
                        className="text-[10px] font-black uppercase tracking-wider text-[var(--theme-primary)] hover:opacity-70 mt-1"
                    >
                        {expanded ? 'Show less' : 'Read more'}
                    </button>
                )}
            </div>

            {/* Required skills chips */}
            {post.required_skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4 relative z-10">
                    {post.required_skills.map((s) => (
                        <span key={s} className="px-2.5 py-1 rounded-lg bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] text-[10px] font-bold uppercase tracking-wide text-[var(--theme-text-muted)] flex items-center gap-1">
                            {s} {post.author.top_skills.includes(s) && <FiCheckCircle size={10} className="text-[var(--theme-primary)]" />}
                        </span>
                    ))}
                </div>
            )}

            {/* Meta badges */}
            <div className="flex flex-wrap items-center gap-2 mb-5 relative z-10">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${avColor}`}>
                    {post.availability}
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[var(--theme-bg-alt)] text-[var(--theme-text-muted)] border border-[var(--theme-border)]">
                    {post.hours_per_week || '10-20h'} / week
                </span>
                {post.timezone && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[var(--theme-bg-alt)] text-[var(--theme-text-muted)] border border-[var(--theme-border)]">
                        <FiGlobe size={9} /> {post.timezone}
                    </span>
                )}
                {isExpiring && (
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        daysLeft <= 2 ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                    }`}>
                        <FiClock size={9} /> Expires in {daysLeft}d
                    </span>
                )}
            </div>

            {/* Footer */}
            <div className="mt-auto pt-5 border-t-2 border-dashed border-[var(--theme-border)] flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wide text-[var(--theme-text-muted)] italic opacity-40">
                        {timeAgo(post.created_at)}
                    </span>
                </div>

                {isOwn ? (
                    <div className="flex items-center gap-2">
                        <button className="w-8 h-8 flex items-center justify-center rounded-xl bg-[var(--theme-bg-alt)] hover:bg-[var(--theme-primary)]/20 hover:text-[var(--theme-primary)] text-[var(--theme-text-muted)] border border-[var(--theme-border)] transition-all">
                            <FiEdit size={12} />
                        </button>
                        <button
                            onClick={onExpire}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-[var(--theme-bg-alt)] hover:bg-red-500/20 hover:text-red-400 text-[var(--theme-text-muted)] border border-[var(--theme-border)] transition-all"
                        >
                            <FiTrash2 size={12} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleConnect}
                        disabled={isSent}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider italic transition-all active:scale-95 ${
                            isSent 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-[var(--theme-text)] text-[var(--theme-bg)] hover:bg-[var(--theme-primary)] hover:text-white'
                        }`}
                    >
                        {isSent ? <>Request Sent <FiCheckCircle size={12} /></> : <>Connect <FiArrowRight size={12} strokeWidth={3} /></>}
                    </button>
                )}
            </div>
        </motion.div>
    );
}


// ── Apply / Reach Out modal ───────────────────────────────────────────────────

function ApplyModal({ post, onClose, onSend }) {
    const [msg, setMsg] = useState('');
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[var(--theme-bg)]/80 backdrop-blur-xl"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] w-full max-w-lg rounded-3xl relative z-10 p-10 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between mb-7">
                    <div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter italic text-[var(--theme-text)]">Reach Out</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40 mt-1">
                            → @{post.author.display_name}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[var(--theme-bg-alt)] hover:bg-red-500/20 hover:text-red-400 text-[var(--theme-text-muted)] border border-[var(--theme-border)] transition-all"
                    >
                        <FiX size={15} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="bg-[var(--theme-bg-alt)]/60 border border-[var(--theme-border)] rounded-2xl p-4 mb-6">
                    <GoalPill type={post.goal_type} category={post.goal_category} />
                    <p className="text-sm font-bold italic text-[var(--theme-text-muted)] mt-2 line-clamp-2">
                        {post.description}
                    </p>
                </div>

                <textarea
                    rows={4}
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    placeholder="Introduce yourself, share your relevant skills or a portfolio link..."
                    className="w-full px-6 py-4 bg-[var(--theme-bg-alt)] border-2 border-[var(--theme-border)] rounded-2xl text-sm font-bold italic text-[var(--theme-text)] placeholder:opacity-30 outline-none focus:border-[var(--theme-primary)]/60 resize-none mb-6 transition-colors"
                />
                <button
                    onClick={() => { onSend?.(post.id); onClose(); }}
                    className="w-full py-4 bg-[var(--theme-text)] text-[var(--theme-bg)] hover:bg-[var(--theme-primary)] hover:text-white rounded-2xl text-sm font-black uppercase tracking-widest italic transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                    <FiSend size={13} /> Send Message
                </button>
            </motion.div>
        </div>
    );
}

// ── Smart Match (GZS AI) ──────────────────────────────────────────────────────

function SmartMatchSection({ branchSlug }) {
    const [isScanning, setIsScanning] = useState(false);
    const [matches, setMatches] = useState(null);
    const [aiSummary, setAiSummary] = useState('');
    const [error, setError] = useState('');

    const handleScan = async () => {
        setIsScanning(true);
        setMatches(null);
        setError('');
        try {
            const json = await core.post('/community/lfg/smart-match', { branch_slug: branchSlug }).then(r => r.data);
            if (json?.data?.matches) {
                setMatches(json.data.matches);
                setAiSummary(json.data.ai_summary || '');
            } else {
                setError('No matches found. Try expanding your skills.');
            }
        } catch {
            setError('AI matching is temporarily unavailable.');
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="mb-14 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-amber-500/30 rounded-3xl p-10 relative overflow-hidden group">
            <AnimatePresence>
                {isScanning && (
                    <motion.div
                        initial={{ top: '-100%' }}
                        animate={{ top: '100%' }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-amber-400/20 to-transparent h-1/2 pointer-events-none"
                    />
                )}
            </AnimatePresence>

            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <FiZap size={120} className={isScanning ? 'animate-pulse' : ''} />
            </div>

            <div className="relative z-10 flex flex-col gap-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-3 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            <FiZap className="text-amber-400" size={20} />
                            <h3 className="text-2xl font-black uppercase tracking-tighter italic text-amber-50">GZS Smart Match</h3>
                        </div>
                        <p className="text-sm font-bold italic text-amber-100/70 max-w-xl leading-relaxed">
                            AI-ranked matches based on verified skills, availability, and collaboration history.
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/50 italic">Powered by GZS AI · claude-sonnet-4-6</p>
                    </div>
                    <div className="shrink-0 text-center space-y-3 min-w-[200px]">
                        {matches === null && !error ? (
                            <button
                                onClick={handleScan}
                                disabled={isScanning}
                                className={`w-full px-8 py-4 bg-amber-400 text-black rounded-2xl text-xs font-black uppercase tracking-widest italic transition-all shadow-xl shadow-amber-500/20 ${isScanning ? 'opacity-50 cursor-wait' : 'hover:scale-105 active:scale-95'}`}
                            >
                                {isScanning ? 'Scanning Network...' : 'Find Matches'}
                            </button>
                        ) : (
                            <button
                                onClick={() => { setMatches(null); setError(''); }}
                                className="text-[10px] font-black uppercase text-amber-400/60 hover:text-amber-400"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {error && (
                    <p className="text-xs font-bold text-amber-300/70 italic text-center">{error}</p>
                )}

                {matches && matches.length > 0 && (
                    <div className="space-y-3">
                        {aiSummary && (
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/60 italic">{aiSummary}</p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {matches.map((match, i) => (
                                <div key={match.sub_profile_id} className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex items-start gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center text-amber-300 font-black text-sm">
                                        #{i + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-black italic text-amber-50 uppercase tracking-tight truncate">@{match.username}</p>
                                        <p className="text-[10px] font-bold text-amber-200/50 uppercase tracking-wide mt-0.5">{match.primary_role}</p>
                                        {match.skills?.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {match.skills.map(s => (
                                                    <span key={s} className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[9px] font-bold uppercase text-amber-300">{s}</span>
                                                ))}
                                            </div>
                                        )}
                                        {match.reason && (
                                            <p className="mt-2 text-[10px] font-bold italic text-amber-100/50 leading-relaxed">{match.reason}</p>
                                        )}
                                        <div className="mt-2 flex items-center gap-1">
                                            <div className="h-1 rounded-full bg-amber-500/30 flex-1">
                                                <div className="h-1 rounded-full bg-amber-400" style={{ width: `${match.match_score}%` }} />
                                            </div>
                                            <span className="text-[9px] font-black text-amber-400 shrink-0">{match.match_score}%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Create LFG Post modal ─────────────────────────────────────────────────────

function CreateLFGModal({ branch, onClose, onSubmit }) {

    const [form, setForm] = useState({
        postType:       'collaborators',
        domain:         branch || 'dev',
        description:    '',
        selectedSkills: [],
        availability:   'This Week',
        hoursPerWeek:   '10-20h',
        timezone:       'IST',
        autoExpire:     true,
    });

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const toggleSkill = (s) =>
        set('selectedSkills', form.selectedSkills.includes(s)
            ? form.selectedSkills.filter((x) => x !== s)
            : [...form.selectedSkills, s]);

    const descLen = form.description.length;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[var(--theme-bg)]/80 backdrop-blur-xl"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 24 }}
                className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] w-full max-w-2xl rounded-3xl relative z-10 my-6 shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-10 space-y-7">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter italic text-[var(--theme-text)]">Post LFG</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest italic text-[var(--theme-text-muted)] opacity-40 mt-1">LFG_PROTOCOL</p>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] transition-all">
                            <FiX size={15} strokeWidth={2.5} />
                        </button>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); onSubmit?.(form); }} className="space-y-6">
                        <Field label="Post Type">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {POST_TYPES.map(type => (
                                    <button
                                        key={type.id} type="button"
                                        onClick={() => set('postType', type.id)}
                                        className={`p-4 rounded-2xl border-2 text-left transition-all ${
                                            form.postType === type.id 
                                            ? 'bg-[var(--theme-primary)]/10 border-[var(--theme-primary)]' 
                                            : 'bg-[var(--theme-bg-alt)] border-[var(--theme-border)] opacity-50 hover:opacity-100'
                                        }`}
                                    >
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${form.postType === type.id ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-text-muted)]'}`}>
                                            {type.label}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </Field>

                        <div className="grid grid-cols-2 gap-5">
                            <Field label="Domain">
                                <select
                                    value={form.domain}
                                    onChange={(e) => set('domain', e.target.value)}
                                    className="w-full px-5 py-4 bg-[var(--theme-bg-alt)] border-2 border-[var(--theme-border)] rounded-2xl text-sm font-bold italic text-[var(--theme-text)] outline-none focus:border-[var(--theme-primary)]"
                                >
                                    {Object.keys(SKILLS_BY_BRANCH).map(b => <option key={b} value={b}>{b.toUpperCase()}</option>)}
                                </select>
                            </Field>
                            <Field label="Availability">
                                <select
                                    value={form.availability}
                                    onChange={(e) => set('availability', e.target.value)}
                                    className="w-full px-4 py-4 bg-[var(--theme-bg-alt)] border-2 border-[var(--theme-border)] rounded-2xl text-sm font-bold italic text-[var(--theme-text)] outline-none focus:border-[var(--theme-primary)]"
                                >
                                    {AVAILABILITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </Field>
                        </div>

                        <Field label={`Description (${descLen}/200)`}>
                            <textarea
                                rows={3}
                                maxLength={200}
                                value={form.description}
                                onChange={(e) => set('description', e.target.value)}
                                placeholder="What are you looking for?"
                                className="w-full px-5 py-4 bg-[var(--theme-bg-alt)] border-2 border-[var(--theme-border)] rounded-2xl text-sm font-bold italic text-[var(--theme-text)] placeholder:opacity-30 outline-none focus:border-[var(--theme-primary)] resize-none"
                            />
                        </Field>

                        <Field label="Skill Requirements">
                            <div className="flex flex-wrap gap-2">
                                {(SKILLS_BY_BRANCH[form.domain] || DEFAULT_SKILLS).map(s => (
                                    <button
                                        key={s} type="button"
                                        onClick={() => toggleSkill(s)}
                                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wide border-2 transition-all ${
                                            form.selectedSkills.includes(s)
                                                ? 'bg-[var(--theme-primary)] text-white border-[var(--theme-primary)]'
                                                : 'bg-[var(--theme-bg-alt)] text-[var(--theme-text-muted)] border-[var(--theme-border)] hover:border-[var(--theme-primary)]/40'
                                        }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </Field>

                        <div className="grid grid-cols-2 gap-5">
                            <Field label="Hours Per Week">
                                <select
                                    value={form.hoursPerWeek}
                                    onChange={(e) => set('hoursPerWeek', e.target.value)}
                                    className="w-full px-4 py-4 bg-[var(--theme-bg-alt)] border-2 border-[var(--theme-border)] rounded-2xl text-sm font-bold italic text-[var(--theme-text)] outline-none focus:border-[var(--theme-primary)]"
                                >
                                    {HOURS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </Field>
                            <Field label="Timezone">
                                <select
                                    value={form.timezone}
                                    onChange={(e) => set('timezone', e.target.value)}
                                    className="w-full px-4 py-4 bg-[var(--theme-bg-alt)] border-2 border-[var(--theme-border)] rounded-2xl text-sm font-bold italic text-[var(--theme-text)] outline-none focus:border-[var(--theme-primary)]"
                                >
                                    {TIMEZONES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </Field>
                        </div>

                        <div className="flex items-center justify-between px-5 py-4 bg-[var(--theme-bg-alt)] border-2 border-[var(--theme-border)] rounded-2xl">
                            <div>
                                <p className="text-sm font-black uppercase tracking-tight italic text-[var(--theme-text)]">This post expires after 7 days</p>
                                <p className="text-[10px] font-bold text-[var(--theme-text-muted)] opacity-40 uppercase tracking-wide">Auto-cleanup protocol active</p>
                            </div>
                            <FiClock className="text-[var(--theme-text-muted)] opacity-30" />
                        </div>

                        <button type="submit" className="w-full py-5 bg-[var(--theme-text)] text-[var(--theme-bg)] hover:bg-[var(--theme-primary)] hover:text-white rounded-2xl text-sm font-black uppercase tracking-widest italic transition-all flex items-center justify-center gap-3 active:scale-95 shadow-2xl">
                            <FiZap size={14} /> Deploy LFG Request
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function LFGBoard() {
    const { slug: branchParam } = useParams();
    const { showToast } = useToast();
    const queryClient = useQueryClient();

    const branchSlug = branchParam || 'general';
    const { data: apiLFGData } = useLFGPosts(branchSlug);

    const [posts, setPosts] = useState([]);
    useEffect(() => {
        const live = apiLFGData?.data || apiLFGData || [];
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPosts(live.length > 0 ? live : MOCK_LFG_POSTS_RICH);
    }, [apiLFGData]);

    const [search,           setSearch]           = useState('');
    const [activeTab,        setActiveTab]         = useState('feed');
    const [isCreateOpen,     setIsCreateOpen]      = useState(false);
    const [applyTarget,      setApplyTarget]       = useState(null);
    const [sort,             setSort]              = useState('newest');
    const [filterPostTypes,  setFilterPostTypes]   = useState([]);
    const [filterSkills,     setFilterSkills]      = useState([]);
    const [filterVerified,   setFilterVerified]    = useState(false);
    const [filterAvail,      setFilterAvail]       = useState('');
    const [showFilters,      setShowFilters]       = useState(false);

    const handleCreatePost = async (formData) => {
        try {
            const res = await core.post(`/community/${branchSlug}/lfg`, {
                goal_type:           formData.postType,
                required_skills:     formData.selectedSkills,
                description:         formData.description,
                availability_window: formData.availability,
                timezone:            formData.timezone,
                auto_expire:         formData.autoExpire ?? true,
            });
            const newPost = res.data?.data || res.data;
            if (newPost) setPosts((prev) => [newPost, ...prev]);
            queryClient.invalidateQueries({ queryKey: ['community', 'lfg', branchSlug] });
            showToast('LFG post created!', 'success');
            setIsCreateOpen(false);
        } catch {
            showToast('Failed to create post. Try again.', 'error');
        }
    };

    const handleApply = async (postId) => {
        try {
            await core.post(`/community/${branchSlug}/lfg/${postId}/apply`);
            showToast('Application sent!', 'success');
        } catch {
            showToast('Could not apply. Try again.', 'error');
        }
    };

    const handleDeletePost = async (postId) => {
        try {
            await core.delete(`/community/${branchSlug}/lfg/${postId}`);
            setPosts((prev) => prev.filter((p) => p.id !== postId));
            queryClient.invalidateQueries({ queryKey: ['community', 'lfg', branchSlug] });
            showToast('Post deleted.', 'info');
        } catch {
            showToast('Could not delete post.', 'error');
        }
    };

    const branchSkills = SKILLS_BY_BRANCH[branchParam] || DEFAULT_SKILLS;

    const toggleTypeFilter = (t) =>
        setFilterPostTypes((prev) =>
            prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

    const toggleSkillFilter = (s) =>
        setFilterSkills((prev) =>
            prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

    const activeFilterCount = filterPostTypes.length + filterSkills.length + (filterAvail ? 1 : 0) + (filterVerified ? 1 : 0);
    const clearFilters = () => { setFilterPostTypes([]); setFilterSkills([]); setFilterAvail(''); setFilterVerified(false); };

    const allPosts = useMemo(() => {
        let result = posts.filter((p) =>
            !branchParam || p.branch_slug === branchParam
        );

        if (search) {
            const q = search.toLowerCase();
            result = result.filter((p) =>
                p.description.toLowerCase().includes(q) ||
                p.author.display_name.toLowerCase().includes(q) ||
                p.required_skills.some((s) => s.toLowerCase().includes(q))
            );
        }

        if (filterPostTypes.length) result = result.filter((p) => filterPostTypes.includes(p.lfg_type || 'collaborators'));
        if (filterSkills.length)    result = result.filter((p) => filterSkills.some(s => p.required_skills.includes(s)));
        if (filterAvail)            result = result.filter((p) => p.availability === filterAvail);
        if (filterVerified)         result = result.filter((p) => p.author.verified);

        if (sort === 'newest')   result = [...result].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        if (sort === 'expiring') result = [...result].sort((a, b) => new Date(a.expires_at) - new Date(b.expires_at));
        if (sort === 'relevant') result = [...result]; // Placeholder for relevance logic

        return result;
    }, [posts, branchParam, search, sort, filterPostTypes, filterSkills, filterVerified, filterAvail]);

    const feedPosts = allPosts.filter((p) => p.author.user_id !== MOCK_ME_ID);
    const myPosts   = allPosts.filter((p) => p.author.user_id === MOCK_ME_ID);
    const displayPosts = activeTab === 'mine' ? myPosts : feedPosts;

    return (
        <div className="flex-1 p-8 lg:p-14 space-y-14 bg-[var(--theme-bg)] relative overflow-hidden selection:bg-[var(--theme-primary)]/30">

            {/* Background glow */}
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[var(--theme-primary)]/5 blur-[120px] rounded-full pointer-events-none" />

            {/* ── HEADER ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10 border-b-2 border-dashed border-[var(--theme-border)]/50 pb-12">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <FiTarget className="text-[var(--theme-primary)] animate-pulse" size={20} />
                        <span className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-30">
                            MISSION_CONTROL · {branchParam?.toUpperCase() || 'ALL'}_SECTOR
                        </span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic text-[var(--theme-text)] leading-[0.85]">
                        Looking <br /><span className="opacity-10">For Group</span>
                    </h1>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
                    <div className="relative group">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] group-focus-within:text-[var(--theme-primary)] transition-colors" size={13} />
                        <input
                            type="text"
                            placeholder="Search posts, skills..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full sm:w-60 pl-11 pr-5 py-4 bg-[var(--theme-card)]/40 border-2 border-[var(--theme-border)] rounded-2xl text-xs font-bold uppercase tracking-tight outline-none focus:border-[var(--theme-primary)]/50 italic text-[var(--theme-text)] placeholder:opacity-30 transition-colors"
                        />
                    </div>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="px-7 py-4 bg-[var(--theme-text)] text-[var(--theme-bg)] hover:bg-[var(--theme-primary)] hover:text-white rounded-2xl text-xs font-black uppercase tracking-wider italic transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95 group"
                    >
                        <FiPlus strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
                        Post LFG
                    </button>
                </div>
            </div>

            {/* ── TABS ── */}
            <div className="flex items-center gap-2 relative z-10 -mt-6">
                {[
                    { id: 'feed', label: 'Feed' },
                    { id: 'mine', label: `My Posts (${myPosts.length})` },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider italic border-2 transition-all ${
                            activeTab === tab.id
                                ? 'bg-[var(--theme-primary)] text-white border-[var(--theme-primary)]'
                                : 'text-[var(--theme-text-muted)] border-[var(--theme-border)] hover:border-[var(--theme-primary)]/40'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── FILTER BAR (Feed only) ── */}
            {activeTab === 'feed' && (
                <div className="relative z-10 -mt-6 space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Sort buttons */}
                        {[
                            { v: 'newest',   label: 'Newest' },
                            { v: 'relevant', label: 'Most Relevant' },
                            { v: 'expiring', label: 'Expiring Soon' },
                        ].map(({ v, label }) => (
                            <button
                                key={v}
                                onClick={() => setSort(v)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider italic border-2 transition-all ${
                                    sort === v
                                        ? 'bg-[var(--theme-text)] text-[var(--theme-bg)] border-[var(--theme-text)]'
                                        : 'text-[var(--theme-text-muted)] border-[var(--theme-border)] hover:border-[var(--theme-primary)]/40'
                                }`}
                            >
                                {label}
                            </button>
                        ))}

                        <button
                            onClick={() => setShowFilters((f) => !f)}
                            className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider italic border-2 transition-all ${
                                showFilters || activeFilterCount > 0
                                    ? 'bg-[var(--theme-primary)]/15 text-[var(--theme-primary)] border-[var(--theme-primary)]/40'
                                    : 'text-[var(--theme-text-muted)] border-[var(--theme-border)] hover:border-[var(--theme-primary)]/40'
                            }`}
                        >
                            <FiSliders size={11} />
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="w-4 h-4 rounded-full bg-[var(--theme-primary)] text-white text-[8px] flex items-center justify-center font-black">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    </div>

                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-[var(--theme-card)]/40 border-2 border-[var(--theme-border)] rounded-2xl p-6 space-y-6 overflow-hidden"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest italic text-[var(--theme-text-muted)] opacity-50 mb-3">Post Type</p>
                                        <div className="flex flex-wrap gap-2">
                                            {POST_TYPES.map(t => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => toggleTypeFilter(t.id)}
                                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wide border-2 transition-all ${
                                                        filterPostTypes.includes(t.id)
                                                            ? 'bg-[var(--theme-primary)] text-white border-[var(--theme-primary)]'
                                                            : 'bg-[var(--theme-bg-alt)] text-[var(--theme-text-muted)] border-[var(--theme-border)]'
                                                    }`}
                                                >
                                                    {t.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest italic text-[var(--theme-text-muted)] opacity-50 mb-3">Skills</p>
                                        <div className="flex flex-wrap gap-2">
                                            {branchSkills.slice(0, 8).map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => toggleSkillFilter(s)}
                                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wide border-2 transition-all ${
                                                        filterSkills.includes(s)
                                                            ? 'bg-[var(--theme-primary)] text-white border-[var(--theme-primary)]'
                                                            : 'bg-[var(--theme-bg-alt)] text-[var(--theme-text-muted)] border-[var(--theme-border)]'
                                                    }`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 pt-4 border-t border-[var(--theme-border)]/50">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div 
                                            onClick={() => setFilterVerified(!filterVerified)}
                                            className={`w-10 h-5 rounded-full relative transition-colors ${filterVerified ? 'bg-[var(--theme-primary)]' : 'bg-[var(--theme-bg-alt)] border border-[var(--theme-border)]'}`}
                                        >
                                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${filterVerified ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic">Verified Creators Only</span>
                                    </label>

                                    <div className="flex-1" />

                                    {activeFilterCount > 0 && (
                                        <button
                                            onClick={clearFilters}
                                            className="text-[10px] font-black uppercase tracking-wider italic text-[var(--status-error)] hover:opacity-70 transition-opacity"
                                        >
                                            Clear all filters
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* ── MAIN GRID ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">

                {/* Stats sidebar */}
                <aside className="lg:col-span-3 space-y-6 h-fit lg:sticky lg:top-8">
                    <div className="bg-[var(--theme-text)] rounded-3xl p-8 relative overflow-hidden shadow-2xl">
                        <div className="relative z-10 space-y-1 mb-6">
                            <p className="text-[10px] font-black uppercase tracking-widest italic text-white/30">Active Posts</p>
                            <h4 className="text-5xl font-black italic tracking-tighter text-white">{feedPosts.length}</h4>
                        </div>
                        <div className="relative z-10 pt-5 border-t border-white/10 space-y-3">
                            <div className="flex justify-between text-xs font-bold italic">
                                <span className="text-white/40 uppercase tracking-wide">My Posts</span>
                                <span className="text-white">{myPosts.length}</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold italic">
                                <span className="text-white/40 uppercase tracking-wide">Expiring &lt;3d</span>
                                <span className="text-yellow-300">
                                    {feedPosts.filter((p) => getDaysUntil(p.expires_at) <= 3).length}
                                </span>
                            </div>
                        </div>
                        <FiTarget size={110} className="absolute bottom-[-25px] right-[-25px] opacity-[0.06] pointer-events-none" />
                    </div>

                    <div className="bg-[var(--theme-card)]/40 border-2 border-[var(--theme-border)] rounded-3xl p-6">
                        <p className="text-[10px] font-black uppercase tracking-widest italic text-[var(--theme-text-muted)] opacity-50 mb-3">
                            Auto-expire Policy
                        </p>
                        <p className="text-xs font-bold italic text-[var(--theme-text-muted)] opacity-40 leading-relaxed">
                            Posts auto-remove after 7 days unless renewed. Manage active posts in the "My Posts" tab.
                        </p>
                    </div>
                </aside>

                {/* Posts + Smart Match */}
                <div className="lg:col-span-9">
                    <SmartMatchSection branchSlug={branchParam} />
                    
                    {displayPosts.length === 0 ? (
                        <div className="py-36 text-center bg-[var(--theme-card)]/30 border-2 border-dashed border-[var(--theme-border)] rounded-3xl flex flex-col items-center justify-center gap-6 opacity-30">
                            <FiUsers size={56} className="animate-pulse" />
                            <div>
                                <p className="text-2xl font-black uppercase tracking-tighter italic">
                                    {activeTab === 'mine' ? 'No active posts' : 'No posts found'}
                                </p>
                                <p className="text-xs font-bold uppercase tracking-widest italic mt-2 opacity-50">
                                    {activeTab === 'mine' ? 'Post your first LFG above' : 'Adjust filters or post the first one'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <AnimatePresence>
                                {displayPosts.map((post) => (
                                    <LFGPostCard
                                        key={post.id}
                                        post={post}
                                        isOwn={post.author.user_id === MOCK_ME_ID}
                                        onApply={setApplyTarget}
                                        onExpire={() => handleDeletePost(post.id)}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* ── MODALS ── */}
            <AnimatePresence>
                {isCreateOpen && (
                    <CreateLFGModal branch={branchParam} onClose={() => setIsCreateOpen(false)} onSubmit={handleCreatePost} />
                )}
                {applyTarget && (
                    <ApplyModal post={applyTarget} onClose={() => setApplyTarget(null)} onSend={handleApply} />
                )}
            </AnimatePresence>
        </div>
    );
}
