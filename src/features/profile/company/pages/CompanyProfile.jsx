import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiBriefcase, FiMapPin, FiGlobe, FiUsers, FiAward,
  FiCheckCircle, FiTwitter, FiLinkedin, FiYoutube, FiInstagram,
  FiCalendar, FiMessageCircle, FiPlus, FiArrowRight,
  FiMail, FiLock, FiUnlock, FiExternalLink, FiLayout, FiX, FiSend, FiPaperclip
} from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import { useToast } from '@/shared/components/Toast';
import GameCard from '@/shared/components/GameCard';
import TournamentCard from '@/shared/components/TournamentCard';
import {
  MOCK_COMPANY, MOCK_OPEN_ROLES, MOCK_TEAM_MEMBERS
} from './companyMockData';
import { MOCK_GAMES_LIST } from '@/shared/data/gamesData';
import { MOCK_TOURNAMENTS } from '@/shared/data/tournamentData';

// ── Constants ────────────────────────────────────────────────────────────────

const MOCK_SUB_PROFILES = [
  { id: 'sp_dev',     domain: 'developer', label: 'Dev',     username: 'gzs_coder'   },
  { id: 'sp_art',     domain: 'artist',    label: 'Art',     username: 'gzs_artist'  },
  { id: 'sp_content', domain: 'content',   label: 'Content', username: 'gzs_content' },
];

const DOMAIN_COLORS = {
  developer: 'var(--domain-dev)',
  artist:    'var(--domain-art)',
  content:   'var(--domain-content)',
  esports:   'var(--domain-esports)',
  business:  'var(--domain-business)',
  writer:    'var(--domain-writing)',
  audio:     'var(--domain-audio)',
};

// ── Apply Modal ───────────────────────────────────────────────────────────────

const MAX_COVER = 300;

