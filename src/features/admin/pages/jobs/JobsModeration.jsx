import { useState, useMemo } from 'react';
import { FiCheck, FiX, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { AdminPageHero } from '@/features/admin/components/AdminContentShell';
import { useToast } from '@/shared/components/Toast';

const PENDING_LISTINGS = [
  {
    id: 'lst-002', title: '3D Character Artist', type: 'Freelance',
    company: { name: 'PixelForge', verified: false, has_logo: false, description_words: 30 },
    submitted_at: '2026-05-19T00:00:00Z',
    listing_description_words: 80, skills_count: 1, salary_present: false,
    category_accurate: true, completeness_score: 55,
  },
  {
    id: 'lst-004', title: 'Game QA Tester', type: 'Playtesting',
    company: { name: 'CloudBurst Games', verified: true, has_logo: true, description_words: 120 },
    submitted_at: '2026-05-18T00:00:00Z',
    listing_description_words: 135, skills_count: 3, salary_present: true,
    category_accurate: true, completeness_score: 90,
  },
  {
    id: 'lst-011', title: 'Graphic Designer (Social)', type: 'Freelance',
    company: { name: 'BlazeMedia', verified: false, has_logo: true, description_words: 60 },
    submitted_at: '2026-05-17T08:00:00Z',
    listing_description_words: 110, skills_count: 2, salary_present: false,
    category_accurate: true, completeness_score: 72,
  },
  {
    id: 'lst-012', title: 'Backend Node.js Dev', type: 'Full-time',
    company: { name: 'FusionLabs', verified: false, has_logo: false, description_words: 20 },
    submitted_at: '2026-05-16T12:00:00Z',
    listing_description_words: 45, skills_count: 5, salary_present: true,
    category_accurate: false, completeness_score: 62,
  },
];

const TYPE_COLOURS = {
  'Full-time':  'bg-blue-500/15 text-blue-400 border-blue-500/20',
  Internship:   'bg-teal-500/15 text-teal-400 border-teal-500/20',
  Freelance:    'bg-violet-500/15 text-violet-400 border-violet-500/20',
  Playtesting:  'bg-amber-500/15 text-amber-400 border-amber-500/20',
};

const REJECT_REASONS = ['Too vague', 'Incomplete', 'Prohibited content', 'Wrong category', 'Other'];

function SlaCountdown({ submitted_at }) {
  const [now] = useState(Date.now);
  const sla = new Date(submitted_at).getTime() + 24 * 3_600_000;
  const hoursLeft = (sla - now) / 3_600_000;
  if (hoursLeft > 12) return <span className="text-emerald-400 text-xs font-bold">{Math.ceil(hoursLeft)}h SLA remaining</span>;
  if (hoursLeft > 0)  return <span className="text-amber-400 text-xs font-bold animate-pulse">{Math.ceil(hoursLeft)}h SLA remaining</span>;
  return <span className="text-rose-400 text-xs font-bold animate-pulse">SLA OVERDUE</span>;
}

function QualityCheck({ pass, label }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {pass
        ? <FiCheckCircle size={13} className="text-emerald-400 shrink-0" />
        : <FiXCircle size={13} className="text-rose-400 shrink-0" />}
      <span className={pass ? 'text-[var(--theme-text)] opacity-70' : 'text-[var(--theme-text-muted)] opacity-50'}>{label}</span>
    </div>
  );
}

function ScoreBadge({ score }) {
  const colour = score >= 85 ? 'text-emerald-400' : score >= 70 ? 'text-amber-400' : 'text-rose-400';
  return <span className={`text-3xl font-black tabular-nums ${colour}`}>{score}%</span>;
}

