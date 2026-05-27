import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import { mockApiService } from '@services/mockApiService';
import { useToast } from '@/shared/components/Toast';
import { AdminPageHero, AdminPanel, AdminMetrics, AdminStatusBadge, AdminEmptyState } from '../components/AdminContentShell';
import { safeString, slugify } from '../components/adminFormUtils';

const STATUS_FILTERS = ['all', 'draft', 'registration open', 'registration closed', 'live', 'completed', 'cancelled', 'upcoming'];
const DOMAIN_FILTERS = ['all', 'esports', 'art', 'writing', 'music', 'dev', 'general'];
const PRIZE_FILTERS = ['all', 'free', 'cash prize', 'in-platform rewards', 'both'];

function normalizeTournament(tournament) {
  const rawStatus = safeString(tournament.status || 'Draft').replace(/_/g, ' ').toLowerCase();
  return {
    id: tournament.id,
    name: safeString(tournament.name || tournament.title),
    slug: safeString(tournament.slug || slugify(tournament.name || tournament.title || 'tournament')),
    domain: safeString(tournament.domain || tournament.type || 'Esports').toLowerCase(),
    game: safeString(tournament.game || ''),
    format: safeString(tournament.format || tournament.bracket_type || 'Team'),
    status: rawStatus,
    registrations: Number(tournament.current_participants || 0),
    maxParticipants: Number(tournament.max_participants || tournament.maxParticipants || tournament.slots || 0),
    startDate: safeString(tournament.start_date || tournament.tournamentStart || tournament.date || ''),
    prizePool: safeString(tournament.totalPrizePool || tournament.prize || 'Free'),
    organiser: safeString(tournament.organiser || 'Gzone Admin'),
  };
}

function toneForStatus(status) {
  if (status === 'live' || status === 'registration open' || status === 'upcoming') return 'success';
  if (status === 'draft' || status === 'registration closed') return 'warning';
  return 'danger';
}

