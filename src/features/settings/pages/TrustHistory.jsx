import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiChevronLeft, FiShield, FiTrendingUp, FiTrendingDown,
  FiCpu, FiAlertCircle, FiZap, FiInfo
} from 'react-icons/fi';
import { Helmet } from 'react-helmet-async';
import TrustScoreWidget from '@/shared/components/TrustScoreWidget';
import LevelBadge       from '@/shared/components/LevelBadge';
import {
  MOCK_TRUST_BREAKDOWN, MOCK_XP_HISTORY, MOCK_USER_XP, XP_SOURCES, LEVEL_DEFINITIONS
} from '@/shared/data/progressionData';

// ── XP progress bar ───────────────────────────────────────────────────────────
const XPBar = ({ current, total, currentLevel, nextLevel }) => {
  const pct = Math.min(100, Math.round((current / total) * 100));
  return (
    <div className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic mb-1">XP Balance</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black italic tracking-tighter text-[var(--theme-text)]">{current.toLocaleString()}</span>
            <span className="text-sm text-[var(--theme-text-muted)]">/ {total.toLocaleString()} XP to <strong>{nextLevel}</strong></span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LevelBadge level={currentLevel} size="lg" />
          <span className="text-[var(--theme-text-muted)] text-xs">→</span>
          <LevelBadge level={nextLevel} size="lg" />
        </div>
      </div>

      {/* Bar */}
      <div className="h-3 rounded-full bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-[var(--theme-primary)] to-[#06B6D4] transition-all duration-700"
          style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-[var(--theme-text-muted)] text-right">{pct}% of the way to {nextLevel}</p>
    </div>
  );
};