export default function JobsModeration() {
  const { showToast } = useToast();
  const [listings, setListings] = useState(PENDING_LISTINGS);
  const [now] = useState(Date.now);
  const [selected, setSelected] = useState(new Set());
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('Too vague');
  const [rejectNote, setRejectNote] = useState('');
  const [inlineRejectId, setInlineRejectId] = useState(null);
  const [scoreFilter, setScoreFilter] = useState('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const sorted = useMemo(() => {
    let rows = [...listings].sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
    if (verifiedOnly) rows = rows.filter(l => l.company.verified);
    if (scoreFilter === 'high') rows = rows.filter(l => l.completeness_score >= 85);
    else if (scoreFilter === 'mid') rows = rows.filter(l => l.completeness_score >= 70 && l.completeness_score < 85);
    else if (scoreFilter === 'low') rows = rows.filter(l => l.completeness_score < 70);
    return rows;
  }, [listings, scoreFilter, verifiedOnly]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === sorted.length) setSelected(new Set());
    else setSelected(new Set(sorted.map(l => l.id)));
  };

  const bulkAction = (action) => {
    setListings(prev => prev.filter(l => !selected.has(l.id)));
    showToast(`${selected.size} listing(s) bulk ${action === 'approve' ? 'approved' : 'rejected'}.`, 'success');
    setSelected(new Set());
  };

  const approveSingle = (id) => {
    setListings(prev => prev.filter(l => l.id !== id));
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    showToast('Listing approved and set to Live.', 'success');
  };

  const rejectSingle = () => {
    setListings(prev => prev.filter(l => l.id !== (rejectId || inlineRejectId)));
    setSelected(prev => { const n = new Set(prev); n.delete(rejectId || inlineRejectId); return n; });
    showToast(`Listing rejected: ${rejectReason}.`, 'success');
    setRejectId(null);
    setInlineRejectId(null);
    setRejectNote('');
  };

  function hoursInQueue(iso) {
    return Math.floor((now - new Date(iso)) / 3_600_000);
  }

  return (
    <div className="admin-page">
      <AdminPageHero
        kicker="Jobs & Hiring"
        title="Moderation Queue"
        description="Review and moderate job listings awaiting approval. Sorted oldest-first."
      />

      {/* Bulk + filters bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <label className="flex items-center gap-2 text-sm text-[var(--theme-text-muted)] cursor-pointer">
          <input
            type="checkbox"
            checked={selected.size > 0 && selected.size === sorted.length}
            ref={el => { if (el) el.indeterminate = selected.size > 0 && selected.size < sorted.length; }}
            onChange={selectAll}
            className="rounded border-[var(--theme-border)] accent-[var(--theme-primary)]"
          />
          {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
        </label>

        {selected.size > 0 && (
          <>
            <button
              onClick={() => bulkAction('approve')}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 transition-colors font-semibold"
            >
              <FiCheck size={12} /> Bulk approve ({selected.size})
            </button>
            <button
              onClick={() => bulkAction('reject')}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/20 hover:bg-rose-500/25 transition-colors font-semibold"
            >
              <FiX size={12} /> Bulk reject ({selected.size})
            </button>
          </>
        )}

        <div className="ml-auto flex gap-2">
          <select className="admin-select text-sm" value={scoreFilter} onChange={e => setScoreFilter(e.target.value)}>
            <option value="all">All scores</option>
            <option value="high">&gt;85% (good)</option>
            <option value="mid">70–85% (ok)</option>
            <option value="low">&lt;70% (poor)</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-[var(--theme-text-muted)] bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-xl px-3 py-2 cursor-pointer">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={e => setVerifiedOnly(e.target.checked)}
              className="accent-[var(--theme-primary)]"
            />
            Verified companies only
          </label>
        </div>
      </div>

      {/* Listing cards */}
      {sorted.length === 0 && (
        <div className="text-center py-16 text-sm text-[var(--theme-text-muted)] opacity-40 italic">No listings in moderation queue.</div>
      )}

      <div className="space-y-4">
        {sorted.map(l => {
          const hrs = hoursInQueue(l.submitted_at);
          return (
            <div
              key={l.id}
              className={`bg-[var(--theme-card)] border-2 rounded-[1.5rem] p-6 transition-all ${
                selected.has(l.id) ? 'border-[var(--theme-primary)] ring-1 ring-[var(--theme-primary)]/20' : 'border-[var(--theme-border)]'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selected.has(l.id)}
                  onChange={() => toggleSelect(l.id)}
                  className="mt-1 rounded border-[var(--theme-border)] accent-[var(--theme-primary)] shrink-0"
                />

                <div className="flex-1 min-w-0">
                  {/* Header row */}
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-[var(--theme-text)]">{l.title}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${TYPE_COLOURS[l.type] || ''}`}>
                      {l.type}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mb-3 text-sm text-[var(--theme-text-muted)] opacity-70">
                    <span className="flex items-center gap-1">
                      {l.company.name}
                      {l.company.verified
                        ? <FiCheckCircle size={12} className="text-blue-400" />
                        : <span className="text-xs opacity-40">(unverified)</span>}
                    </span>
                    <span className={`font-bold ${hrs > 24 ? 'text-rose-400' : 'text-[var(--theme-text-muted)]'}`}>
                      {hrs}h in queue{hrs > 24 ? ' ⚠️' : ''}
                    </span>
                    <SlaCountdown submitted_at={l.submitted_at} />
                  </div>

                  {/* Quality checklist + score */}
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-start">
                    <div className="space-y-1.5">
                      <QualityCheck pass={l.company.has_logo} label="Company has logo" />
                      <QualityCheck pass={l.company.description_words > 50} label={`Company description >50 words (${l.company.description_words} words)`} />
                      <QualityCheck pass={l.listing_description_words > 100} label={`Listing description >100 words (${l.listing_description_words} words)`} />
                      <QualityCheck pass={l.skills_count >= 2} label={`At least 2 skills tagged (${l.skills_count} tagged)`} />
                      <QualityCheck pass={l.salary_present} label="Salary range present" />
                      <QualityCheck pass={l.category_accurate} label="Category accurate" />
                    </div>
                    <div className="text-right sm:pl-6">
                      <p className="text-[10px] text-[var(--theme-text-muted)] opacity-40 uppercase tracking-widest mb-1">Completeness</p>
                      <ScoreBadge score={l.completeness_score} />
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => approveSingle(l.id)}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 transition-colors font-semibold"
                  >
                    <FiCheck size={12} /> Approve
                  </button>
                  <button
                    onClick={() => { setInlineRejectId(l.id); setRejectId(l.id); }}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/20 hover:bg-rose-500/25 transition-colors font-semibold"
                  >
                    <FiX size={12} /> Reject
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-black uppercase tracking-tight italic text-[var(--theme-text)] mb-6">Reject listing</h3>
            <div className="admin-field mb-4">
              <label className="admin-label">Rejection reason</label>
              <select className="admin-select w-full" value={rejectReason} onChange={e => setRejectReason(e.target.value)}>
                {REJECT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="admin-field mb-6">
              <label className="admin-label">Optional note to employer</label>
              <textarea
                className="admin-textarea w-full"
                rows={3}
                placeholder="Provide additional context (optional)…"
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button className="admin-btn--danger flex-1" onClick={rejectSingle}>Reject listing</button>
              <button className="admin-btn--secondary flex-1" onClick={() => { setRejectId(null); setInlineRejectId(null); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
