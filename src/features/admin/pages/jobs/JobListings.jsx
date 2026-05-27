import { useState, useMemo } from 'react';
import { FiCheckCircle, FiSearch, FiX } from 'react-icons/fi';
import { AdminPageHero } from '@/features/admin/components/AdminContentShell';
import { useToast } from '@/shared/components/Toast';

const MOCK_LISTINGS = [
  { id: 'lst-001', title: 'Senior Unity Developer', type: 'Full-time', company: { name: 'Phantom Studios', verified: true }, status: 'Live', applications: 24, views: 340, listing_fee_paid: 49900, posted_at: '2026-05-10T00:00:00Z', closes_at: '2026-06-10T00:00:00Z' },
  { id: 'lst-002', title: '3D Character Artist', type: 'Freelance', company: { name: 'PixelForge', verified: false }, status: 'Pending Review', applications: 0, views: 0, listing_fee_paid: null, posted_at: '2026-05-19T00:00:00Z', closes_at: null },
  { id: 'lst-003', title: 'Esports Tournament Organiser', type: 'Internship', company: { name: 'ArenaX', verified: true }, status: 'Live', applications: 8, views: 120, listing_fee_paid: 29900, posted_at: '2026-05-15T00:00:00Z', closes_at: '2026-06-15T00:00:00Z' },
  { id: 'lst-004', title: 'Game QA Tester', type: 'Playtesting', company: { name: 'CloudBurst Games', verified: true }, status: 'Pending Review', applications: 0, views: 0, listing_fee_paid: null, posted_at: '2026-05-18T00:00:00Z', closes_at: null },
  { id: 'lst-005', title: 'Backend Engineer (Go)', type: 'Full-time', company: { name: 'NexaGaming', verified: false }, status: 'Flagged', applications: 3, views: 45, listing_fee_paid: 49900, posted_at: '2026-05-08T00:00:00Z', closes_at: '2026-06-08T00:00:00Z' },
  { id: 'lst-006', title: 'UI/UX Designer', type: 'Freelance', company: { name: 'PixelForge', verified: false }, status: 'Draft', applications: 0, views: 0, listing_fee_paid: null, posted_at: '2026-05-20T00:00:00Z', closes_at: null },
  { id: 'lst-007', title: 'Community Manager', type: 'Full-time', company: { name: 'ArenaX', verified: true }, status: 'Closed', applications: 37, views: 512, listing_fee_paid: 49900, posted_at: '2026-04-01T00:00:00Z', closes_at: '2026-05-01T00:00:00Z' },
  { id: 'lst-008', title: 'Mobile Game Dev (Flutter)', type: 'Full-time', company: { name: 'Phantom Studios', verified: true }, status: 'Expired', applications: 11, views: 198, listing_fee_paid: 49900, posted_at: '2026-03-15T00:00:00Z', closes_at: '2026-04-15T00:00:00Z' },
  { id: 'lst-009', title: 'Social Media Intern', type: 'Internship', company: { name: 'GzoneSphere Official', verified: true }, status: 'Live', applications: 19, views: 280, listing_fee_paid: 29900, posted_at: '2026-05-12T00:00:00Z', closes_at: '2026-06-12T00:00:00Z' },
  { id: 'lst-010', title: 'Narrative Writer (RPG)', type: 'Freelance', company: { name: 'DawnRift', verified: false }, status: 'Rejected', applications: 0, views: 12, listing_fee_paid: null, posted_at: '2026-05-17T00:00:00Z', closes_at: null },
];

const STATUS_COLOURS = {
  Live:            'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  'Pending Review':'bg-amber-500/15 text-amber-400 border-amber-500/20',
  Draft:           'bg-slate-500/15 text-slate-400 border-slate-500/20',
  Closed:          'bg-slate-500/15 text-slate-400 border-slate-500/20',
  Expired:         'bg-slate-500/15 text-slate-300 border-slate-500/20',
  Flagged:         'bg-rose-500/15 text-rose-400 border-rose-500/20',
  Rejected:        'bg-rose-500/15 text-rose-300 border-rose-500/20',
};

const TYPE_COLOURS = {
  'Full-time':  'bg-blue-500/15 text-blue-400 border-blue-500/20',
  Internship:   'bg-teal-500/15 text-teal-400 border-teal-500/20',
  Freelance:    'bg-violet-500/15 text-violet-400 border-violet-500/20',
  Playtesting:  'bg-amber-500/15 text-amber-400 border-amber-500/20',
};

const REJECT_REASONS = ['Too vague', 'Incomplete', 'Prohibited content', 'Wrong category', 'Other'];

