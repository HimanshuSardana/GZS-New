import { useState, useMemo } from 'react';
import { FiSearch, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { AdminPageHero } from '@/features/admin/components/AdminContentShell';
import useAdminAuthStore from '@/store/admin/useAdminAuthStore';
import { useToast } from '@/shared/components/Toast';
import DomainBadge from '@/shared/components/DomainBadge';

const STATUS_COLOURS = {
  awaiting_escrow:    'bg-amber-500/15 text-amber-400 border-amber-500/20',
  active:             'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  submitted:          'bg-blue-500/15 text-blue-400 border-blue-500/20',
  revision_requested: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  disputed:           'bg-rose-500/15 text-rose-400 border-rose-500/20',
  completed:          'bg-slate-500/15 text-slate-400 border-slate-500/20',
  cancelled:          'bg-slate-500/15 text-slate-300 border-slate-500/20',
};

const ESCROW_COLOURS = {
  funded:   'bg-blue-500/15 text-blue-400 border-blue-500/20',
  held:     'bg-teal-500/15 text-teal-400 border-teal-500/20',
  released: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  disputed: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  pending:  'bg-amber-500/15 text-amber-400 border-amber-500/20',
};

const MOCK_CONTRACTS = [
  { id: 'GZS-2026-000100', client: 'Phantom Studios', worker: 'dev_alex', domain: 'dev', rate: 28000, status: 'active', escrow: 'held', deadline: '2026-06-10T00:00:00Z', scope: 'Unity gameplay integration for Battle Royale mode. 3 milestones.', created_at: '2026-05-01T00:00:00Z' },
  { id: 'GZS-2026-000101', client: 'ArenaX', worker: 'art_wizard', domain: 'art', rate: 12500, status: 'submitted', escrow: 'held', deadline: '2026-05-30T00:00:00Z', scope: '5 character concept art sheets, final render included.', created_at: '2026-05-05T00:00:00Z' },
  { id: 'GZS-2026-000102', client: 'PixelForge', worker: 'sound_pro', domain: 'music', rate: 8000, status: 'revision_requested', escrow: 'held', deadline: '2026-05-28T00:00:00Z', scope: 'Ambient soundtrack for the lobby scene (3 min loop).', created_at: '2026-05-08T00:00:00Z' },
  { id: 'GZS-2026-000103', client: 'GameVault', worker: 'vid_creator', domain: 'content', rate: 5500, status: 'disputed', escrow: 'disputed', deadline: '2026-05-22T00:00:00Z', scope: 'Game trailer video edit (60s, 4K).', created_at: '2026-04-28T00:00:00Z' },
  { id: 'GZS-2026-000104', client: 'NexaGaming', worker: 'ui_artist99', domain: 'design', rate: 18000, status: 'awaiting_escrow', escrow: 'pending', deadline: '2026-06-20T00:00:00Z', scope: 'Full UI kit redesign — 40 screens.', created_at: '2026-05-20T00:00:00Z' },
  { id: 'GZS-2026-000105', client: 'CloudBurst Games', worker: 'unity_dev_k', domain: 'dev', rate: 45000, status: 'active', escrow: 'funded', deadline: '2026-07-01T00:00:00Z', scope: 'Multiplayer backend integration with dedicated server setup.', created_at: '2026-05-10T00:00:00Z' },
  { id: 'GZS-2026-000106', client: 'DawnRift', worker: 'writer_anita', domain: 'content', rate: 4000, status: 'completed', escrow: 'released', deadline: '2026-05-15T00:00:00Z', scope: 'Lore expansion — 5000 words for zone descriptions.', created_at: '2026-04-20T00:00:00Z' },
  { id: 'GZS-2026-000107', client: 'MegaLoot Inc', worker: 'dev_alex', domain: 'dev', rate: 22000, status: 'completed', escrow: 'released', deadline: '2026-05-10T00:00:00Z', scope: 'Payment gateway integration (Razorpay v3 SDK).', created_at: '2026-04-15T00:00:00Z' },
  { id: 'GZS-2026-000108', client: 'GzoneSphere Official', worker: '3d_modeler_v', domain: 'art', rate: 9500, status: 'cancelled', escrow: 'released', deadline: '2026-05-25T00:00:00Z', scope: '10 in-game item 3D models (weapon tier set).', created_at: '2026-05-03T00:00:00Z' },
  { id: 'GZS-2026-000109', client: 'Phantom Studios', worker: 'vid_creator', domain: 'content', rate: 7000, status: 'submitted', escrow: 'held', deadline: '2026-05-27T00:00:00Z', scope: '30s gameplay highlight reel (4K, color graded).', created_at: '2026-05-12T00:00:00Z' },
  { id: 'GZS-2026-000110', client: 'ArenaX', worker: 'sound_pro', domain: 'music', rate: 6000, status: 'active', escrow: 'funded', deadline: '2026-06-05T00:00:00Z', scope: 'Victory/defeat jingles for tournament system (8 variants).', created_at: '2026-05-14T00:00:00Z' },
  { id: 'GZS-2026-000111', client: 'PixelForge', worker: 'ui_artist99', domain: 'design', rate: 11000, status: 'revision_requested', escrow: 'held', deadline: '2026-06-01T00:00:00Z', scope: 'Mobile UI redesign — onboarding flow (12 screens).', created_at: '2026-05-07T00:00:00Z' },
];

function relativeTime(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function isOverdue(iso) {
  return new Date(iso) < Date.now();
}

export default function ContractsManagement() {
  const { user: adminUser } = useAdminAuthStore();
  const isSuperAdmin = adminUser?.role === 'super_admin';
  const { showToast } = useToast();

  const [contracts, setContracts] = useState(MOCK_CONTRACTS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [forceModal, setForceModal] = useState(null); // { id, action: 'complete'|'cancel' }
  const [forceReason, setForceReason] = useState('');

  const filtered = useMemo(() => {
    return contracts.filter(c => {
      const matchSearch = !search.trim() ||
        c.id.toLowerCase().includes(search.toLowerCase()) ||
        c.client.toLowerCase().includes(search.toLowerCase()) ||
        c.worker.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [contracts, search, statusFilter]);

  const executeForce = () => {
    const { id, action } = forceModal;
    setContracts(prev => prev.map(c => c.id === id ? { ...c, status: action === 'complete' ? 'completed' : 'cancelled' } : c));
    showToast(`Contract ${id} force-${action === 'complete' ? 'completed' : 'cancelled'}.`, 'success');
    setForceModal(null);
    setForceReason('');
  };

  return (
    <div className="admin-page">
      <AdminPageHero kicker="Jobs & Hiring" title="Contracts" description="Active contracts, milestones, and completion records." />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] opacity-50" />
          <input
            className="admin-input pl-8"
            placeholder="Search ref, client, worker…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]">
              <FiX size={13} />
            </button>
          )}
        </div>
        <select
          className="admin-select"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          {Object.keys(STATUS_COLOURS).map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-[2rem] overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-[var(--theme-border)] text-left">
              {['Contract ref', 'Client → Worker', 'Rate', 'Status', 'Escrow', 'Deadline', 'Actions'].map(h => (
                <th key={h} className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-[var(--theme-text-muted)] opacity-40 italic">No contracts found.</td></tr>
            )}
            {filtered.map(c => (
              <>
                <tr key={c.id} className="border-b border-[var(--theme-border)]/40 last:border-0 hover:bg-[var(--theme-bg-alt)]/20 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-[var(--theme-text)]">{c.id}</td>
                  <td className="px-5 py-4">
                    <p className="text-[var(--theme-text)] text-sm">{c.client} → {c.worker}</p>
                    <DomainBadge domain={c.domain} />
                  </td>
                  <td className="px-5 py-4 text-[var(--theme-text)] font-medium">₹{c.rate.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${STATUS_COLOURS[c.status] || ''}`}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${ESCROW_COLOURS[c.escrow] || ''}`}>
                      {c.escrow}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs ${isOverdue(c.deadline) && !['completed', 'cancelled'].includes(c.status) ? 'text-rose-400 font-bold' : 'text-[var(--theme-text-muted)] opacity-60'}`}>
                      {new Date(c.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {isOverdue(c.deadline) && !['completed', 'cancelled'].includes(c.status) && ' ⚠️'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-[var(--theme-bg-alt)] text-[var(--theme-text-muted)] border border-[var(--theme-border)] hover:text-[var(--theme-text)] transition-colors flex items-center gap-1"
                      >
                        View {expandedId === c.id ? <FiChevronUp size={11} /> : <FiChevronDown size={11} />}
                      </button>
                      {isSuperAdmin && !['completed', 'cancelled'].includes(c.status) && (
                        <>
                          <button
                            onClick={() => setForceModal({ id: c.id, action: 'complete' })}
                            className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 transition-colors"
                          >
                            Force-complete
                          </button>
                          <button
                            onClick={() => setForceModal({ id: c.id, action: 'cancel' })}
                            className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/20 hover:bg-rose-500/25 transition-colors"
                          >
                            Force-cancel
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedId === c.id && (
                  <tr key={`${c.id}-detail`}>
                    <td colSpan={7} className="px-5 pb-6">
                      <div className="mt-4 border-t border-[var(--theme-border)] pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40 mb-1">Scope</p>
                          <p className="text-[var(--theme-text)] opacity-80">{c.scope}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40 mb-1">Agreed Rate</p>
                          <p className="text-[var(--theme-text)] font-bold text-lg">₹{c.rate.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40 mb-1">Created</p>
                          <p className="text-[var(--theme-text)] opacity-80">{relativeTime(c.created_at)}</p>
                          <p className="text-[10px] text-[var(--theme-text-muted)] opacity-50">Escrow: <span className="capitalize">{c.escrow}</span></p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Force action modal */}
      {forceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-black uppercase tracking-tight italic text-[var(--theme-text)] mb-6">
              Force-{forceModal.action === 'complete' ? 'complete' : 'cancel'} contract
            </h3>
            <p className="text-sm text-[var(--theme-text-muted)] opacity-60 mb-4">
              Contract: <span className="font-mono text-[var(--theme-text)]">{forceModal.id}</span>
            </p>
            <div className="admin-field mb-6">
              <label className="admin-label">Reason (required)</label>
              <textarea
                className="admin-textarea w-full"
                rows={3}
                placeholder="Provide a clear reason for this forced action…"
                value={forceReason}
                onChange={e => setForceReason(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button
                className={`flex-1 ${forceModal.action === 'complete' ? 'admin-btn' : 'admin-btn--danger'}`}
                disabled={!forceReason.trim()}
                onClick={executeForce}
              >
                Confirm force-{forceModal.action === 'complete' ? 'complete' : 'cancel'}
              </button>
              <button className="admin-btn--secondary flex-1" onClick={() => { setForceModal(null); setForceReason(''); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
