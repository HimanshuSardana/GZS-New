import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBriefcase, FiPlus, FiUsers, FiActivity,
  FiSearch, FiLayers, FiChevronRight, FiCommand,
  FiBarChart2, FiDatabase, FiSettings
} from 'react-icons/fi';
import { useCompany } from '@/services/mutators/useCompany';
import { Helmet } from 'react-helmet-async';
import DashboardAnalytics from '../components/DashboardAnalytics';
import TalentPool         from '../components/TalentPool';
import { MOCK_ANALYTICS } from './companyMockData';

// ── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',  label: 'Overview',    icon: FiActivity  },
  { id: 'analytics', label: 'Analytics',   icon: FiBarChart2 },
  { id: 'talent',    label: 'Talent Pool', icon: FiDatabase  },
];

// ── Overview tab ─────────────────────────────────────────────────────────────
const TabOverview = ({ navigate }) => {
  const stats = [
    { label: 'Profile Views',    value: '1,840', trend: '+12%', icon: FiActivity },
    { label: 'Talent Pool',      value: '70',    trend: '+5%',  icon: FiUsers    },
    { label: 'Active Roles',     value: '5',     trend: 'LIVE', icon: FiBriefcase},
  ];

  return (
    <div className="space-y-16">
      {/* KPI tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map(s => (
          <div key={s.label}
            className="bg-[var(--theme-card)] p-8 rounded-3xl border border-[var(--theme-border)] shadow-sm group hover:border-[var(--theme-primary)]/40 transition-all">
            <div className="flex items-center justify-between mb-6 opacity-40 group-hover:opacity-100 transition-opacity">
              <p className="text-xs font-black uppercase tracking-wider text-[var(--theme-text-muted)] italic">{s.label}</p>
              <div className="p-2.5 bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] rounded-xl">
                <s.icon size={15} className="text-[var(--theme-primary)]" />
              </div>
            </div>
            <div className="flex items-baseline gap-3">
              <p className="text-5xl font-black text-[var(--theme-text)] italic tracking-tighter leading-none">{s.value}</p>
              <span className="text-xs font-black text-[var(--status-success)] uppercase tracking-widest">{s.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Active challenges (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-[var(--theme-secondary)] rounded-full" />
              <h3 className="text-xl font-black uppercase tracking-tighter text-[var(--theme-text)] italic">Active Hire Challenges</h3>
            </div>
            <button className="text-xs font-black text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] uppercase tracking-wider italic transition-colors">
              View History
            </button>
          </div>

          <div className="space-y-5">
            {[1, 2].map(i => (
              <div key={i}
                onClick={() => navigate(`/company/challenges/CHG-00${i}`)}
                className="p-8 bg-[var(--theme-card)]/60 border border-[var(--theme-border)] rounded-[3rem] group cursor-pointer hover:border-[var(--theme-primary)]/40 hover:bg-[var(--theme-card)] transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-lg bg-[var(--theme-primary)]/5 border border-[var(--theme-primary)]/20 text-xs font-black uppercase text-[var(--theme-primary)]">
                      Dev Architecture
                    </span>
                    <span className="text-xs font-black uppercase text-[var(--theme-text-muted)] italic opacity-50">ID: CHG-00{i}-X9</span>
                  </div>
                  <h4 className="text-2xl font-black uppercase text-[var(--theme-text)] group-hover:text-[var(--theme-primary)] transition-colors italic tracking-tighter leading-none">
                    UI Systems Architect Lead
                  </h4>
                  <div className="flex items-center gap-6">
                    <span className="flex items-center gap-2 text-xs font-black uppercase text-[var(--theme-text-muted)] italic opacity-60">
                      <FiActivity size={13} className="text-[var(--theme-primary)]" /> 24 Submissions
                    </span>
                    <span className="flex items-center gap-2 text-xs font-black uppercase text-[var(--theme-text-muted)] italic opacity-60">
                      <FiUsers size={13} className="text-[var(--theme-primary)]" /> 12 Shortlisted
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-5 shrink-0">
                  <div className="text-right">
                    <span className="block text-xs font-black text-[var(--status-success)] uppercase tracking-wide italic mb-1">Evaluating</span>
                    <div className="h-1 w-20 bg-[var(--status-success)]/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--status-success)] w-3/4 animate-pulse" />
                    </div>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-muted)] group-hover:bg-[var(--theme-primary)] group-hover:text-white group-hover:scale-110 transition-all">
                    <FiChevronRight size={22} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions (4 cols) */}
        <div className="lg:col-span-4 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-[var(--theme-text)] rounded-full" />
            <h3 className="text-xl font-black uppercase tracking-tighter text-[var(--theme-text)] italic">Quick Actions</h3>
          </div>

          <div className="space-y-5">
            <div onClick={() => navigate('/discover/talent')}
              className="p-8 bg-[var(--theme-text)] rounded-3xl text-[var(--theme-bg)] group cursor-pointer hover:scale-[1.02] transition-all shadow-2xl shadow-black/20 relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-6 border border-white/10 group-hover:rotate-12 transition-transform">
                  <FiSearch size={22} />
                </div>
                <h4 className="text-lg font-black uppercase text-white mb-2 italic">Talent Uplink</h4>
                <p className="text-xs text-white/40 mb-6 font-medium italic leading-relaxed">Search verified domain specialists across GzoneSphere.</p>
                <p className="text-xs font-black text-[var(--theme-primary)] uppercase tracking-wider italic group-hover:translate-x-2 transition-transform">Initiate Session →</p>
              </div>
              <FiCommand size={180} className="absolute bottom-[-40px] right-[-40px] text-white/5 -rotate-12" />
            </div>

            <div onClick={() => navigate('/company/team-builder')}
              className="p-8 bg-[var(--theme-card)]/60 border border-[var(--theme-border)] rounded-3xl group cursor-pointer hover:border-[var(--theme-primary)]/40 hover:bg-[var(--theme-card)] transition-all shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-[var(--theme-primary)] text-white flex items-center justify-center mb-6 shadow-xl shadow-[var(--theme-primary)]/20 group-hover:-rotate-12 transition-transform">
                <FiLayers size={22} />
              </div>
              <h4 className="text-lg font-black uppercase text-[var(--theme-text)] mb-2 italic">Team Assembler</h4>
              <p className="text-xs text-[var(--theme-text-muted)] mb-6 font-medium italic leading-relaxed">Model high-performance teams through cross-domain skill sync.</p>
              <p className="text-xs font-black text-[var(--theme-primary)] uppercase tracking-wider italic group-hover:translate-x-2 transition-transform">Execute Simulation →</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Root page ────────────────────────────────────────────────────────────────
const CompanyDashboard = () => {
  const navigate = useNavigate();
  const { useMyCompany, useCompanyAnalytics } = useCompany();
  const { data: company }   = useMyCompany();
  const { data: analytics } = useCompanyAnalytics(company?.slug);

  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] theme-community font-body flex flex-col selection:bg-[var(--theme-primary)]/30">
      <Helmet>
        <title>Ops Board | GzoneSphere</title>
      </Helmet>

      {/* Sticky header */}
      <div className="bg-[var(--theme-card)]/60 backdrop-blur-3xl border-b border-[var(--theme-border)] sticky top-0 z-20 px-6 lg:px-12 py-5">
        <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-[var(--theme-text)] text-[var(--theme-bg)] flex items-center justify-center shadow-lg">
              <FiBriefcase size={22} />
            </div>
            <div>
              <p className="text-[0.65rem] font-black uppercase tracking-widest text-[var(--theme-primary)] italic leading-none mb-1">Company Dashboard</p>
              <h1 className="text-xl font-black uppercase text-[var(--theme-text)] italic tracking-tighter leading-none">
                {company?.name || 'Nexus Interactive'}
              </h1>
            </div>
          </div>
          <button
            onClick={() => navigate('/company/challenges/new')}
            className="gzs-btn-primary !px-8 !py-3.5 flex items-center gap-3 italic text-sm">
            <FiPlus size={15} strokeWidth={3} /> New Hire Challenge
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-[var(--theme-border)] px-6 lg:px-12 bg-[var(--theme-card)]/30">
        <div className="max-w-[1700px] mx-auto flex items-center gap-0">
          { }
          {TABS.map(({ id, label, icon: TAB_ICON }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                activeTab === id
                  ? 'border-[var(--theme-primary)] text-[var(--theme-primary)]'
                  : 'border-transparent text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'
              }`}>
              <TAB_ICON size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <main className="flex-1 max-w-[1700px] mx-auto w-full pb-40 px-6 lg:px-12 pt-12">
        {activeTab === 'overview'  && <TabOverview navigate={navigate} />}
        {activeTab === 'analytics' && <DashboardAnalytics analytics={analytics || MOCK_ANALYTICS} />}
        {activeTab === 'talent'    && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-[var(--theme-primary)] rounded-full" />
              <h2 className="text-xl font-black uppercase tracking-tighter text-[var(--theme-text)] italic">
                Talent Pool <span className="text-[var(--theme-text-muted)] font-normal text-sm normal-case tracking-normal italic ml-2">(admin only — never shown publicly)</span>
              </h2>
            </div>
            <TalentPool />
          </div>
        )}
      </main>
    </div>
  );
};

export default CompanyDashboard;