export default function TournamentsManagement() {
  usePageTheme('admin');

  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data = [], refetch } = useQuery({
    queryKey: ['admin', 'tournaments'],
    queryFn: mockApiService.getAllTournaments,
  });

  const tournaments = useMemo(() => data.map(normalizeTournament), [data]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [domain, setDomain] = useState('all');
  const [prizeType, setPrizeType] = useState('all');

  const filtered = useMemo(() => {
    return tournaments.filter((tournament) => {
      const matchesSearch = !search || tournament.name.toLowerCase().includes(search.toLowerCase()) || tournament.slug.includes(search.toLowerCase());
      const matchesStatus = status === 'all' || tournament.status === status;
      const matchesDomain = domain === 'all' || tournament.domain === domain;
      const prizeText = tournament.prizePool.toLowerCase();
      const matchesPrize = prizeType === 'all'
        || (prizeType === 'free' && prizeText === 'free')
        || (prizeType === 'cash prize' && /inr|cash|\$|₹/.test(prizeText))
        || (prizeType === 'in-platform rewards' && /gzs|coins|xp/.test(prizeText))
        || (prizeType === 'both' && /gzs|coins|xp/.test(prizeText) && /inr|cash|\$|₹/.test(prizeText));
      return matchesSearch && matchesStatus && matchesDomain && matchesPrize;
    });
  }, [domain, prizeType, search, status, tournaments]);

  async function removeTournament(id) {
    await mockApiService.deleteTournament(id);
    showToast('Tournament deleted.', 'success');
    refetch();
  }

  const metrics = [
    { label: 'Tournaments', value: `${tournaments.length}` },
    { label: 'Live', value: `${tournaments.filter((tournament) => tournament.status === 'live').length}` },
    { label: 'Registration Open', value: `${tournaments.filter((tournament) => tournament.status === 'registration open' || tournament.status === 'upcoming').length}` },
    { label: 'Filtered', value: `${filtered.length}` },
  ];

  return (
    <div className="admin-page-shell admin-table-page">
      <Helmet>
        <title>Tournaments Management | GzoneSphere Admin</title>
      </Helmet>

      <AdminPageHero
        kicker="Admin / Tournaments"
        title="Tournaments Management"
        description="Operational overview for all tournaments, with filters and actions aligned to the public tournament ecosystem and the detailed admin spec."
        actions={(
          <>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => refetch()}>Refresh</button>
            <button type="button" className="admin-btn" onClick={() => navigate('/admin/tournaments/create')}>Create Tournament</button>
          </>
        )}
      />

      <AdminMetrics items={metrics} />

      <AdminPanel title="Tournaments Management Table" meta="Banner, tournament name, game/domain, format, status, registrations, start date, prize pool, organiser, and actions.">
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[280px]">
            <input 
              value={search} 
              onChange={(event) => setSearch(event.target.value)} 
              placeholder="Search by name or slug"
              className="admin-input"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select 
              value={domain} 
              onChange={(event) => setDomain(event.target.value)}
              className="admin-select"
            >
              {DOMAIN_FILTERS.map((option) => <option key={option} value={option}>{option.toUpperCase()}</option>)}
            </select>
            <select 
              value={status} 
              onChange={(event) => setStatus(event.target.value)}
              className="admin-select"
            >
              {STATUS_FILTERS.map((option) => <option key={option} value={option}>{option.toUpperCase()}</option>)}
            </select>
            <select 
              value={prizeType} 
              onChange={(event) => setPrizeType(event.target.value)}
              className="admin-select"
            >
              {PRIZE_FILTERS.map((option) => <option key={option} value={option}>{option.toUpperCase()}</option>)}
            </select>
          </div>
        </div>

        {filtered.length ? (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr className="bg-[var(--theme-bg-alt)] border-b-2 border-[var(--theme-border)]">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)]">Tournament</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)]">Game / Domain</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)]">Format</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)]">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] text-center">Registrations</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)]">Start Date</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)]">Prize Pool</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)]">Organiser</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[var(--theme-border)]">
                {filtered.map((tournament) => (
                  <tr key={tournament.id} className="hover:bg-[var(--theme-bg-alt)]/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <strong className="text-sm font-bold text-[var(--theme-text)]">{tournament.name}</strong>
                        <span className="text-[10px] font-mono text-[var(--theme-text-muted)] opacity-60">/{tournament.slug}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs font-bold text-[var(--theme-text-muted)] uppercase italic">{tournament.game || tournament.domain}</td>
                    <td className="px-6 py-5 text-xs font-bold text-[var(--theme-text-muted)] uppercase italic">{tournament.format}</td>
                    <td className="px-6 py-5">
                      <span 
                        className="admin-status-badge"
                        style={
                          toneForStatus(tournament.status) === 'success'
                            ? { background: 'var(--status-success-bg)', color: 'var(--status-success-text)' }
                            : toneForStatus(tournament.status) === 'warning'
                            ? { background: 'var(--status-draft-bg)', color: 'var(--status-draft-text)' }
                            : { background: 'var(--status-danger-bg)', color: 'var(--status-danger-text)' }
                        }
                      >
                        {tournament.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center text-xs font-bold text-[var(--theme-text)] tabular-nums">
                      {tournament.registrations} <span className="opacity-30">/</span> {tournament.maxParticipants || '—'}
                    </td>
                    <td className="admin-table-cell-meta">{tournament.startDate || 'TBD'}</td>
                    <td className="px-6 py-5 text-xs font-bold text-[var(--theme-primary)] italic uppercase">{tournament.prizePool}</td>
                    <td className="px-6 py-5 text-xs font-bold text-[var(--theme-text-muted)] italic">{tournament.organiser}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button type="button" className="admin-btn" onClick={() => navigate(`/admin/tournaments/${tournament.id}/edit`)}>Edit</button>
                        <button type="button" className="admin-btn" onClick={() => navigate(`/admin/tournaments/${tournament.id}/registrations`)}>Reg</button>
                        <button type="button" className="admin-btn" onClick={() => navigate(`/admin/tournaments/${tournament.id}/brackets`)}>Brackets</button>
                        <Link to={`/admin/tournaments/${tournament.id}/analytics`} className="admin-btn">Analytics</Link>
                        <button type="button" className="p-2 text-[var(--status-error)] hover:bg-[var(--status-error-soft)] rounded-xl transition-colors" onClick={() => removeTournament(tournament.id)}>
                           <FiX size={14} strokeWidth={3} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminEmptyState title="No tournaments match the current filters" description="Try a broader domain or status filter." />
        )}
      </AdminPanel>

      <AdminPanel title="Tournament Operations" meta="Pointers for registrations, bracket management, and analytics views.">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 rounded-3xl border-2 border-[var(--theme-border)] bg-[var(--theme-card)] shadow-sm hover:border-[var(--theme-primary)]/30 transition-all group">
            <strong className="text-xs font-black uppercase tracking-widest text-[var(--theme-text)] group-hover:text-[var(--theme-primary)] transition-colors">Registration Management</strong>
            <p className="mt-4 text-xs font-bold leading-relaxed text-[var(--theme-text-muted)] italic opacity-80">Use each tournament row to open registrations and manage approval, disqualification, export, and capacity changes.</p>
          </div>
          <div className="p-6 rounded-3xl border-2 border-[var(--theme-border)] bg-[var(--theme-card)] shadow-sm hover:border-[var(--theme-primary)]/30 transition-all group">
            <strong className="text-xs font-black uppercase tracking-widest text-[var(--theme-text)] group-hover:text-[var(--theme-primary)] transition-colors">Bracket Management</strong>
            <p className="mt-4 text-xs font-bold leading-relaxed text-[var(--theme-text-muted)] italic opacity-80">Bracket routes are wired through dynamic per-tournament paths so generation and editing no longer break on shared pages.</p>
          </div>
          <div className="p-6 rounded-3xl border-2 border-[var(--theme-border)] bg-[var(--theme-card)] shadow-sm hover:border-[var(--theme-primary)]/30 transition-all group sm:col-span-2 lg:col-span-1">
            <strong className="text-xs font-black uppercase tracking-widest text-[var(--theme-text)] group-hover:text-[var(--theme-primary)] transition-colors">Analytics</strong>
            <p className="mt-4 text-xs font-bold leading-relaxed text-[var(--theme-text-muted)] italic opacity-80">Use the tournament detail flow to extend registration funnels, region breakdowns, and prize payout tracking.</p>
          </div>
        </div>
      </AdminPanel>
    </div>
  );
}
