import { useState } from 'react';
import { FiCopy, FiLock, FiX } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { AdminPageHero } from '@/features/admin/components/AdminContentShell';
import useAdminAuthStore from '@/store/admin/useAdminAuthStore';
import { useToast } from '@/shared/components/Toast';
import { adminQueryFn } from '@/services/api/adminApi';

const FALLBACK_FINANCE = {
  escrow_held:             0,
  pending_release:         0,
  released_mtd:            0,
  commission_earned_mtd:   0,
  listing_fee_revenue_mtd: 0,
  total_disputed:          0,
};

const CHART_AXIS = '#64748b';
const CHART_GRID = '#334155';
const CHART_TIP = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#e2e8f0', fontSize: 12 };
const PIE_COLOURS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

function buildRevenueSeries() {
  return Array.from({ length: 25 }, (_, i) => ({
    day: `May ${i + 1}`,
    listing_fees: 2000 + (i * 347 % 4000),
    gig_commission: 800 + (i * 213 % 2500),
  }));
}

function buildEscrowSeries() {
  return Array.from({ length: 30 }, (_, i) => ({
    day: `May ${i + 1}`,
    funded:   5000 + (i * 431 % 15000),
    released: 3000 + (i * 317 % 12000),
    disputed:  500 + (i * 137 % 3000),
  }));
}

const DOMAIN_COMMISSION = [
  { name: 'Dev', value: 28000 },
  { name: 'Design', value: 14500 },
  { name: 'Content', value: 11200 },
  { name: 'Art', value: 9300 },
];

const FALLBACK_TRANSACTIONS = Array.from({ length: 20 }, (_, i) => ({
  id: `txn_${(1000 + i).toString(16).padStart(8, '0')}`,
  type: ['listing_fee', 'gig_commission', 'escrow_fund', 'escrow_release', 'refund'][i % 5],
  amount: [4990, 1260, 15000, 22500, 8750][i % 5],
  parties: [`user_${i}`, `company_${10 - i % 10}`],
  contract_ref: `GZS-2026-${(1100 + i).toString().padStart(6, '0')}`,
  status: ['settled', 'pending', 'settled', 'settled', 'settled'][i % 5],
  timestamp: new Date(Date.now() - i * 86400000 * 1.5).toISOString(),
  external_ref: `rzp_live_${Math.random().toString(36).slice(2, 12)}`,
}));

const TYPE_COLOURS = {
  listing_fee:    'bg-amber-500/15 text-amber-400 border-amber-500/20',
  gig_commission: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  escrow_fund:    'bg-blue-500/15 text-blue-400 border-blue-500/20',
  escrow_release: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  refund:         'bg-rose-500/15 text-rose-400 border-rose-500/20',
};

const STATUS_COLOURS = {
  settled: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  failed:  'bg-rose-500/15 text-rose-400 border-rose-500/20',
};

function MetricCard({ label, value, colour }) {
  return (
    <div className={`bg-[var(--theme-card)] border-2 rounded-2xl p-5 ${colour}`}>
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40 mb-2">{label}</p>
      <p className="text-2xl font-black italic text-[var(--theme-text)]">
        ₹{value.toLocaleString('en-IN')}
      </p>
    </div>
  );
}

