import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  FiCheckCircle, FiXCircle, FiEye, FiMoreVertical, FiSearch,
  FiFilter, FiExternalLink, FiBarChart2, FiUsers, FiBriefcase,
  FiShield, FiMapPin, FiMail, FiGlobe, FiAlertTriangle, FiPlus,
  FiCheck, FiX, FiInfo, FiChevronDown, FiChevronUp, FiUserPlus, FiUserMinus
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import { useToast } from '@/shared/components/Toast';
import { AdminPageHero, AdminPanel } from '../components/AdminContentShell';
import {
  MOCK_PENDING, MOCK_ACTIVE, MOCK_SUSPENDED,
  COMPANY_TYPES, COMPANY_SIZES, COMPLIANCE_CHECKLIST
} from '@/shared/data/companyAdminData';

// ── Helpers ──────────────────────────────────────────────────────────────────

const StatusBadge = ({ type }) => {
  const styles = {
    Active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    Pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    Suspended: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-widest italic ${styles[type] || styles.Pending}`}>
      {type}
    </span>
  );
};

// ── Sub-Components ───────────────────────────────────────────────────────────

/**
 * Review Panel (Slide-in)
 */
const ReviewPanel = ({ company, onClose, onApprove, onReject }) => {
  const [checklist, setChecklist] = useState(COMPLIANCE_CHECKLIST.reduce((acc, item) => ({ ...acc, [item]: false }), {}));
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const allChecked = Object.values(checklist).every(v => v);

  if (!company) return null;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 w-full max-w-lg bg-[var(--theme-card)] border-l border-[var(--theme-border)] shadow-2xl z-[100] flex flex-col"
    >
      <div className="p-6 border-b border-[var(--theme-border)] flex items-center justify-between bg-[var(--theme-bg-alt)]">
        <div>
          <h2 className="text-xl font-black uppercase italic tracking-tighter text-[var(--theme-text)]">Review Profile</h2>
          <p className="text-xs text-[var(--theme-text-muted)] uppercase font-bold tracking-widest">Pending Approval: {company.name}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-[var(--theme-border)] rounded-xl transition-colors">
          <FiX size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {/* Company Identity */}
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-slate-900 flex items-center justify-center text-3xl font-black text-white shadow-xl flex-shrink-0">
            {company.logo}
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black italic tracking-tighter text-[var(--theme-text)]">{company.name}</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-0.5 bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] rounded-lg text-[10px] font-bold uppercase">{company.type}</span>
              <span className="px-2 py-0.5 bg-[var(--theme-bg-alt)] text-[var(--theme-text-muted)] border border-[var(--theme-border)] rounded-lg text-[10px] font-bold uppercase">{company.size} employees</span>
            </div>
          </div>
        </div>

        {/* Detailed Info */}
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic">Description</p>
            <p className="text-sm text-[var(--theme-text)] leading-relaxed">{company.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic">HQ Location</p>
              <div className="flex items-center gap-2 text-sm text-[var(--theme-text)]">
                <FiMapPin size={14} className="text-[var(--theme-primary)]" />
                {company.hq}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic">Website</p>
              <a href={company.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-[var(--theme-primary)] hover:underline">
                <FiGlobe size={14} />
                {company.website.replace('https://', '')}
              </a>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic">Domain Verification</p>
            <div className={`flex items-center gap-2 text-sm font-bold ${company.domainVerified ? 'text-emerald-500' : 'text-amber-500'}`}>
              <FiMail size={14} />
              {company.domainEmail}
              {company.domainVerified ? <FiCheckCircle size={14} /> : <FiInfo size={14} title="Self-declared, not verified yet" />}
            </div>
          </div>
        </div>

        {/* Compliance Checklist */}
        <div className="space-y-4 pt-6 border-t border-[var(--theme-border)]">
          <h4 className="text-sm font-black uppercase tracking-widest italic text-[var(--theme-text)]">Compliance Checklist</h4>
          <div className="space-y-3">
            {COMPLIANCE_CHECKLIST.map(item => (
              <label key={item} className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={checklist[item]}
                    onChange={() => setChecklist(prev => ({ ...prev, [item]: !prev[item] }))}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                    checklist[item] ? 'bg-emerald-500 border-emerald-500' : 'bg-transparent border-[var(--theme-border)] group-hover:border-[var(--theme-primary)]'
                  }`}>
                    {checklist[item] && <FiCheck size={12} className="text-white stroke-[4]" />}
                  </div>
                </div>
                <span className="text-xs text-[var(--theme-text-muted)] font-medium leading-tight">{item}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="p-8 bg-[var(--theme-bg-alt)] border-t border-[var(--theme-border)] space-y-4">
        {showRejectInput ? (
          <div className="space-y-3">
            <textarea
              placeholder="Reason for rejection (will be sent to submitter)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-2xl p-4 text-sm focus:outline-none focus:border-rose-500 min-h-[100px]"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectInput(false)}
                className="flex-1 px-6 py-3 rounded-2xl border border-[var(--theme-border)] text-sm font-black uppercase tracking-widest italic"
              >
                Back
              </button>
              <button
                disabled={!rejectReason.trim()}
                onClick={() => onReject(company.id, rejectReason)}
                className="flex-1 px-6 py-3 rounded-2xl bg-rose-600 text-white text-sm font-black uppercase tracking-widest italic disabled:opacity-50"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => setShowRejectInput(true)}
              className="flex-1 px-6 py-4 rounded-2xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/5 transition-all text-sm font-black uppercase tracking-widest italic"
            >
              Reject
            </button>
            <button
              disabled={!allChecked}
              onClick={() => onApprove(company.id)}
              className="flex-1 px-6 py-4 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm font-black uppercase tracking-widest italic disabled:opacity-50 disabled:grayscale disabled:scale-100"
            >
              Approve Profile
            </button>
          </div>
        )}
        {!allChecked && !showRejectInput && (
          <p className="text-[10px] text-center text-[var(--theme-text-muted)] font-bold uppercase tracking-wider">
            All compliance items must be checked before approval
          </p>
        )}
      </div>
    </motion.div>
  );
};