function relativeTime(iso) {
  if (!iso) return '—';
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function hoursInQueue(iso) {
  return Math.floor((Date.now() - new Date(iso)) / 3_600_000);
}

function Pill({ label, colourClass }) {
  return (
    <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${colourClass}`}>
      {label}
    </span>
  );
}

export default function JobListings() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('Too vague');
  const [rejectNote, setRejectNote] = useState('');
  const [listings, setListings] = useState(MOCK_LISTINGS);

  const pendingCount = listings.filter(l => l.status === 'Pending Review').length;

  const filtered = useMemo(() => {
    let rows = activeTab === 'pending'
      ? listings.filter(l => l.status === 'Pending Review').sort((a, b) => new Date(a.posted_at) - new Date(b.posted_at))
      : listings;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(l => l.title.toLowerCase().includes(q) || l.company.name.toLowerCase().includes(q));
    }
    return rows;
  }, [listings, activeTab, search]);

  const approve = (id) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'Live' } : l));
    showToast('Listing approved and set to Live.', 'success');
  };

  const reject = () => {
    setListings(prev => prev.map(l => l.id === rejectId ? { ...l, status: 'Rejected' } : l));
    showToast(`Listing rejected: ${rejectReason}.`, 'success');
    setRejectId(null);
    setRejectNote('');
  };

  const flag = (id) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'Flagged' } : l));
    showToast('Listing flagged for review.', 'success');
  };

  const forceClose = (id) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'Closed' } : l));
    showToast('Listing force-closed.', 'success');
  };

  return (
    <div className="admin-page">
      <AdminPageHero kicker="Jobs & Hiring" title="Listings" description="Manage all job listings posted on the platform." />

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        {[
          { id: 'all', label: 'All Listings', count: listings.length },
          { id: 'pending', label: 'Pending Review', count: pendingCount },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
              activeTab === tab.id
                ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]'
                : 'border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:border-[var(--theme-primary)]/30'
            }`}
          >
            {tab.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
              activeTab === tab.id ? 'bg-[var(--theme-primary)]/20 text-[var(--theme-primary)]' : 'bg-[var(--theme-border)] text-[var(--theme-text-muted)]'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] opacity-50" />
        <input
          className="admin-input pl-9 w-full"
          placeholder="Search title or company…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]">
            <FiX size={14} />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-[2rem] overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-[var(--theme-border)] text-left">
              {['Title', 'Company', 'Status', 'Apps', 'Views', 'Fee', 'Posted', 'Actions'].map(h => (
                <th key={h} className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-[var(--theme-text-muted)] opacity-40 italic">No listings found.</td></tr>
            )}
            {filtered.map(l => {
              const hrs = hoursInQueue(l.posted_at);
              return (
                <tr key={l.id} className="border-b border-[var(--theme-border)]/40 last:border-0 hover:bg-[var(--theme-bg-alt)]/20 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[var(--theme-text)]">{l.title}</p>
                    <Pill label={l.type} colourClass={TYPE_COLOURS[l.type] || ''} />
                    {activeTab === 'pending' && (
                      <p className={`text-[10px] font-bold mt-1 ${hrs > 24 ? 'text-rose-400' : 'text-[var(--theme-text-muted)] opacity-60'}`}>
                        {hrs}h in queue{hrs > 24 ? ' ⚠️' : ''}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[var(--theme-text)]">{l.company.name}</span>
                      {l.company.verified
                        ? <FiCheckCircle size={13} className="text-blue-400" />
                        : <span className="text-[var(--theme-text-muted)] opacity-30 text-xs">—</span>}
                    </div>
                    {activeTab === 'pending' && (
                      <div className="mt-1.5 w-24">
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${l.completeness_score > 85 ? 'bg-emerald-400' : l.completeness_score > 70 ? 'bg-amber-400' : 'bg-rose-400'}`}
                            style={{ width: `${l.completeness_score || 72}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-[var(--theme-text-muted)] opacity-50 mt-0.5">{l.completeness_score || 72}% complete</p>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <Pill label={l.status} colourClass={STATUS_COLOURS[l.status] || ''} />
                  </td>
                  <td className="px-5 py-4 text-[var(--theme-text-muted)]">{l.applications}</td>
                  <td className="px-5 py-4 text-[var(--theme-text-muted)]">{l.views}</td>
                  <td className="px-5 py-4 text-[var(--theme-text-muted)]">
                    {l.listing_fee_paid ? `₹${(l.listing_fee_paid / 100).toLocaleString('en-IN')}` : <span className="text-xs italic opacity-50">Waived</span>}
                  </td>
                  <td className="px-5 py-4 text-[var(--theme-text-muted)] text-xs">{relativeTime(l.posted_at)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button className="text-xs px-2.5 py-1 rounded-lg bg-[var(--theme-bg-alt)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] border border-[var(--theme-border)] transition-colors">View</button>
                      {l.status === 'Pending Review' && <>
                        <button onClick={() => approve(l.id)} className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 transition-colors">Approve</button>
                        <button onClick={() => setRejectId(l.id)} className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/20 hover:bg-rose-500/25 transition-colors">Reject</button>
                      </>}
                      {l.status === 'Live' && <>
                        <button onClick={() => flag(l.id)} className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/20 hover:bg-amber-500/25 transition-colors">Flag</button>
                        <button onClick={() => forceClose(l.id)} className="text-xs px-2.5 py-1 rounded-lg bg-slate-500/15 text-slate-400 border border-slate-500/20 hover:bg-slate-500/25 transition-colors">Force-close</button>
                      </>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
              <button className="admin-btn--danger flex-1" onClick={reject}>Reject listing</button>
              <button className="admin-btn--secondary flex-1" onClick={() => setRejectId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
