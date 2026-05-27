import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiAlertTriangle, FiChevronRight, FiExternalLink,
  FiSearch, FiUserPlus, FiActivity, FiCheck, FiXCircle,
  FiSettings, FiFilter, FiSave, FiAlertCircle,
} from 'react-icons/fi';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import { useToast } from '@/shared/components/Toast';
import { AdminPageHero, AdminPanel, AdminEmptyState } from '../components/AdminContentShell';
import { MOCK_VERIFICATION_QUEUE, AVAILABLE_REVIEWERS } from '@/shared/data/adminData';
import DomainBadge from '@/shared/components/DomainBadge';

const PROOF_TYPES = ['All', 'Project demo', 'Academic certificate', 'Employer letter', 'Live test', 'Portfolio link', 'Peer review'];

const POLICY_DOMAINS = ['dev', 'esports', 'content', 'business', 'art', 'writing', 'audio'];
const PROOF_TYPE_OPTIONS = [
  { value: 'project_demo',          label: 'Project Demo' },
  { value: 'code_repository',       label: 'Code Repository' },
  { value: 'academic_certificate',  label: 'Academic Certificate' },
  { value: 'employer_letter',       label: 'Employer Letter' },
  { value: 'live_test',             label: 'Live Test' },
  { value: 'portfolio_link',        label: 'Portfolio Link' },
  { value: 'peer_review',           label: 'Peer Review' },
];

const INIT_POLICIES = {
  dev:      { min_proof_types: ['code_repository', 'project_demo'], max_review_days: 7,  assignment_mode: 'manual'      },
  esports:  { min_proof_types: ['portfolio_link', 'live_test'],     max_review_days: 5,  assignment_mode: 'manual'      },
  content:  { min_proof_types: ['portfolio_link'],                   max_review_days: 7,  assignment_mode: 'manual'      },
  business: { min_proof_types: ['employer_letter'],                  max_review_days: 10, assignment_mode: 'round_robin' },
  art:      { min_proof_types: ['portfolio_link', 'project_demo'],  max_review_days: 7,  assignment_mode: 'manual'      },
  writing:  { min_proof_types: ['portfolio_link', 'peer_review'],   max_review_days: 7,  assignment_mode: 'manual'      },
  audio:    { min_proof_types: ['portfolio_link', 'project_demo'],  max_review_days: 7,  assignment_mode: 'manual'      },
};

const PRIORITY_META = {
  High: { color: 'bg-[var(--status-error-soft)] text-[var(--status-error)] border-[var(--status-error)]/20', dot: 'bg-[var(--status-error)]', label: 'High' },
  Normal: { color: 'bg-[var(--theme-primary)]/5 text-[var(--theme-primary)] border-[var(--theme-primary)]/20', dot: 'bg-[var(--theme-primary)]', label: 'Normal' },
  Urgent: { color: 'bg-[var(--status-warning-soft)] text-[var(--status-warning)] border-[var(--status-warning)]/20', dot: 'bg-[var(--status-warning)]', label: 'Urgent' },
};

const STATUS_META = {
  Pending: { color: 'bg-[var(--theme-bg-alt)] text-[var(--theme-text-muted)] border-[var(--theme-border)]', tone: 'info' },
  'In Review': { color: 'bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] border-[var(--theme-primary)]/20', tone: 'info' },
  Approved: { color: 'bg-[var(--status-success-soft)] text-[var(--status-success)] border-[var(--status-success)]/20', tone: 'success' },
  Rejected: { color: 'bg-[var(--status-error-soft)] text-[var(--status-error)] border-[var(--status-error)]/20', tone: 'danger' },
};