// ── XP Sources table ──────────────────────────────────────────────────────────
const XPSourcesTable = () => (
  <div className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-2xl overflow-hidden">
    <div className="px-6 py-4 border-b border-[var(--theme-border)] flex items-center gap-3">
      <FiZap size={16} className="text-[var(--theme-primary)]" />
      <h2 className="text-sm font-black uppercase tracking-widest text-[var(--theme-text)] italic">XP Sources</h2>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-[var(--theme-bg-alt)]">
          <tr>
            <th className="px-5 py-3 text-left font-black uppercase tracking-widest text-[var(--theme-text-muted)]">Action</th>
            <th className="px-5 py-3 text-center font-black uppercase tracking-widest text-[var(--theme-text-muted)]">XP Reward</th>
            <th className="px-5 py-3 text-right font-black uppercase tracking-widest text-[var(--theme-text-muted)]">Daily Cap</th>
          </tr>
        </thead>
        <tbody>
          {XP_SOURCES.map((row, i) => (
            <tr key={i} className="border-t border-[var(--theme-border)] hover:bg-[var(--theme-bg-alt)] transition-colors">
              <td className="px-5 py-3 text-[var(--theme-text)]">{row.action}</td>
              <td className="px-5 py-3 text-center">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] font-black">
                  +{row.xp} XP
                </span>
              </td>
              <td className="px-5 py-3 text-right text-[var(--theme-text-muted)]">{row.cap}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ── Activity log ──────────────────────────────────────────────────────────────
const ActivityLog = () => (
  <div className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-2xl overflow-hidden">
    <div className="px-6 py-4 border-b border-[var(--theme-border)] flex items-center gap-3">
      <FiCpu size={16} className="text-[var(--theme-primary)]" />
      <h2 className="text-sm font-black uppercase tracking-widest text-[var(--theme-text)] italic">Activity Log</h2>
    </div>
    <div className="divide-y divide-[var(--theme-border)]">
      {MOCK_XP_HISTORY.map((e) => {
        const isGain = e.type === 'gain';
        const isSys  = e.type === 'system';
        return (
          <div key={e.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[var(--theme-bg-alt)] transition-colors">
            {/* Icon */}
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isGain ? 'bg-[var(--status-success)]/10 text-[var(--status-success)]' :
              isSys  ? 'bg-[var(--theme-bg-alt)] text-[var(--theme-text-muted)]' :
                       'bg-red-500/10 text-red-500'
            }`}>
              {isGain ? <FiTrendingUp size={14} /> : isSys ? <FiCpu size={14} /> : <FiTrendingDown size={14} />}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[var(--theme-text)] truncate">{e.action}</p>
              <p className="text-[0.65rem] text-[var(--theme-text-muted)]">{e.date}</p>
            </div>

            {/* XP delta */}
            <span className={`text-sm font-black shrink-0 ${
              isGain ? 'text-[var(--status-success)]' :
              isSys  ? 'text-[var(--theme-text-muted)]' : 'text-red-500'
            }`}>
              {e.xp > 0 ? `+${e.xp}` : e.xp === 0 ? '±0' : e.xp} XP
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

// ── Level overview strip ───────────────────────────────────────────────────────
const LevelOverview = () => (
  <div className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-2xl p-6 space-y-4">
    <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic">Level Progression</p>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {LEVEL_DEFINITIONS.map((lvl) => (
        <div key={lvl.id} className="flex flex-col items-center gap-2 p-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] text-center">
          <LevelBadge level={lvl.id} size="sm" />
          <p className="text-[0.6rem] text-[var(--theme-text-muted)] leading-tight">{lvl.tooltip}</p>
          {lvl.xpRequired > 0 && (
            <p className="text-[0.6rem] font-black text-[var(--theme-primary)]">{lvl.xpRequired.toLocaleString()} XP</p>
          )}
        </div>
      ))}
    </div>
  </div>
);

// ── Anti-farm notice ──────────────────────────────────────────────────────────
const AntiFarmNotice = () => (
  <div className="flex gap-3 p-4 rounded-2xl border border-[#06B6D4]/30 bg-[#06B6D4]/5 text-[#0891b2]">
    <FiInfo size={16} className="flex-shrink-0 mt-0.5" />
    <p className="text-xs leading-relaxed font-medium">
      <strong>Anti-farm protection active.</strong> Activity is measured by meaningful engagement, not raw session time.
      Repeated low-quality actions, automated activity, or AFK sessions are automatically filtered and do not contribute XP.
    </p>
  </div>
);

// ── Root page ─────────────────────────────────────────────────────────────────
export default function TrustHistory() {
  const navigate = useNavigate();
  const xp = MOCK_USER_XP;

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] font-body selection:bg-[var(--theme-primary)]/30 pb-32">
      <Helmet>
        <title>Trust & Progression | GzoneSphere</title>
        <meta name="description" content="Your trust score, XP history, and level progression on GzoneSphere." />
      </Helmet>

      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] right-[-10%] w-[700px] h-[700px] bg-[var(--theme-primary)]/5 blur-[140px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[var(--status-success)]/5 blur-[100px] rounded-full" />
      </div>

      <main className="max-w-4xl mx-auto px-5 lg:px-8 py-28 space-y-8 relative z-10">

        {/* Back + heading */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-[var(--theme-card)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] hover:border-[var(--theme-primary)]/30 transition-all">
            <FiChevronLeft size={18} />
          </button>
          <h1 className="text-2xl font-black uppercase tracking-tighter italic text-[var(--theme-text)]">
            Trust &amp; Progression
          </h1>
        </div>

        {/* Hero: trust score + level */}
        <div className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-14 h-14 rounded-2xl bg-[var(--theme-primary)]/10 flex items-center justify-center">
              <FiShield size={28} className="text-[var(--theme-primary)]" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic mb-1">Trust Score</p>
              <div className="flex items-center gap-3">
                <TrustScoreWidget score={MOCK_TRUST_BREAKDOWN.total} breakdown={MOCK_TRUST_BREAKDOWN} size="lg" />
                <span className="text-xs text-[var(--theme-text-muted)]">Hover to see breakdown</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1">
            <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic">Current Level</p>
            <LevelBadge level={xp.currentLevel} size="lg" />
            <Link to="/settings/trust" className="text-xs text-[var(--theme-primary)] hover:underline">
              View full history
            </Link>
          </div>
        </div>

        {/* XP progress bar */}
        <XPBar
          current={xp.xpProgress}
          total={xp.xpForNext}
          currentLevel={xp.currentLevel}
          nextLevel={xp.nextLevel}
        />

        {/* Anti-farm notice */}
        <AntiFarmNotice />

        {/* Level overview */}
        <LevelOverview />

        {/* XP Sources table */}
        <XPSourcesTable />

        {/* Activity log */}
        <ActivityLog />
      </main>
    </div>
  );
}