function ApplyModal({ role, subProfiles, onClose, onSubmit }) {
  const [coverNote, setCoverNote]           = useState('');
  const [selectedSpId, setSelectedSpId]     = useState(subProfiles[0]?.id ?? '');
  const [attachPortfolio, setAttachPortfolio] = useState(false);
  const [submitting, setSubmitting]         = useState(false);

  const remaining = MAX_COVER - coverNote.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coverNote.trim() || submitting) return;
    setSubmitting(true);
    await onSubmit({ roleId: role.id, coverNote, subProfileId: selectedSpId, attachPortfolio });
    setSubmitting(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-lg rounded-[2rem] border shadow-2xl overflow-hidden"
        style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
        initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b" style={{ borderColor: 'var(--theme-border)' }}>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: 'var(--theme-primary)' }}>Apply on GzoneSphere</p>
            <h3 className="text-xl font-black uppercase italic tracking-tighter" style={{ color: 'var(--theme-text)' }}>{role.title}</h3>
            <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
              {role.domain} · {role.experience_level} · {role.is_remote ? 'Remote' : role.location}
            </p>
          </div>
          <button
            type="button" onClick={onClose}
            className="rounded-xl p-2 transition hover:bg-[var(--theme-bg-section)]"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Cover note */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--theme-text-muted)' }}>
              Cover Note <span className="text-rose-400">*</span>
            </label>
            <textarea
              required rows={5}
              placeholder="Tell Nexus Interactive why you're the right fit for this role..."
              value={coverNote}
              onChange={(e) => setCoverNote(e.target.value.slice(0, MAX_COVER))}
              className="w-full rounded-xl border px-4 py-3 text-sm resize-none outline-none focus:border-[var(--theme-primary)] transition-colors"
              style={{ background: 'var(--theme-bg-alt)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
            />
            <p className={`text-right text-[10px] font-bold mt-1 ${remaining < 50 ? 'text-rose-400' : ''}`} style={remaining >= 50 ? { color: 'var(--theme-text-muted)' } : {}}>
              {remaining}/{MAX_COVER}
            </p>
          </div>

          {/* Sub-profile selector */}
          {subProfiles.length > 1 && (
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--theme-text-muted)' }}>
                Applying As
              </label>
              <div className="flex flex-wrap gap-2">
                {subProfiles.map((sp) => {
                  const accent = DOMAIN_COLORS[sp.domain] ?? 'var(--theme-primary)';
                  const active  = sp.id === selectedSpId;
                  return (
                    <button
                      key={sp.id} type="button"
                      onClick={() => setSelectedSpId(sp.id)}
                      className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-black border transition-all"
                      style={{
                        borderColor: active ? accent : 'var(--theme-border)',
                        background:  active ? `color-mix(in srgb, ${accent} 12%, transparent)` : 'var(--theme-bg-alt)',
                        color: active ? accent : 'var(--theme-text-muted)',
                      }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ background: accent }} />
                      @{sp.username}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Portfolio toggle */}
          <div className="flex items-center justify-between rounded-xl border px-4 py-3" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-alt)' }}>
            <div className="flex items-center gap-3">
              <FiPaperclip size={16} style={{ color: 'var(--theme-text-muted)' }} />
              <div>
                <p className="text-xs font-black" style={{ color: 'var(--theme-text)' }}>Attach GZS Portfolio</p>
                <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>Share your verified showcase with this company</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAttachPortfolio((v) => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${attachPortfolio ? 'bg-[var(--theme-primary)]' : 'bg-[var(--theme-border)]'}`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${attachPortfolio ? 'translate-x-5' : 'translate-x-0.5'}`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 rounded-xl border py-3 text-xs font-black uppercase tracking-widest transition hover:border-[var(--theme-primary)]"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!coverNote.trim() || submitting}
              className="flex-1 rounded-xl py-3 text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'var(--theme-primary)' }}
            >
              <FiSend size={13} />
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Components ───────────────────────────────────────────────────────────────

const SectionHeader = ({ label, accent = 'var(--theme-primary)' }) => (
  <div className="flex items-center gap-3 mb-8">
    <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: accent }} />
    <h2 className="text-2xl font-black uppercase tracking-tighter text-[var(--theme-text)] italic">
      {label}
    </h2>
  </div>
);

const CompanyHeader = ({ company, isFollowing, onFollow, isConnected, onConnect }) => {
  const c = company;
  return (
    <div className="relative">
      {/* Banner */}
      <div className="h-48 md:h-64 w-full rounded-t-[2.5rem] overflow-hidden relative">
        <img 
          src={c.banner_url || "https://picsum.photos/1200/400?random=company"} 
          className="w-full h-full object-cover" 
          alt="Company banner" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="bg-[var(--theme-card)] border-x border-b border-[var(--theme-border)] rounded-b-[2.5rem] px-6 md:px-10 pb-8 relative shadow-xl">
        <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-10 md:-mt-14">
          {/* Logo */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-[var(--theme-card)] p-2 shadow-2xl border-4 border-[var(--theme-card)] relative z-10">
            {c.logo ? (
              <img src={c.logo} alt={c.name} className="w-full h-full rounded-xl object-cover" />
            ) : (
              <div className="w-full h-full rounded-xl bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-primary-dark)] flex items-center justify-center text-white text-4xl font-black italic">
                {c.name?.[0] || 'C'}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic text-[var(--theme-text)]">
                {c.name}
              </h1>
              {c.is_verified && (
                <span className="p-1 bg-blue-500 rounded-full text-white shadow-lg shadow-blue-500/20" title="Admin Verified">
                  <FiCheckCircle size={14} />
                </span>
              )}
              <span className="px-3 py-1 bg-[var(--theme-primary)]/10 border border-[var(--theme-primary)]/20 rounded-full text-[var(--theme-primary)] text-[10px] font-black uppercase tracking-widest">
                {c.type}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-[var(--theme-text-muted)] uppercase tracking-wide">
              <span className="flex items-center gap-1.5"><FiMapPin size={14} /> {c.hq_city}, {c.hq_country}</span>
              <span className="flex items-center gap-1.5"><FiCalendar size={14} /> Est. {c.founding_year}</span>
              <a href={c.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[var(--theme-primary)] hover:underline">
                <FiGlobe size={14} /> {c.website.replace('https://', '')} <FiExternalLink size={10} />
              </a>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
            <button 
              onClick={onConnect}
              disabled={isConnected}
              className={`gzs-btn-${isConnected ? 'secondary' : 'primary'} !px-6 !py-2.5 text-xs font-black uppercase tracking-widest italic flex items-center gap-2`}
            >
              {isConnected ? 'Request Sent' : 'Connect'}
            </button>
            <button 
              onClick={onFollow}
              className={`px-6 py-2.5 rounded-xl border-2 font-black text-xs uppercase tracking-widest transition-all ${
                isFollowing 
                  ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white' 
                  : 'border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:border-[var(--theme-primary)] hover:text-[var(--theme-primary)]'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-[var(--theme-border)]">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--theme-bg-alt)] border border-[var(--theme-border)]/50">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500">
              <FiUsers size={20} />
            </div>
            <div>
              <p className="text-xl font-black text-[var(--theme-text)] leading-none">{c.size_range.replace('-', '+')}</p>
              <p className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider mt-1">GZS Employees</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--theme-bg-alt)] border border-[var(--theme-border)]/50">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <FiBriefcase size={20} />
            </div>
            <div>
              <p className="text-xl font-black text-[var(--theme-text)] leading-none">{MOCK_OPEN_ROLES.length}</p>
              <p className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider mt-1">Open Positions</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--theme-bg-alt)] border border-[var(--theme-border)]/50">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <FiLayout size={20} />
            </div>
            <div>
              <p className="text-xl font-black text-[var(--theme-text)] leading-none">{c.shipped_titles?.length || 0}</p>
              <p className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider mt-1">Projects Shipped</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionInquiry = ({ companyName }) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    showToast(`Inquiry sent to ${companyName}. They will respond soon.`, 'success');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-[2rem] p-8 shadow-sm">
      <h3 className="text-lg font-black uppercase italic text-[var(--theme-text)] mb-6">Business Inquiry</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            type="text" required placeholder="Your Name"
            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] rounded-xl px-4 py-3 text-sm focus:border-[var(--theme-primary)] outline-none"
          />
          <input 
            type="email" required placeholder="Professional Email"
            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
            className="w-full bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] rounded-xl px-4 py-3 text-sm focus:border-[var(--theme-primary)] outline-none"
          />
        </div>
        <input 
          type="text" required placeholder="Subject"
          value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}
          className="w-full bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] rounded-xl px-4 py-3 text-sm focus:border-[var(--theme-primary)] outline-none"
        />
        <textarea 
          required placeholder="Message..." rows={4}
          value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}
          className="w-full bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] rounded-xl px-4 py-3 text-sm focus:border-[var(--theme-primary)] outline-none resize-none"
        />
        <button type="submit" className="gzs-btn-primary w-full py-3 font-black uppercase tracking-widest text-xs italic">
          Transmit Inquiry
        </button>
      </form>
    </div>
  );
};

// ── Root Page ────────────────────────────────────────────────────────────────

const CompanyProfile = () => {
  usePageTheme('profile');
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [applyModalRole, setApplyModalRole] = useState(null);
  const [appliedRoles, setAppliedRoles] = useState(new Set());

  const c = MOCK_COMPANY; // Normally use slug to fetch
  
  const specs = ['AAA Studio', 'Story-Driven', 'Cross-Platform', 'Unreal Engine 5'];

  const companyTournaments = useMemo(() => 
    MOCK_TOURNAMENTS.filter(t => t.organizer === c.name || t.id.includes('org')), 
  [c.name]);

  const handleConnect = () => {
    setIsConnected(true);
    showToast(`Connection request sent to ${c.name} Talent Acquisition.`, 'success');
  };

  const handleGzsApply = async ({ roleId, coverNote, subProfileId, attachPortfolio }) => {
    // POST /companies/{slug}/applications
    // await companyService.applyToRole(c.slug, { role_id: roleId, cover_note: coverNote, sub_profile_id: subProfileId, attach_portfolio: attachPortfolio });
    setAppliedRoles((prev) => new Set([...prev, roleId]));
    setApplyModalRole(null);
    showToast('Application submitted! The studio will review your profile.', 'success');
  };

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] pb-32 pt-28 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>{c.name} | Studio Profile | GzoneSphere</title>
        <meta name="description" content={`Explore ${c.name} on GzoneSphere. Career opportunities, team members, and published titles.`} />
      </Helmet>

      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section 1: Header */}
        <CompanyHeader 
          company={c} 
          isFollowing={isFollowing} onFollow={() => setIsFollowing(!isFollowing)}
          isConnected={isConnected} onConnect={handleConnect}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12">
          {/* Main Column */}
          <div className="space-y-20">
            
            {/* Section 2: About */}
            <section id="about">
              <SectionHeader label="Strategic Overview" />
              <div className="prose prose-invert max-w-none">
                <p className="text-[var(--theme-text)] opacity-80 leading-relaxed text-lg">
                  {c.description}
                </p>
                <div className="mt-8 flex flex-wrap gap-2">
                  {specs.map(tag => (
                    <span key={tag} className="px-4 py-1.5 bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] rounded-full text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* Section 3: Job Listings */}
            <section id="roles">
              <SectionHeader label={`Open Deployments (${MOCK_OPEN_ROLES.length})`} accent="var(--status-success)" />
              <div className="space-y-4">
                {MOCK_OPEN_ROLES.map(role => (
                  <div key={role.id} className="group bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-[2rem] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-[var(--theme-primary)] transition-all shadow-sm">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                          role.domain === 'Development' ? 'bg-violet-500/10 border-violet-500/30 text-violet-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                        }`}>
                          {role.domain}
                        </span>
                        <span className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">
                          {role.experience_level} · {role.is_remote ? 'Remote' : role.location}
                        </span>
                      </div>
                      <h4 className="text-xl font-black uppercase italic tracking-tighter text-[var(--theme-text)] group-hover:text-[var(--theme-primary)] transition-colors">
                        {role.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {role.apply_url && (
                        <a
                          href={role.apply_url}
                          target="_blank" rel="noreferrer"
                          className="px-4 py-2.5 rounded-xl border text-xs font-black uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap transition hover:border-[var(--theme-primary)] hover:text-[var(--theme-primary)]"
                          style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
                        >
                          External <FiExternalLink size={12} />
                        </a>
                      )}
                      {appliedRoles.has(role.id) ? (
                        <span className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 whitespace-nowrap">
                          Applied ✓
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setApplyModalRole(role)}
                          className="gzs-btn-primary !px-4 !py-2.5 italic text-xs font-black uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap"
                        >
                          Apply on GZS <FiArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 4: Team */}
            <section id="team">
              <SectionHeader label="Active Recon Team" accent="var(--domain-esports)" />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {MOCK_TEAM_MEMBERS.map(member => (
                  <Link key={member.id} to={member.profile_url} className="group bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-[2rem] p-5 flex items-center gap-4 hover:border-[var(--theme-primary)] transition-all shadow-sm">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] overflow-hidden shrink-0">
                      {member.avatar ? (
                        <img src={member.avatar} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--theme-primary)] font-black italic text-xl">
                          {member.username[0]}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-sm uppercase italic tracking-tighter truncate text-[var(--theme-text)]">
                        {member.username}
                      </p>
                      <p className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase truncate mb-1">
                        {member.role_at_company}
                      </p>
                      <span className="px-1.5 py-0.5 bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] text-[8px] font-black uppercase rounded border border-[var(--theme-primary)]/20">
                        {member.domain_badges[0]}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
              <p className="mt-6 text-center text-xs font-bold text-[var(--theme-text-muted)] uppercase tracking-widest opacity-60">
                {MOCK_TEAM_MEMBERS.length} Tactical operatives linked on GzoneSphere
              </p>
            </section>

            {/* Section 5: Games / Portfolio */}
            {c.type.toLowerCase().includes('studio') || c.type.toLowerCase().includes('publisher') ? (
              <section id="portfolio">
                <SectionHeader label={`Games Published by ${c.name}`} accent="var(--domain-art)" />
                <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-[var(--theme-border)]">
                  {MOCK_GAMES_LIST.length > 0 ? (
                    MOCK_GAMES_LIST.slice(0, 5).map(game => (
                      <div key={game.id} className="min-w-[280px]">
                        <GameCard game={game} />
                      </div>
                    ))
                  ) : (
                    <div className="w-full py-12 bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] rounded-[2rem] text-center text-[var(--theme-text-muted)] uppercase font-black text-xs tracking-widest">
                      No games in our library yet.
                    </div>
                  )}
                </div>
              </section>
            ) : null}

            {/* Section 6: Tournaments (Esports Only) */}
            {c.type.toLowerCase().includes('esports') ? (
              <section id="tournaments">
                <SectionHeader label="Operations Organized" accent="var(--status-error)" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {companyTournaments.map(t => (
                    <TournamentCard key={t.id} tournament={t} />
                  ))}
                  {companyTournaments.length === 0 && (
                    <div className="col-span-full py-12 bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] rounded-[2rem] text-center text-[var(--theme-text-muted)] uppercase font-black text-xs tracking-widest">
                      No active operations found.
                    </div>
                  )}
                </div>
              </section>
            ) : null}

          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* Contact Card */}
            <div className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-[var(--theme-text)] mb-6">Get in Touch</h3>
              
              <div className="space-y-6 relative z-10">
                <div className="group cursor-pointer" onClick={() => setShowEmail(!showEmail)}>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--theme-primary)] mb-1 italic">HQ Comms</p>
                  <div className="flex items-center gap-3 text-[var(--theme-text)]">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] flex items-center justify-center group-hover:border-[var(--theme-primary)] transition-all">
                      {showEmail ? <FiUnlock size={18} /> : <FiLock size={18} />}
                    </div>
                    <span className="font-bold text-sm">
                      {showEmail ? `contact@${c.slug}.gg` : 'cont***@company.com'}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => navigate(`/messages/new?to=${c.id}`)}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] font-black text-xs uppercase tracking-widest text-[var(--theme-text)] hover:border-[var(--theme-primary)] hover:text-[var(--theme-primary)] transition-all"
                >
                  <FiMessageCircle size={18} /> Platform Comms
                </button>
              </div>

              <div className="absolute top-[-20px] right-[-20px] opacity-5">
                <FiMail size={120} />
              </div>
            </div>

            {/* Social Hub */}
            <div className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-[2.5rem] p-8 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[var(--theme-text-muted)] mb-6 opacity-60">Nexus Socials</h3>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { icon: FiTwitter, link: c.social_links?.twitter },
                  { icon: FiLinkedin, link: c.social_links?.linkedin },
                  { icon: FiYoutube, link: c.social_links?.youtube },
                  { icon: FiInstagram, link: c.social_links?.instagram },
                  { icon: FiMessageCircle, link: c.social_links?.discord },
                ].map((s, index) => (
                  <a key={index} href={s.link} target="_blank" rel="noreferrer" className="w-11 h-11 rounded-xl bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] hover:border-[var(--theme-primary)] transition-all">
                    <s.icon size={18} />
                  </a>
                ))}
              </div>
            </div>

            {/* Inquiry Form */}
            <SectionInquiry companyName={c.name} />

            {/* Similar Studios */}
            <div className="pt-4">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[var(--theme-text-muted)] mb-4 opacity-60 px-4">Related Entities</h3>
              <div className="space-y-3">
                {['Nova Entertainment', 'Apex Publishing', 'Shadow Labs'].map(name => (
                  <div key={name} className="p-4 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-2xl flex items-center justify-between group cursor-pointer hover:border-[var(--theme-primary)]/40 transition-all">
                    <span className="text-xs font-bold text-[var(--theme-text)]">{name}</span>
                    <FiPlus className="text-[var(--theme-text-muted)] group-hover:text-[var(--theme-primary)]" />
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Apply on GzoneSphere modal */}
      <AnimatePresence>
        {applyModalRole && (
          <ApplyModal
            role={applyModalRole}
            subProfiles={MOCK_SUB_PROFILES}
            onClose={() => setApplyModalRole(null)}
            onSubmit={handleGzsApply}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompanyProfile;