const DOMAIN_META = {
  dev:      { label: 'Dev',      color: 'bg-teal-500/10 text-teal-400 border-teal-500/20',     hex: '#00e5a0' },
  esports:  { label: 'Esports',  color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',     hex: '#ff4d6d' },
  content:  { label: 'Content',  color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', hex: '#ff9f2e' },
  business: { label: 'Business', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',     hex: '#3b9eff' },
  art:      { label: 'Art',      color: 'bg-pink-500/10 text-pink-400 border-pink-500/20',     hex: '#ff6eb4' },
  writing:  { label: 'Writing',  color: 'bg-green-500/10 text-green-400 border-green-500/20',  hex: '#4ade80' },
  audio:    { label: 'Audio',    color: 'bg-violet-500/10 text-violet-400 border-violet-500/20', hex: '#a78bfa' },
};

const COMPONENT_MOUNT_TIME = Date.now();

function formatRelativeTime(isoString, now) {
  const days = Math.floor((now - new Date(isoString).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export default function VerificationQueue() {
  usePageTheme('admin');
  const { showToast } = useToast();
  const now = COMPONENT_MOUNT_TIME;

  // State
  const [queue, setQueue] = useState(MOCK_VERIFICATION_QUEUE);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [domainFilter, setDomainFilter] = useState('All');
  const [proofFilter, setProofFilter] = useState('All');
  
  const [activeRow, setActiveRow] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [moreInfoMessage, setMoreInfoMessage] = useState('');
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [selectedReviewerId, setSelectedReviewerId] = useState('');
  const [showOnlyUnassigned, setShowOnlyUnassigned] = useState(false);

  // Domain policies (Task 5)
  const [policiesOpen, setPoliciesOpen] = useState(false);
  const [policies, setPolicies] = useState(INIT_POLICIES);
  const [policiesDraft, setPoliciesDraft] = useState(INIT_POLICIES);
  const [activePolicyDomain, setActivePolicyDomain] = useState('dev');

  // Derived Data
  const filteredRows = useMemo(() => {
    return queue.filter(item => {
      const matchesSearch = item.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.skillName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesDomain = domainFilter === 'All' || item.subProfileDomain === domainFilter;
      const matchesProof = proofFilter === 'All' || item.proofType === proofFilter;
      const matchesAssigned = !showOnlyUnassigned || !item.assignedReviewer;
      return matchesSearch && matchesStatus && matchesDomain && matchesProof && matchesAssigned;
    });
  }, [queue, searchTerm, statusFilter, domainFilter, proofFilter, showOnlyUnassigned]);

  const stats = useMemo(() => ({
    total:    queue.length,
    pending:  queue.filter(r => r.status === 'Pending').length,
    inReview: queue.filter(r => r.status === 'In Review' || r.status === 'In review').length,
    approved: queue.filter(r => r.status === 'Approved' || r.status === 'Actioned').length,
    rejected: queue.filter(r => r.status === 'Rejected' || r.status === 'Dismissed').length,
  }), [queue]);

  const auditLog = useMemo(() => {
    const logs = [];
    queue.forEach(item => {
      if (item.auditTrail) {
        item.auditTrail.forEach(entry => logs.push({ ...entry, username: item.username, skill: item.skillName }));
      }
    });
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
  }, [queue]);

  // Handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRows.length) setSelectedIds([]);
    else setSelectedIds(filteredRows.map(r => r.id));
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkAction = (action) => {
    if (selectedIds.length === 0) return;
    const newQueue = queue.map(item => {
      if (selectedIds.includes(item.id)) {
        return { ...item, status: action === 'approve' ? 'Approved' : 'Rejected' };
      }
      return item;
    });
    setQueue(newQueue);
    showToast(`Bulk ${action} completed for ${selectedIds.length} items`, 'success');
    setSelectedIds([]);
  };

  const handleDecision = (id, decision, notes = '') => {
    const ts = new Date().toISOString();
    const newQueue = queue.map(item => {
      if (item.id === id) {
        const entry = { timestamp: ts, reviewerId: 'Current_Admin', action: decision, notes };
        return {
          ...item,
          status: decision === 'Approve' ? 'Approved' : decision === 'Reject' ? 'Rejected' : 'In Review',
          auditTrail: [...(item.auditTrail || []), entry],
        };
      }
      return item;
    });
    setQueue(newQueue);
    showToast(`Request ${decision}ed successfully`, 'success');
    setActiveRow(null);
    setRejectReason('');
    setMoreInfoMessage('');
    setIsRejectOpen(false);
    setIsInfoOpen(false);
  };

  const handleAssignReviewer = (id) => {
    if (!selectedReviewerId) return;
    const reviewer = AVAILABLE_REVIEWERS.find(r => r.id === selectedReviewerId);
    if (!reviewer) return;
    setQueue(prev => prev.map(item =>
      item.id === id ? { ...item, assignedReviewer: reviewer.name, assignedAt: new Date().toISOString() } : item
    ));
    setActiveRow(prev => prev ? { ...prev, assignedReviewer: reviewer.name } : null);
    setSelectedReviewerId('');
    showToast(`Assigned to @${reviewer.name} — reviewer notified`, 'success');
  };

  const savePolicies = () => {
    setPolicies(policiesDraft);
    setPoliciesOpen(false);
    showToast('Domain policies saved', 'success');
  };

  const toggleProofType = (domain, value) => {
    setPoliciesDraft(prev => {
      const current = prev[domain].min_proof_types;
      const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      if (next.length === 0) return prev;
      return { ...prev, [domain]: { ...prev[domain], min_proof_types: next } };
    });
  };

  return (
    <div className="admin-page-verifications theme-admin pb-20">
      <Helmet><title>Verification Queue | Admin</title></Helmet>

      <div className="px-8 md:px-12 pt-8">
        <AdminPageHero
          kicker="Trust & Safety"
          title="Verification_Queue"
          description="Review submitted proof for skill verifications. Ensure GzoneSphere remains a verified ecosystem for high-fidelity talent."
        />

        {/* STATS CARDS */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Total',     value: stats.total,    color: '#6b7280' },
            { label: 'Pending',   value: stats.pending,  color: '#f59e0b' },
            { label: 'In Review', value: stats.inReview, color: '#3b9eff' },
            { label: 'Approved',  value: stats.approved, color: '#10b981' },
            { label: 'Rejected',  value: stats.rejected, color: '#ef4444' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
                padding: 16, minWidth: 140, flex: 1,
              }}
            >
              <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 6, fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* SEARCH + DOMAIN FILTER PILLS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Search username or skill..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', paddingLeft: 36, paddingRight: 12, height: 38,
                  border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13,
                  outline: 'none', background: '#fff', color: '#111827',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            {/* Status + Proof selects */}
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="admin-select">
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Review">In Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <select value={proofFilter} onChange={(e) => setProofFilter(e.target.value)} className="admin-select">
              {PROOF_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            {/* Unassigned toggle */}
            <button
              type="button"
              onClick={() => setShowOnlyUnassigned(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', height: 38,
                borderRadius: 8, border: showOnlyUnassigned ? 'none' : '1px solid #d1d5db',
                background: showOnlyUnassigned ? '#f59e0b' : '#fff',
                color: showOnlyUnassigned ? '#fff' : '#6b7280',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              <FiFilter size={13}/> Unassigned only
            </button>

            {/* Domain Policies gear */}
            <button
              type="button"
              onClick={() => { setPoliciesDraft(policies); setPoliciesOpen(true); }}
              title="Domain Policies"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 38, height: 38, borderRadius: 8, border: '1px solid #d1d5db',
                background: '#fff', color: '#6b7280', cursor: 'pointer', flexShrink: 0,
              }}
            >
              <FiSettings size={15}/>
            </button>
          </div>

          {/* Domain filter pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[{ key: 'All', label: 'All', hex: null }, ...Object.entries(DOMAIN_META).map(([k, m]) => ({ key: k, label: m.label, hex: m.hex }))].map(({ key, label, hex }) => {
              const isActive = domainFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDomainFilter(key)}
                  style={{
                    padding: '4px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                    background: isActive && hex ? hex : isActive ? '#6b7280' : '#f4f4f4',
                    color: isActive ? '#fff' : '#6b7280',
                  }}
                >
                  {label}
                </button>
              );
            })}
            {showOnlyUnassigned && (
              <span style={{ padding: '4px 14px', borderRadius: 20, background: '#fef3c7', color: '#92400e', fontSize: 12, fontWeight: 700 }}>
                Showing unassigned only
              </span>
            )}
          </div>
        </div>

        {/* BULK ACTIONS BAR */}
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-between bg-[var(--theme-primary)] text-black px-8 py-4 rounded-3xl mb-8 shadow-xl shadow-[var(--theme-primary)]/20"
          >
            <span className="text-xs font-black uppercase tracking-widest italic">{selectedIds.length} Items Selected</span>
            <div className="flex gap-3">
              <button onClick={() => handleBulkAction('approve')} className="px-6 py-2 rounded-xl bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-black/80 transition-all">Approve Selected</button>
              <button onClick={() => handleBulkAction('reject')} className="px-6 py-2 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all">Reject Selected</button>
              <button onClick={() => setSelectedIds([])} className="px-4 py-2 rounded-xl border border-black text-[10px] font-black uppercase tracking-widest hover:bg-black/10 transition-all">Cancel</button>
            </div>
          </motion.div>
        )}

        {/* QUEUE TABLE */}
        <AdminPanel title="Active Submissions" meta={`${filteredRows.length} requests matching filters`} padded={false}>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" checked={selectedIds.length === filteredRows.length && filteredRows.length > 0} onChange={toggleSelectAll} className="w-4 h-4 accent-[var(--theme-primary)]" />
                  </th>
                  <th>User</th>
                  <th>Skill Claimed</th>
                  <th>Proof</th>
                  <th>Assigned</th>
                  <th>Submitted</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--theme-border)]">
                {filteredRows.map(row => {
                  const days = Math.floor((now - new Date(row.submittedAt).getTime()) / 86400000);
                  const slaRisk = days >= 7 ? { label: 'Overdue', color: '#ef4444' }
                                : days >= 3 ? { label: 'At Risk', color: '#f59e0b' }
                                : null;
                  return (
                    <tr key={row.id}>
                      <td>
                        <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleSelect(row.id)} className="w-4 h-4 accent-[var(--theme-primary)]" />
                      </td>

                      {/* USER */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img
                            src={row.avatarUrl}
                            alt=""
                            style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                          />
                          <div>
                            <p className="text-sm font-black uppercase italic tracking-tighter text-[var(--theme-text)]">@{row.username}</p>
                            {row.subProfileDomain && (
                              <DomainBadge domain={row.subProfileDomain} size="sm" variant="dot" />
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SKILL CLAIMED */}
                      <td>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--theme-text)' }}>
                          {row.skillName}
                        </span>
                      </td>

                      {/* PROOF */}
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center',
                          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                          background: 'var(--theme-bg-alt)', color: 'var(--theme-text-muted)',
                          border: '1px solid var(--theme-border)',
                          whiteSpace: 'nowrap',
                        }}>
                          {row.proofType}
                        </span>
                      </td>

                      {/* ASSIGNED + PRIORITY */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{
                            fontSize: 12, fontWeight: 700,
                            color: row.assignedReviewer ? 'var(--theme-text)' : '#92400e',
                            background: row.assignedReviewer ? 'transparent' : '#fef3c7',
                            padding: row.assignedReviewer ? 0 : '1px 8px',
                            borderRadius: row.assignedReviewer ? 0 : 12,
                            display: 'inline-block',
                          }}>
                            {row.assignedReviewer ? `@${row.assignedReviewer}` : 'Unassigned'}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_META[row.priority]?.dot || 'bg-[var(--theme-text-muted)]'}`} />
                            <span style={{ fontSize: 10, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              {row.priority}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* SUBMITTED + SLA */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <span style={{ fontSize: 12, color: 'var(--theme-text)', fontWeight: 500 }}>
                            {formatRelativeTime(row.submittedAt, now)}
                          </span>
                          {slaRisk && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: slaRisk.color }}>
                              {slaRisk.label}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="text-right">
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setActiveRow(row)}
                            style={{
                              height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid var(--theme-border)',
                              background: 'transparent', color: 'var(--theme-text-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            <FiChevronRight size={12} /> View
                          </button>
                          <button
                            onClick={() => handleDecision(row.id, 'Approve')}
                            style={{
                              height: 28, padding: '0 10px', borderRadius: 6, border: 'none',
                              background: 'rgba(16,185,129,0.12)', color: '#10b981', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            <FiCheck size={12} /> Approve
                          </button>
                          <button
                            onClick={() => { setActiveRow(row); setIsRejectOpen(true); }}
                            style={{
                              height: 28, padding: '0 10px', borderRadius: 6, border: 'none',
                              background: 'rgba(239,68,68,0.10)', color: '#ef4444', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            <FiXCircle size={12} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <AdminEmptyState title="Queue Empty" description="No verification requests matching your current filters." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </AdminPanel>

        {/* AUDIT LOG */}
        <AdminPanel title="System Audit Log" meta="Last 10 verification actions taken platform-wide">
          <div className="space-y-4">
            {auditLog.map((log, i) => (
              <div key={i} className="flex items-start gap-6 p-4 rounded-2xl bg-[var(--theme-bg-alt)]/30 border border-[var(--theme-border)]">
                <div className="w-10 h-10 rounded-xl bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] flex items-center justify-center shrink-0">
                  <FiActivity size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-black uppercase italic tracking-tighter text-[var(--theme-text)]">
                      <span className="text-[var(--theme-primary)]">{log.reviewerId}</span> {log.action}ed <span className="text-[var(--theme-primary)]">@{log.username}</span>'s {log.skill}
                    </p>
                    <span className="text-[9px] font-bold text-[var(--theme-text-muted)] opacity-40">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  {log.notes && <p className="text-[10px] font-medium italic text-[var(--theme-text-muted)] opacity-60">" {log.notes} "</p>}
                </div>
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>

      {/* DOMAIN POLICIES MODAL (Task 5) */}
      <AnimatePresence>
        {policiesOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setPoliciesOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              className="relative bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-[var(--theme-border)]">
                <div className="flex items-center gap-3">
                  <FiSettings size={18} className="text-[var(--theme-primary)]"/>
                  <h2 className="text-lg font-black uppercase italic tracking-tighter text-[var(--theme-text)]">Domain_Policies</h2>
                </div>
                <button onClick={() => setPoliciesOpen(false)} className="p-2 rounded-full hover:bg-[var(--theme-bg-alt)] transition-all">
                  <FiX size={18}/>
                </button>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {/* Domain list */}
                <div className="w-36 border-r border-[var(--theme-border)] py-4 flex flex-col gap-1 shrink-0 overflow-y-auto">
                  {POLICY_DOMAINS.map(d => (
                    <button
                      key={d}
                      onClick={() => setActivePolicyDomain(d)}
                      className={`px-4 py-3 text-xs font-black uppercase tracking-wider italic text-left transition-all ${activePolicyDomain === d ? 'bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] border-r-2 border-[var(--theme-primary)]' : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>

                {/* Policy editor */}
                <div className="flex-1 p-8 overflow-y-auto space-y-8">
                  {(() => {
                    const dp = policiesDraft[activePolicyDomain];
                    return (
                      <>
                        {/* Proof requirements */}
                        <div className="space-y-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-60 italic">
                            Minimum proof requirements
                          </p>
                          <p className="text-xs text-[var(--theme-text-muted)] opacity-50">At least one must be selected. Submissions missing these will be rejected automatically.</p>
                          <div className="flex flex-wrap gap-2">
                            {PROOF_TYPE_OPTIONS.map(opt => {
                              const checked = dp.min_proof_types.includes(opt.value);
                              return (
                                <button
                                  key={opt.value}
                                  onClick={() => toggleProofType(activePolicyDomain, opt.value)}
                                  style={{
                                    padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                    border: checked ? 'none' : '1px solid var(--theme-border)',
                                    background: checked ? 'var(--theme-primary)' : 'var(--theme-bg-alt)',
                                    color: checked ? '#000' : 'var(--theme-text-muted)',
                                    transition: 'all 0.15s',
                                  }}
                                >
                                  {checked ? '✓ ' : ''}{opt.label}
                                </button>
                              );
                            })}
                          </div>
                          {dp.min_proof_types.length === 0 && (
                            <p className="text-[10px] text-rose-500 flex items-center gap-1">
                              <FiAlertCircle size={11}/> At least one proof type must be selected.
                            </p>
                          )}
                        </div>

                        {/* Max review days */}
                        <div className="space-y-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-60 italic">
                            Max review days before escalation
                          </p>
                          <p className="text-xs text-[var(--theme-text-muted)] opacity-50">Requests older than this will have priority set to High and super admin notified.</p>
                          <div className="flex items-center gap-4">
                            <input
                              type="number"
                              min={1}
                              max={30}
                              value={dp.max_review_days}
                              onChange={e => setPoliciesDraft(prev => ({
                                ...prev,
                                [activePolicyDomain]: { ...prev[activePolicyDomain], max_review_days: Math.max(1, Math.min(30, parseInt(e.target.value)||1)) }
                              }))}
                              className="w-20 bg-[var(--theme-bg-alt)] border-2 border-[var(--theme-border)] rounded-xl py-2.5 px-4 text-sm font-black text-[var(--theme-text)] outline-none focus:border-[var(--theme-primary)] text-center"
                            />
                            <span className="text-xs text-[var(--theme-text-muted)] opacity-60">days (min 1, max 30)</span>
                          </div>
                        </div>

                        {/* Assignment mode */}
                        <div className="space-y-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-60 italic">
                            Reviewer assignment mode
                          </p>
                          <div className="flex gap-4">
                            {[
                              { value: 'manual',      label: 'Manual',          desc: 'Admin assigns each request manually' },
                              { value: 'round_robin', label: 'Round-robin auto', desc: 'Auto-assign to reviewer with fewest pending' },
                            ].map(opt => (
                              <button
                                key={opt.value}
                                onClick={() => setPoliciesDraft(prev => ({
                                  ...prev,
                                  [activePolicyDomain]: { ...prev[activePolicyDomain], assignment_mode: opt.value }
                                }))}
                                className={`flex-1 p-4 rounded-2xl border-2 text-left transition-all ${dp.assignment_mode === opt.value ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/5' : 'border-[var(--theme-border)] hover:border-[var(--theme-primary)]/30'}`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <div className={`w-3 h-3 rounded-full border-2 ${dp.assignment_mode === opt.value ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]' : 'border-[var(--theme-border)]'}`}/>
                                  <span className="text-xs font-black uppercase tracking-wider text-[var(--theme-text)]">{opt.label}</span>
                                </div>
                                <p className="text-[10px] text-[var(--theme-text-muted)] opacity-60 ml-5">{opt.desc}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-5 border-t border-[var(--theme-border)] flex justify-end gap-3">
                <button onClick={() => setPoliciesOpen(false)}
                  className="px-6 py-2.5 rounded-xl border border-[var(--theme-border)] text-xs font-black uppercase tracking-wider text-[var(--theme-text-muted)] hover:border-[var(--theme-primary)]/30 transition-all">
                  Cancel
                </button>
                <button onClick={savePolicies}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--theme-primary)] text-black text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all">
                  <FiSave size={13}/> Save All Policies
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAIL SIDE PANEL */}
      <AnimatePresence>
        {activeRow && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setActiveRow(null)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl bg-[var(--theme-card)] border-l-2 border-[var(--theme-border)] shadow-2xl overflow-y-auto"
            >
              <div className="sticky top-0 z-20 bg-[var(--theme-card)]/80 backdrop-blur-md border-b border-[var(--theme-border)] px-8 py-6 flex items-center justify-between">
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-[var(--theme-text)]">Review_Submission</h3>
                <button onClick={() => setActiveRow(null)} className="p-2 rounded-full hover:bg-[var(--theme-bg-alt)] transition-all">
                  <FiX size={24} />
                </button>
              </div>

              <div className="p-8 space-y-10">
                {/* User Info */}
                <div className="flex items-center gap-6 p-6 rounded-[2rem] bg-[var(--theme-bg-alt)]/40 border border-[var(--theme-border)]">
                  <img src={activeRow.avatarUrl} className="w-16 h-16 rounded-3xl object-cover border-2 border-[var(--theme-border)] shadow-lg" alt="" />
                  <div>
                    <h4 className="text-lg font-black uppercase italic tracking-tighter text-[var(--theme-text)]">@{activeRow.username}</h4>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-primary)] italic opacity-80">
                      {activeRow.subProfileDomain} Specialist
                    </p>
                  </div>
                  <Link to={`/u/${activeRow.username}`} className="ml-auto p-3 rounded-xl bg-white/5 text-[var(--theme-text-muted)] hover:text-white transition-all">
                    <FiExternalLink size={20} />
                  </Link>
                </div>

                {/* Skill Details */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-40">Verification Request</p>
                  <div className="p-6 rounded-[2rem] border-2 border-[var(--theme-border)] space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-2xl font-black uppercase italic tracking-tighter text-[var(--theme-text)]">{activeRow.skillName}</h5>
                      <span className="px-3 py-1 rounded-full bg-black/30 border border-white/5 text-[8px] font-black uppercase tracking-widest italic">{activeRow.proofType}</span>
                    </div>
                    <p className="text-xs font-medium text-[var(--theme-text-muted)] leading-relaxed italic opacity-70">
                      Claimed proficiency in {activeRow.skillName} within the {activeRow.subProfileDomain} domain. Verification requires manual audit of submitted evidence.
                    </p>
                  </div>
                </div>

                {/* Proof Viewer */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-40">Submitted Evidence</p>
                  <div className="aspect-video rounded-[2rem] border-2 border-[var(--theme-border)] bg-[var(--theme-bg-alt)] flex flex-col items-center justify-center text-center p-8 overflow-hidden group relative">
                    {activeRow.proofUrl ? (
                      <>
                        <FiExternalLink size={32} className="text-[var(--theme-primary)] mb-4 opacity-40" />
                        <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-text)] mb-2 italic">Remote Intel Node</p>
                        <p className="text-[10px] font-bold text-[var(--theme-text-muted)] opacity-40 truncate max-w-full italic mb-6">{activeRow.proofUrl}</p>
                        <a href={activeRow.proofUrl} target="_blank" rel="noopener noreferrer" className="admin-btn" style={{ color: 'var(--theme-primary)' }}>Access Proof Payload</a>
                      </>
                    ) : (
                      <>
                        <FiAlertTriangle size={32} className="text-[var(--status-warning)] mb-4 opacity-40" />
                        <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-text)] italic">No File Payload</p>
                        <p className="text-[10px] font-bold text-[var(--theme-text-muted)] opacity-40 italic mt-2">Proof provided via manual demonstration or external reference.</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Assignment */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-40">
                    Assign Reviewer
                    {activeRow.assignedReviewer && (
                      <span className="ml-3 text-[var(--theme-primary)] normal-case font-bold tracking-normal not-italic opacity-100">
                        Currently: @{activeRow.assignedReviewer}
                      </span>
                    )}
                  </p>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <FiUserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)]" />
                      <select
                        value={selectedReviewerId}
                        onChange={e => setSelectedReviewerId(e.target.value)}
                        className="w-full bg-[var(--theme-bg-alt)] border-2 border-[var(--theme-border)] rounded-2xl py-3 pl-12 pr-6 text-xs text-[var(--theme-text)] outline-none focus:border-[var(--theme-primary)] appearance-none cursor-pointer"
                      >
                        <option value="">Assign to domain expert…</option>
                        {AVAILABLE_REVIEWERS
                          .filter(r => r.domain.toLowerCase() === activeRow.subProfileDomain?.toLowerCase() || r.domain === 'General')
                          .map(r => (
                            <option key={r.id} value={r.id}>{r.name} ({r.domain})</option>
                          ))
                        }
                        {AVAILABLE_REVIEWERS
                          .filter(r => r.domain.toLowerCase() !== activeRow.subProfileDomain?.toLowerCase() && r.domain !== 'General')
                          .length > 0 && <option disabled>── Other reviewers ──</option>
                        }
                        {AVAILABLE_REVIEWERS
                          .filter(r => r.domain.toLowerCase() !== activeRow.subProfileDomain?.toLowerCase() && r.domain !== 'General')
                          .map(r => (
                            <option key={r.id + '_other'} value={r.id}>{r.name} ({r.domain})</option>
                          ))
                        }
                      </select>
                    </div>
                    <button
                      onClick={() => handleAssignReviewer(activeRow.id)}
                      disabled={!selectedReviewerId}
                      className="px-5 py-3 rounded-2xl bg-[var(--theme-primary)] text-black text-xs font-black uppercase tracking-wider disabled:opacity-30 hover:opacity-90 transition-all shrink-0"
                    >
                      Assign
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-10 border-t border-[var(--theme-border)] space-y-4">
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleDecision(activeRow.id, 'Approve')}
                      className="admin-btn flex-1"
                      style={{ background: 'var(--status-success-bg)', color: 'var(--status-success-text)', border: 'none' }}
                    >
                      ✓ Approve Verification
                    </button>
                    <button 
                      onClick={() => setIsRejectOpen(true)}
                      className="admin-btn--danger flex-1"
                    >
                      ✗ Reject Request
                    </button>
                  </div>
                  <button 
                    onClick={() => setIsInfoOpen(true)}
                    className="w-full bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] text-[var(--theme-text-muted)] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-[var(--theme-primary)] hover:border-[var(--theme-primary)] transition-all"
                  >
                    → Request More Information
                  </button>
                </div>

                {/* Reject Reasoning */}
                {isRejectOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-4 pt-6 border-t border-red-500/20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-500 italic opacity-80">Rejection Reason (Required)</p>
                    <textarea 
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Explain why this request is being rejected..."
                      className="w-full bg-[var(--theme-bg-alt)] border-2 border-red-500/20 rounded-2xl p-4 text-xs text-[var(--theme-text)] outline-none focus:border-red-500/60"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setIsRejectOpen(false)} className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)]">Cancel</button>
                      <button onClick={() => handleDecision(activeRow.id, 'Reject', rejectReason)} disabled={!rejectReason.trim()} className="flex-1 bg-red-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30">Confirm Reject</button>
                    </div>
                  </motion.div>
                )}

                {/* Request Info */}
                {isInfoOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-4 pt-6 border-t border-[var(--theme-primary)]/20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-primary)] italic opacity-80">Inquiry Message</p>
                    <textarea 
                      value={moreInfoMessage}
                      onChange={(e) => setMoreInfoMessage(e.target.value)}
                      placeholder="Specify what additional proof is needed..."
                      className="w-full bg-[var(--theme-bg-alt)] border-2 border-[var(--theme-primary)]/20 rounded-2xl p-4 text-xs text-[var(--theme-text)] outline-none focus:border-[var(--theme-primary)]"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setIsInfoOpen(false)} className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)]">Cancel</button>
                      <button onClick={() => handleDecision(activeRow.id, 'Request Info', moreInfoMessage)} disabled={!moreInfoMessage.trim()} className="flex-1 bg-[var(--theme-primary)] text-black py-3 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30">Send Request</button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