/**
 * Analytics Row (Expandable)
 */
const AnalyticsRow = ({ company }) => {
  // Mock analytics data
  const data = [
    { label: 'Profile Views (30d)', value: company.views30d, trend: '+12%' },
    { label: 'Talent Pool', value: company.talentPool, trend: '+8%' },
    { label: 'Open Roles', value: company.openRoles, trend: 'ACTIVE' },
    { label: 'Conversion Rate', value: '3.2%', trend: '-0.4%' },
  ];

  return (
    <div className="bg-[var(--theme-bg-alt)]/50 p-6 grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
      {data.map(item => (
        <div key={item.label} className="bg-[var(--theme-card)] p-4 rounded-2xl border border-[var(--theme-border)] shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic mb-1">{item.label}</p>
          <div className="flex items-baseline justify-between">
            <h4 className="text-2xl font-black italic tracking-tighter text-[var(--theme-text)]">{item.value}</h4>
            <span className={`text-[10px] font-bold ${item.trend.includes('-') ? 'text-rose-500' : 'text-emerald-500'}`}>
              {item.trend}
            </span>
          </div>
        </div>
      ))}
      <div className="md:col-span-4 flex items-center justify-between pt-4 border-t border-[var(--theme-border)]/50">
        <p className="text-xs text-[var(--theme-text-muted)] italic font-medium">
          Source Breakdown: 60% Direct Search, 25% Social, 15% Referrals
        </p>
        <button className="text-xs font-black uppercase tracking-widest text-[var(--theme-primary)] hover:underline italic">
          Full Analytics Report {'->'}
        </button>
      </div>
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────

export default function CompanyManagement() {
  usePageTheme('admin');
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('pending');
  const [search, setSearch] = useState('');
  
  // Tab data state
  const [pending, setPending] = useState(MOCK_PENDING);
  const [active, setActive] = useState(MOCK_ACTIVE);
  const [suspended, setSuspended] = useState(MOCK_SUSPENDED);

  // Review panel state
  const [reviewingCompany, setReviewingCompany] = useState(null);
  
  // Expanded rows (for analytics)
  const [expandedRows, setExpandedRows] = useState([]);

  // Filters
  const [typeFilter, setTypeFilter] = useState('All');
  const [sizeFilter, setSizeFilter] = useState('All');
  const [verifyFilter, setVerifyFilter] = useState('All');

  // Logic
  const handleApprove = (id) => {
    const comp = pending.find(p => p.id === id);
    setPending(prev => prev.filter(p => p.id !== id));
    setActive(prev => [{
      ...comp,
      verified: true,
      views30d: 0,
      openRoles: 0,
      talentPool: 0,
      country: comp.hq.split(',').pop().trim(),
    }, ...prev]);
    setReviewingCompany(null);
    showToast(`${comp.name} has been approved and is now live.`, 'success');
  };

  const handleReject = (id, reason) => {
    const comp = pending.find(p => p.id === id);
    setPending(prev => prev.filter(p => p.id !== id));
    setReviewingCompany(null);
    showToast(`${comp.name} application rejected. Reason: ${reason}`, 'info');
  };

  const handleSuspend = (id, reason) => {
    const comp = active.find(a => a.id === id);
    setActive(prev => prev.filter(a => a.id !== id));
    setSuspended(prev => [{
      ...comp,
      suspendedDate: new Date().toISOString().split('T')[0],
      suspendedBy: 'current_admin',
      reason,
    }, ...prev]);
    showToast(`${comp.name} has been suspended.`, 'warning');
  };

  const handleReinstate = (id) => {
    const comp = suspended.find(s => s.id === id);
    setSuspended(prev => prev.filter(s => s.id !== id));
    setActive(prev => [{
      ...comp,
      suspendedAt: null,
    }, ...prev]);
    showToast(`${comp.name} reinstated successfully.`, 'success');
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const filteredActive = useMemo(() => {
    return active.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'All' || c.type === typeFilter;
      const matchSize = sizeFilter === 'All' || c.size === sizeFilter;
      const matchVerify = verifyFilter === 'All' || (verifyFilter === 'Verified' ? c.verified : !c.verified);
      return matchSearch && matchType && matchSize && matchVerify;
    });
  }, [active, search, typeFilter, sizeFilter, verifyFilter]);

  return (
    <div className="admin-page-shell">
      <Helmet><title>Company Management | GzoneSphere Admin</title></Helmet>

      <AdminPageHero
        kicker="Business Core"
        title="Company Management"
        description="Oversee corporate identity, verify official status, and moderate business profiles."
      />

      {/* Tab Nav */}
      <div className="flex gap-1 p-1 bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] rounded-2xl mb-8 w-fit">
        {[
          { id: 'pending', label: 'Pending Approval', count: pending.length },
          { id: 'active', label: 'Active Companies', count: active.length },
          { id: 'suspended', label: 'Suspended', count: suspended.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest italic transition-all flex items-center gap-3 ${
              activeTab === tab.id
                ? 'bg-[var(--theme-card)] text-[var(--theme-primary)] shadow-sm'
                : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${activeTab === tab.id ? 'bg-[var(--theme-primary)] text-white' : 'bg-[var(--theme-border)]'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === 'pending' && (
          <motion.div
            key="pending"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <AdminPanel title="Submission Queue" meta="New company profiles awaiting identity verification">
              <div className="divide-y divide-[var(--theme-border)]">
                {pending.length === 0 ? (
                  <div className="p-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                      <FiCheckCircle size={40} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black italic text-[var(--theme-text)] uppercase tracking-tighter">Queue Empty</h3>
                      <p className="text-sm text-[var(--theme-text-muted)]">All pending company submissions have been processed.</p>
                    </div>
                  </div>
                ) : (
                  pending.map(comp => (
                    <div key={comp.id} className="p-6 flex flex-wrap items-center justify-between gap-6 hover:bg-[var(--theme-bg-alt)] transition-colors group">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-lg shadow-lg">
                          {comp.logo}
                        </div>
                        <div>
                          <h4 className="text-base font-black italic tracking-tighter text-[var(--theme-text)] flex items-center gap-2">
                            {comp.name}
                            <span className="px-2 py-0.5 bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] rounded-lg text-[10px] uppercase font-bold italic tracking-widest">{comp.type}</span>
                          </h4>
                          <p className="text-xs text-[var(--theme-text-muted)] font-medium">
                            Submitted by <span className="text-[var(--theme-text)] font-bold">@{comp.submittedBy}</span> on {comp.submittedDate}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        <div className="hidden lg:block text-right">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic leading-none mb-1">Contact</p>
                          <p className={`text-xs font-bold italic ${comp.domainVerified ? 'text-emerald-500' : 'text-amber-500'}`}>{comp.domainEmail}</p>
                        </div>
                        <button
                          onClick={() => setReviewingCompany(comp)}
                          className="px-8 py-3 rounded-2xl bg-[var(--theme-card)] border-2 border-[var(--theme-border)] group-hover:border-[var(--theme-primary)]/40 text-xs font-black uppercase tracking-widest italic transition-all active:scale-95"
                        >
                          Review Application
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </AdminPanel>
          </motion.div>
        )}

        {activeTab === 'active' && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 bg-[var(--theme-card)] p-4 rounded-2xl border border-[var(--theme-border)] shadow-sm">
              <div className="flex-1 min-w-[200px] relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)]" />
                <input
                  type="text"
                  placeholder="Search by company name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[var(--theme-primary)]"
                />
              </div>
              <div className="flex items-center gap-2">
                <FiFilter size={14} className="text-[var(--theme-text-muted)]" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl px-4 py-2 text-xs font-bold italic focus:outline-none"
                >
                  <option value="All">Type: All</option>
                  {COMPANY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select
                  value={sizeFilter}
                  onChange={(e) => setSizeFilter(e.target.value)}
                  className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl px-4 py-2 text-xs font-bold italic focus:outline-none"
                >
                  <option value="All">Size: All</option>
                  {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                  value={verifyFilter}
                  onChange={(e) => setVerifyFilter(e.target.value)}
                  className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl px-4 py-2 text-xs font-bold italic focus:outline-none"
                >
                  <option value="All">Verification: All</option>
                  <option value="Verified">Verified Only</option>
                  <option value="Not Verified">Unverified Only</option>
                </select>
              </div>
            </div>

            <AdminPanel title="Company Directory" meta="Browse and manage live corporate entities">
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th className="w-10"></th>
                      <th>Company</th>
                      <th>Type</th>
                      <th>Size</th>
                      <th>HQ</th>
                      <th className="text-center">Verified</th>
                      <th className="text-right">Stats</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActive.map(comp => (
                      <React.Fragment key={comp.id}>
                        <tr className={`${expandedRows.includes(comp.id) ? 'bg-[var(--theme-bg-alt)]/30' : ''}`}>
                          <td>
                            <button onClick={() => toggleRow(comp.id)} className="p-1 hover:bg-[var(--theme-border)] rounded-lg transition-colors">
                              {expandedRows.includes(comp.id) ? <FiChevronUp /> : <FiChevronDown />}
                            </button>
                          </td>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                                {comp.logo}
                              </div>
                              <span className="font-black italic tracking-tighter text-[var(--theme-text)]">{comp.name}</span>
                            </div>
                          </td>
                          <td>
                            <span className="px-2 py-0.5 bg-[var(--theme-bg-alt)] text-[var(--theme-text-muted)] border border-[var(--theme-border)] rounded-lg text-[10px] font-bold uppercase">{comp.type}</span>
                          </td>
                          <td className="text-xs font-bold text-[var(--theme-text-muted)]">{comp.size}</td>
                          <td className="text-xs font-bold text-[var(--theme-text)] italic">{comp.hq}</td>
                          <td className="text-center">
                            {comp.verified ? (
                              <FiCheckCircle className="text-emerald-500 mx-auto" size={18} title="Verified badge active" />
                            ) : (
                              <FiXCircle className="text-[var(--theme-border)] mx-auto" size={18} title="No badge" />
                            )}
                          </td>
                          <td className="text-right">
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] font-black uppercase text-[var(--theme-text)] italic">{comp.views30d} views</span>
                              <span className="text-[9px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">{comp.openRoles} roles · {comp.talentPool} talent</span>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => window.open(`/company/${comp.slug}`, '_blank')}
                                className="p-2 text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] transition-colors"
                                title="View Public Profile"
                              >
                                <FiExternalLink size={16} />
                              </button>
                              <button
                                onClick={() => handleSuspend(comp.id, 'Manual admin suspension')}
                                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                title="Suspend Profile"
                              >
                                <FiXCircle size={16} />
                              </button>
                              <div className="relative group/menu">
                                <button className="p-2 text-[var(--theme-text-muted)] hover:bg-[var(--theme-border)] rounded-lg transition-colors">
                                  <FiMoreVertical size={16} />
                                </button>
                                <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-2xl shadow-2xl z-50 py-2 hidden group-hover/menu:block">
                                  <button className="w-full text-left px-4 py-2 text-xs font-bold italic hover:bg-[var(--theme-bg-alt)] flex items-center gap-3">
                                    <FiShield size={14} /> {comp.verified ? 'Revoke Badge' : 'Grant Badge'}
                                  </button>
                                  <button className="w-full text-left px-4 py-2 text-xs font-bold italic hover:bg-[var(--theme-bg-alt)] flex items-center gap-3">
                                    <FiPlus size={14} /> Edit Type Tag
                                  </button>
                                  <button className="w-full text-left px-4 py-2 text-xs font-bold italic hover:bg-[var(--theme-bg-alt)] flex items-center gap-3">
                                    <FiUserPlus size={14} /> Link Employee
                                  </button>
                                  <button className="w-full text-left px-4 py-2 text-xs font-bold italic hover:bg-[var(--theme-bg-alt)] flex items-center gap-3 text-rose-500">
                                    <FiUserMinus size={14} /> Unlink Employee
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                        {expandedRows.includes(comp.id) && (
                          <tr className="!bg-transparent">
                            <td colSpan={8} className="p-0">
                              <AnalyticsRow company={comp} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </AdminPanel>
          </motion.div>
        )}

        {activeTab === 'suspended' && (
          <motion.div
            key="suspended"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <AdminPanel title="Moderation Vault" meta="Profiles removed from public search for policy violations">
              <div className="divide-y divide-[var(--theme-border)]">
                {suspended.length === 0 ? (
                  <div className="p-20 text-center space-y-4">
                    <FiShield size={40} className="text-[var(--theme-border)] mx-auto" />
                    <p className="text-sm text-[var(--theme-text-muted)] italic font-medium">No company profiles are currently suspended.</p>
                  </div>
                ) : (
                  suspended.map(comp => (
                    <div key={comp.id} className="p-6 flex flex-wrap items-center justify-between gap-6 hover:bg-rose-500/[0.02] transition-colors">
                      <div className="flex items-center gap-5 grayscale opacity-60">
                        <div className="w-12 h-12 rounded-xl bg-slate-400 text-white flex items-center justify-center font-black text-lg">
                          {comp.logo}
                        </div>
                        <div>
                          <h4 className="text-base font-black italic tracking-tighter text-[var(--theme-text)] line-through">{comp.name}</h4>
                          <p className="text-xs text-rose-500 font-bold uppercase tracking-widest italic">Suspended on {comp.suspendedDate}</p>
                        </div>
                      </div>

                      <div className="flex-1 max-w-md">
                        <div className="flex items-start gap-3 p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10">
                          <FiAlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={14} />
                          <p className="text-xs text-[var(--theme-text-muted)] leading-relaxed font-medium">
                            <span className="text-rose-500 font-black uppercase italic mr-2">Reason:</span>
                            {comp.reason}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleReinstate(comp.id)}
                        className="px-8 py-3 rounded-2xl border-2 border-[var(--theme-border)] text-xs font-black uppercase tracking-widest italic hover:bg-emerald-500 hover:border-emerald-500 hover:text-white transition-all active:scale-95"
                      >
                        Reinstate Profile
                      </button>
                    </div>
                  ))
                )}
              </div>
            </AdminPanel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side Panels & Modals */}
      <AnimatePresence>
        {reviewingCompany && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReviewingCompany(null)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[90]"
            />
            <ReviewPanel
              company={reviewingCompany}
              onClose={() => setReviewingCompany(null)}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