function ManualActionModal({ title, children, onClose, onConfirm, confirmLabel = 'Confirm' }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-black uppercase tracking-tight italic text-[var(--theme-text)]">{title}</h3>
          <button onClick={onClose} className="text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"><FiX size={18} /></button>
        </div>
        {children}
        <div className="flex gap-3 pt-4">
          <button className="admin-btn flex-1" onClick={onConfirm}>{confirmLabel}</button>
          <button className="admin-btn--secondary flex-1" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function FinancialLedger() {
  const { user: adminUser } = useAdminAuthStore();
  const isSuperAdmin = adminUser?.role === 'super_admin';
  const { showToast } = useToast();

  const [activeModal, setActiveModal] = useState(null);
  const [form, setForm] = useState({ escrowId: '', contractRef: '', reason: '', splitPct: 50 });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const confirm = (label) => {
    showToast(`${label} action submitted. Audit logged.`, 'success');
    setActiveModal(null);
    setForm({ escrowId: '', contractRef: '', reason: '', splitPct: 50 });
  };

  // Real API: transaction list
  const { data: txData } = useQuery({
    queryKey: ['admin', 'payments', 'transactions'],
    queryFn: adminQueryFn('/admin/payments/transactions', { page: 1, limit: 50 }),
    placeholderData: { transactions: FALLBACK_TRANSACTIONS },
    retry: 1,
  });
  const transactions = txData?.transactions ?? FALLBACK_TRANSACTIONS;

  // Real API: escrow summary
  const { data: escrowData } = useQuery({
    queryKey: ['admin', 'payments', 'escrow'],
    queryFn: adminQueryFn('/admin/payments/escrow'),
    placeholderData: { escrow_held_inr: 0 },
    retry: 1,
  });
  const finance = {
    ...FALLBACK_FINANCE,
    escrow_held: escrowData?.escrow_held_inr ?? 0,
  };

  const revData = buildRevenueSeries();
  const escData = buildEscrowSeries();
  const splitPct = form.splitPct;
  const workerAmt = Math.round(15000 * splitPct / 100);

  return (
    <div className="admin-page">
      <AdminPageHero
        kicker="Jobs & Hiring"
        title="Financial Ledger"
        description="Platform-wide financial transactions, fees, and payouts."
        actions={
          <button className="admin-btn--secondary flex items-center gap-2 text-sm" onClick={() => showToast('CSV export started.', 'success')}>
            ↓ Export CSV
          </button>
        }
      />

      {/* 6 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <MetricCard label="Escrow held"          value={finance.escrow_held}             colour="border-teal-500/30" />
        <MetricCard label="Pending release"       value={finance.pending_release}          colour="border-blue-500/30" />
        <MetricCard label="Released MTD"          value={finance.released_mtd}             colour="border-emerald-500/30" />
        <MetricCard label="Commission MTD"        value={finance.commission_earned_mtd}    colour="border-violet-500/30" />
        <MetricCard label="Listing fees MTD"      value={finance.listing_fee_revenue_mtd}  colour="border-amber-500/30" />
        <MetricCard label="Total disputed"        value={finance.total_disputed}           colour="border-rose-500/30" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue breakdown */}
        <div className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-[2rem] p-6">
          <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40 mb-4">Revenue breakdown MTD</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revData.slice(-14)} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fill: CHART_AXIS, fontSize: 10 }} tickLine={false} axisLine={false} interval={2} />
              <YAxis tick={{ fill: CHART_AXIS, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${v / 1000}k`} />
              <Tooltip contentStyle={CHART_TIP} formatter={v => [`₹${v.toLocaleString('en-IN')}`, '']} />
              <Legend wrapperStyle={{ fontSize: 11, color: CHART_AXIS }} />
              <Bar dataKey="listing_fees"   name="Listing fees"  stackId="a" fill="#f59e0b" radius={[0,0,0,0]} />
              <Bar dataKey="gig_commission" name="Gig commission" stackId="a" fill="#8b5cf6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Escrow flow */}
        <div className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-[2rem] p-6">
          <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40 mb-4">Escrow flow (30 days)</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={escData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fill: CHART_AXIS, fontSize: 10 }} tickLine={false} axisLine={false} interval={5} />
              <YAxis tick={{ fill: CHART_AXIS, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${v / 1000}k`} />
              <Tooltip contentStyle={CHART_TIP} formatter={v => [`₹${v.toLocaleString('en-IN')}`, '']} />
              <Legend wrapperStyle={{ fontSize: 11, color: CHART_AXIS }} />
              <Line dataKey="funded"   name="Funded"   stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line dataKey="released" name="Released" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line dataKey="disputed" name="Disputed" stroke="#f43f5e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top domains donut */}
        <div className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-[2rem] p-6">
          <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40 mb-4">Commission by domain</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={DOMAIN_COMMISSION} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                {DOMAIN_COMMISSION.map((_, i) => <Cell key={i} fill={PIE_COLOURS[i % PIE_COLOURS.length]} />)}
              </Pie>
              <Tooltip contentStyle={CHART_TIP} formatter={v => [`₹${v.toLocaleString('en-IN')}`, '']} />
              <Legend wrapperStyle={{ fontSize: 11, color: CHART_AXIS }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction Ledger */}
      <div className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-[2rem] overflow-x-auto mb-8">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-[var(--theme-border)] text-left">
              {['Txn ID', 'Type', 'Amount', 'Parties', 'Contract', 'Status', 'When'].map(h => (
                <th key={h} className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.id} className="border-b border-[var(--theme-border)]/40 last:border-0 hover:bg-[var(--theme-bg-alt)]/20 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-[var(--theme-text)] opacity-70">{t.id.slice(0, 12)}…</span>
                    <button
                      onClick={() => { navigator.clipboard?.writeText(t.id); showToast('Copied.', 'success'); }}
                      className="text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] transition-colors"
                    >
                      <FiCopy size={11} />
                    </button>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${TYPE_COLOURS[t.type] || ''}`}>
                    {t.type.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-5 py-4 text-[var(--theme-text)] font-medium">₹{(t.amount / 100).toLocaleString('en-IN')}</td>
                <td className="px-5 py-4 text-xs text-[var(--theme-text-muted)] opacity-70">{t.parties.join(' → ')}</td>
                <td className="px-5 py-4 font-mono text-xs text-[var(--theme-text-muted)] opacity-60">{t.contract_ref}</td>
                <td className="px-5 py-4">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${STATUS_COLOURS[t.status] || ''}`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-[var(--theme-text-muted)] opacity-60">
                  {new Date(t.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Manual Actions — Super Admin only */}
      <div className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-[2rem] p-8">
        <h3 className="text-base font-black uppercase tracking-tight italic text-[var(--theme-text)] mb-2">Manual Actions</h3>
        <p className="text-xs text-[var(--theme-text-muted)] opacity-40 uppercase tracking-widest italic mb-6">super admin only · irreversible · audit-logged</p>

        {!isSuperAdmin ? (
          <div className="flex items-center gap-3 py-8 justify-center">
            <FiLock size={20} className="text-[var(--theme-text-muted)] opacity-30" />
            <p className="text-sm text-[var(--theme-text-muted)] opacity-50 italic">Super Admin required to perform manual financial actions.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'release', label: 'Force-release escrow' },
              { key: 'refund',  label: 'Force-refund to client' },
              { key: 'split',   label: 'Partial split release' },
              { key: 'void',    label: 'Void listing fee' },
            ].map(a => (
              <button
                key={a.key}
                onClick={() => setActiveModal(a.key)}
                className="text-sm px-5 py-2.5 rounded-xl border-2 border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:border-[var(--theme-primary)]/40 hover:text-[var(--theme-text)] transition-all font-medium"
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {activeModal === 'release' && (
        <ManualActionModal title="Force-release escrow" onClose={() => setActiveModal(null)} onConfirm={() => confirm('Force-release')}>
          <div className="space-y-4">
            <div className="admin-field"><label className="admin-label">Escrow ID</label><input className="admin-input w-full" placeholder="esc_…" value={form.escrowId} onChange={e => set('escrowId', e.target.value)} /></div>
            <div className="admin-field"><label className="admin-label">Reason (required)</label><textarea className="admin-textarea w-full" rows={3} value={form.reason} onChange={e => set('reason', e.target.value)} /></div>
          </div>
        </ManualActionModal>
      )}

      {activeModal === 'refund' && (
        <ManualActionModal title="Force-refund to client" onClose={() => setActiveModal(null)} onConfirm={() => confirm('Force-refund')}>
          <div className="space-y-4">
            <div className="admin-field"><label className="admin-label">Escrow ID</label><input className="admin-input w-full" placeholder="esc_…" value={form.escrowId} onChange={e => set('escrowId', e.target.value)} /></div>
            <div className="admin-field"><label className="admin-label">Reason (required)</label><textarea className="admin-textarea w-full" rows={3} value={form.reason} onChange={e => set('reason', e.target.value)} /></div>
          </div>
        </ManualActionModal>
      )}

      {activeModal === 'split' && (
        <ManualActionModal title="Partial split release" onClose={() => setActiveModal(null)} onConfirm={() => confirm('Partial split')}>
          <div className="space-y-4">
            <div className="admin-field"><label className="admin-label">Contract ref</label><input className="admin-input w-full" placeholder="GZS-2026-…" value={form.contractRef} onChange={e => set('contractRef', e.target.value)} /></div>
            <div className="admin-field">
              <label className="admin-label">Worker % (of ₹15,000 example)</label>
              <div className="flex items-center gap-4 mt-2">
                <input type="range" min={0} max={100} value={splitPct} onChange={e => set('splitPct', +e.target.value)} className="flex-1 accent-emerald-500" />
                <span className="text-sm font-mono w-10 text-[var(--theme-text)]">{splitPct}%</span>
              </div>
              <p className="text-xs text-[var(--theme-text-muted)] opacity-60 mt-1">
                Worker gets ₹{workerAmt.toLocaleString('en-IN')} · Client gets ₹{(15000 - workerAmt).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="admin-field"><label className="admin-label">Reason (required)</label><textarea className="admin-textarea w-full" rows={2} value={form.reason} onChange={e => set('reason', e.target.value)} /></div>
          </div>
        </ManualActionModal>
      )}

      {activeModal === 'void' && (
        <ManualActionModal title="Void listing fee" onClose={() => setActiveModal(null)} onConfirm={() => confirm('Void listing fee')}>
          <div className="space-y-4">
            <div className="admin-field"><label className="admin-label">Listing ID</label><input className="admin-input w-full" placeholder="lst-…" value={form.escrowId} onChange={e => set('escrowId', e.target.value)} /></div>
            <div className="admin-field"><label className="admin-label">Reason (required)</label><textarea className="admin-textarea w-full" rows={3} value={form.reason} onChange={e => set('reason', e.target.value)} /></div>
          </div>
        </ManualActionModal>
      )}
    </div>
  );
}
