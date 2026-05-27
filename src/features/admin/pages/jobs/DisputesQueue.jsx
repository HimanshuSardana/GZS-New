import { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { AdminPageHero } from '@/features/admin/components/AdminContentShell';
import useAdminAuthStore from '@/store/admin/useAdminAuthStore';
import { useToast } from '@/shared/components/Toast';
import DomainBadge from '@/shared/components/DomainBadge';

function SlaCountdown({ deadline }) {
  const [now] = useState(Date.now);
  const hoursLeft = (new Date(deadline) - now) / 3_600_000;
  if (hoursLeft > 36) return <span className="text-emerald-400 text-xs font-bold">{Math.floor(hoursLeft)}h remaining</span>;
  if (hoursLeft > 12) return <span className="text-amber-400 text-xs font-bold">{Math.floor(hoursLeft)}h remaining</span>;
  if (hoursLeft > 0)  return <span className="text-rose-400 text-xs font-bold animate-pulse">{Math.ceil(hoursLeft)}h remaining</span>;
  return <span className="text-rose-400 text-xs font-bold animate-pulse">OVERDUE</span>;
}

const MOCK_DISPUTES = [
  { id: 'd1', contract_ref: 'GZS-2026-001234', type: 'Non-delivery', client: 'Phantom Studios', worker: 'dev_alex', worker_domain: 'dev', raised_at: '2026-05-19T10:00:00Z', sla_deadline: '2026-05-21T22:00:00Z', assigned_admin: null, escrow_inr: 15000, status: 'open' },
  { id: 'd2', contract_ref: 'GZS-2026-001198', type: 'Work not as described', client: 'GameVault', worker: 'art_wizard', worker_domain: 'art', raised_at: '2026-05-17T10:00:00Z', sla_deadline: '2026-05-19T10:00:00Z', assigned_admin: 'admin_ryan', escrow_inr: 8500, status: 'open' },
  { id: 'd3', contract_ref: 'GZS-2026-001201', type: 'Scope creep', client: 'NexaGaming', worker: 'sound_pro', worker_domain: 'music', raised_at: '2026-05-20T08:00:00Z', sla_deadline: '2026-05-22T08:00:00Z', assigned_admin: null, escrow_inr: 5000, status: 'open' },
  { id: 'd4', contract_ref: 'GZS-2026-001155', type: 'Payment dispute', client: 'ArenaX', worker: 'vid_creator', worker_domain: 'content', raised_at: '2026-05-16T14:00:00Z', sla_deadline: '2026-05-18T14:00:00Z', assigned_admin: 'admin_priya', escrow_inr: 22000, status: 'open' },
  { id: 'd5', contract_ref: 'GZS-2026-001178', type: 'Non-delivery', client: 'CloudBurst Games', worker: 'unity_dev_k', worker_domain: 'dev', raised_at: '2026-05-21T09:00:00Z', sla_deadline: '2026-05-24T09:00:00Z', assigned_admin: null, escrow_inr: 35000, status: 'open' },
  { id: 'd6', contract_ref: 'GZS-2026-001142', type: 'Miscommunication', client: 'DawnRift', worker: 'ui_artist99', worker_domain: 'design', raised_at: '2026-05-18T11:00:00Z', sla_deadline: '2026-05-20T11:00:00Z', assigned_admin: 'admin_ryan', escrow_inr: 12000, status: 'open' },
  { id: 'd7', contract_ref: 'GZS-2026-001210', type: 'Client misuse', client: 'MegaLoot Inc', worker: 'writer_anita', worker_domain: 'content', raised_at: '2026-05-22T07:00:00Z', sla_deadline: '2026-05-25T07:00:00Z', assigned_admin: null, escrow_inr: 4500, status: 'open' },
  { id: 'd8', contract_ref: 'GZS-2026-001189', type: 'Low quality', client: 'PixelForge', worker: '3d_modeler_v', worker_domain: 'art', raised_at: '2026-05-19T15:00:00Z', sla_deadline: '2026-05-21T15:00:00Z', assigned_admin: 'admin_priya', escrow_inr: 18000, status: 'open' },
];

const TYPE_COLOURS = {
  'Non-delivery':        'bg-rose-500/15 text-rose-400 border-rose-500/20',
  'Work not as described':'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'Scope creep':         'bg-blue-500/15 text-blue-400 border-blue-500/20',
  'Payment dispute':     'bg-violet-500/15 text-violet-400 border-violet-500/20',
  Miscommunication:      'bg-slate-500/15 text-slate-400 border-slate-500/20',
  'Client misuse':       'bg-amber-500/15 text-amber-300 border-amber-500/20',
  'Low quality':         'bg-rose-500/15 text-rose-300 border-rose-500/20',
};

const RULING_CATEGORIES = ['scope_creep', 'low_quality', 'miscommunication', 'non_delivery', 'client_misuse'];

function DisputeDetail({ dispute, onClose, adminUsername, isSuperAdmin }) {
  const { showToast } = useToast();
  const [ruling, setRuling] = useState('full_worker');
  const [splitPct, setSplitPct] = useState(50);
  const [explanation, setExplanation] = useState('');
  const [categories, setCategories] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const workerPct = ruling === 'full_worker' ? 100 : ruling === 'full_client' ? 0 : splitPct;
  const clientPct = 100 - workerPct;
  const workerAmt = Math.round(dispute.escrow_inr * workerPct / 100);
  const clientAmt = dispute.escrow_inr - workerAmt;

  const toggleCat = (cat) => setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);

  const submitRuling = () => {
    showToast('Ruling submitted. Payments processing.', 'success');
    setConfirmOpen(false);
    onClose();
  };

  return (
    <div className="mt-4 border-t border-[var(--theme-border)] pt-6 space-y-6">
      {/* Section 1: Contract Summary */}
      <div>
        <h4 className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40 mb-3">Contract Summary</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div><p className="text-[var(--theme-text-muted)] text-xs">Scope</p><p className="text-[var(--theme-text)] font-medium">Custom integration work</p></div>
          <div><p className="text-[var(--theme-text-muted)] text-xs">Rate</p><p className="text-[var(--theme-text)] font-medium">₹{dispute.escrow_inr.toLocaleString('en-IN')}</p></div>
          <div><p className="text-[var(--theme-text-muted)] text-xs">Client</p><p className="text-[var(--theme-text)] font-medium">{dispute.client}</p></div>
          <div><p className="text-[var(--theme-text-muted)] text-xs">Worker</p><p className="text-[var(--theme-text)] font-medium">{dispute.worker}</p></div>
        </div>
      </div>

      {/* Section 2: Deliverable */}
      <div>
        <h4 className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40 mb-3">Submitted Deliverable</h4>
        <div className="flex gap-3">
          {['deliverable_v1.zip', 'screenshot_proof.png'].map(f => (
            <a key={f} href="#" className="flex items-center gap-1.5 text-xs text-[var(--theme-primary)] hover:underline bg-[var(--theme-bg-alt)] px-3 py-2 rounded-lg border border-[var(--theme-border)]">
              ↓ {f}
            </a>
          ))}
        </div>
        <p className="text-xs text-[var(--theme-text-muted)] opacity-50 mt-2">Submitted {new Date(dispute.raised_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
      </div>

      {/* Section 3: Dispute statement */}
      <div>
        <h4 className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40 mb-3">Client's Dispute Statement</h4>
        <div className="bg-[var(--theme-bg-alt)]/40 rounded-xl p-4 text-sm text-[var(--theme-text)] opacity-80">
          <p className="font-semibold mb-1">{dispute.type}</p>
          <p className="text-[var(--theme-text-muted)] opacity-70">The delivered work does not meet the agreed specifications. Significant portions are missing or below quality standards.</p>
        </div>
      </div>

      {/* Section 4: Worker response */}
      <div>
        <h4 className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40 mb-3">Worker's Response</h4>
        {dispute.id === 'd1' || dispute.id === 'd5' ? (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-amber-300 text-xs">
            ⚠️ No response submitted — auto-ruling in client's favour may apply
          </div>
        ) : (
          <div className="bg-[var(--theme-bg-alt)]/40 rounded-xl p-4 text-sm text-[var(--theme-text)] opacity-80">
            All deliverables were completed per the original scope. Additional requests were outside the agreed contract.
          </div>
        )}
      </div>

      {/* Section 5: Ruling */}
      <div>
        <h4 className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40 mb-4">Ruling Interface</h4>
        <div className="space-y-4">
          {/* Radio options */}
          {[
            { val: 'full_worker', label: 'Full release to worker (100%)' },
            { val: 'full_client', label: 'Full refund to client (0%)' },
            { val: 'custom', label: 'Custom split' },
          ].map(opt => (
            <label key={opt.val} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name={`ruling-${dispute.id}`}
                value={opt.val}
                checked={ruling === opt.val}
                onChange={() => setRuling(opt.val)}
                className="accent-[var(--theme-primary)]"
              />
              <span className="text-sm text-[var(--theme-text)]">{opt.label}</span>
            </label>
          ))}

          {ruling === 'custom' && (
            <div className="pl-6 space-y-2">
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={splitPct}
                  onChange={e => setSplitPct(+e.target.value)}
                  className="flex-1 accent-emerald-500"
                />
                <span className="text-sm font-mono text-[var(--theme-text)] w-32 text-right">
                  Worker {workerPct}% · Client {clientPct}%
                </span>
              </div>
              <p className="text-xs text-[var(--theme-text-muted)] opacity-60">
                Worker gets ₹{workerAmt.toLocaleString('en-IN')} · Client gets ₹{clientAmt.toLocaleString('en-IN')}
              </p>
            </div>
          )}

          {/* Explanation */}
          <div className="admin-field">
            <label className="admin-label">Ruling explanation (required, 300 chars max)</label>
            <textarea
              className="admin-textarea w-full"
              rows={3}
              maxLength={300}
              placeholder="Explain the basis for this ruling…"
              value={explanation}
              onChange={e => setExplanation(e.target.value)}
            />
            <p className="text-[10px] text-[var(--theme-text-muted)] opacity-40 mt-1 text-right">{explanation.length}/300</p>
          </div>

          {/* Category tags */}
          <div className="admin-field">
            <label className="admin-label">Internal category tags</label>
            <div className="flex flex-wrap gap-2">
              {RULING_CATEGORIES.map(cat => (
                <label key={cat} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${
                  categories.includes(cat)
                    ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]'
                    : 'border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:border-[var(--theme-primary)]/30'
                }`}>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={categories.includes(cat)}
                    onChange={() => toggleCat(cat)}
                  />
                  {cat.replace('_', ' ')}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              className="admin-btn"
              disabled={!explanation.trim()}
              onClick={() => setConfirmOpen(true)}
            >
              Submit Ruling
            </button>
            <button className="admin-btn--ghost" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
            <p className="text-[var(--theme-text)] font-semibold mb-2">Submit ruling?</p>
            <p className="text-sm text-[var(--theme-text-muted)] opacity-60 mb-6">
              This triggers payment processing. Both parties notified. Cannot be undone.
            </p>
            <div className="flex gap-3">
              <button className="admin-btn flex-1" onClick={submitRuling}>Confirm</button>
              <button className="admin-btn--secondary flex-1" onClick={() => setConfirmOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DisputesQueue() {
  const { user: adminUser } = useAdminAuthStore();
  const isSuperAdmin = adminUser?.role === 'super_admin';
  const { showToast } = useToast();
  const [disputes, setDisputes] = useState(MOCK_DISPUTES);
  const [expandedId, setExpandedId] = useState(null);
  const [now] = useState(Date.now);

  const openCount = disputes.filter(d => d.status === 'open').length;
  const overdueCount = disputes.filter(d => new Date(d.sla_deadline) < now).length;

  const assignToMe = (id) => {
    setDisputes(prev => prev.map(d => d.id === id ? { ...d, assigned_admin: adminUser?.username || 'me' } : d));
    showToast(`Dispute ${id} assigned to you.`, 'success');
  };

  return (
    <div className="admin-page">
      <AdminPageHero kicker="Jobs & Hiring" title="Disputes" description="Open disputes between employers and freelancers requiring admin review." />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Open disputes', value: openCount, colour: 'text-rose-400' },
          { label: 'Avg resolution', value: '28h', colour: 'text-[var(--theme-text)]' },
          { label: '% worker wins', value: '42%', colour: 'text-emerald-400' },
          { label: 'Overdue', value: overdueCount, colour: overdueCount > 0 ? 'text-rose-400 animate-pulse' : 'text-[var(--theme-text)]' },
        ].map(c => (
          <div key={c.label} className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-2xl p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40 mb-2">{c.label}</p>
            <p className={`text-3xl font-black italic ${c.colour}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Queue table */}
      <div className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-[2rem] overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-[var(--theme-border)] text-left">
              {['Contract', 'Type', 'Client', 'Worker', 'Raised', 'SLA', 'Assigned', 'Escrow', 'Actions'].map(h => (
                <th key={h} className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {disputes.map(d => (
              <>
                <tr key={d.id} className="border-b border-[var(--theme-border)]/40 last:border-0 hover:bg-[var(--theme-bg-alt)]/20 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-[var(--theme-text)]">{d.contract_ref}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${TYPE_COLOURS[d.type] || 'bg-slate-500/15 text-slate-400 border-slate-500/20'}`}>
                      {d.type}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[var(--theme-text)]">{d.client}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[var(--theme-text)]">{d.worker}</span>
                      <DomainBadge domain={d.worker_domain} />
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-[var(--theme-text-muted)] opacity-60">
                    {new Date(d.raised_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="px-5 py-4"><SlaCountdown deadline={d.sla_deadline} /></td>
                  <td className="px-5 py-4">
                    {d.assigned_admin
                      ? <span className="text-xs text-[var(--theme-text-muted)]">{d.assigned_admin}</span>
                      : <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/20 font-bold">Unassigned</span>}
                  </td>
                  <td className="px-5 py-4 text-[var(--theme-text)] font-medium">₹{d.escrow_inr.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {!d.assigned_admin && (
                        <button onClick={() => assignToMe(d.id)} className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25 transition-colors">
                          Assign to me
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-[var(--theme-bg-alt)] text-[var(--theme-text-muted)] border border-[var(--theme-border)] hover:text-[var(--theme-text)] transition-colors flex items-center gap-1"
                      >
                        Review {expandedId === d.id ? <FiChevronUp size={11} /> : <FiChevronDown size={11} />}
                      </button>
                      {isSuperAdmin && (
                        <button
                          onClick={() => showToast(`Dispute ${d.contract_ref} escalated.`, 'success')}
                          className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/20 hover:bg-rose-500/25 transition-colors"
                        >
                          Escalate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedId === d.id && (
                  <tr key={`${d.id}-detail`}>
                    <td colSpan={9} className="px-5 pb-6">
                      <DisputeDetail
                        dispute={d}
                        onClose={() => setExpandedId(null)}
                        adminUsername={adminUser?.username}
                        isSuperAdmin={isSuperAdmin}
                      />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
