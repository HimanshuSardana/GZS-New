import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiBell, FiSend, FiUsers, FiMail, FiAlertTriangle } from 'react-icons/fi';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import { useToast } from '@/shared/components/Toast';
import { AdminPageHero, AdminPanel } from '../../components/AdminContentShell';

// ── Mock history ─── TODO: replace with useQuery calling GET /admin/notifications/history
const MOCK_HISTORY = [
  { id: 'n1', title: 'New Tournament Season!', body: 'Register for the Spring 2026 Championship.', type: 'announcement', audience_size: 18420, channel: 'both', sent_at: '2026-05-15T10:00:00+05:30', delivery_rate: 0.94, open_rate: 0.31, sent_by: 'admin_jaya' },
  { id: 'n2', title: 'Scheduled Maintenance', body: 'GzoneSphere will be down May 22, 2am–4am IST.', type: 'maintenance', audience_size: 18420, channel: 'both', sent_at: '2026-05-10T08:00:00+05:30', delivery_rate: 0.97, open_rate: 0.52, sent_by: 'admin_ryan' },
  { id: 'n3', title: 'New Feature: AI Profile Headlines', body: 'AI headlines now available in sub-profile creation.', type: 'feature_update', audience_size: 12340, channel: 'in_app', sent_at: '2026-05-05T14:00:00+05:30', delivery_rate: 0.91, open_rate: 0.24, sent_by: 'admin_maya' },
  { id: 'n4', title: 'Skill Verification Reminder', body: 'Complete pending verifications to boost trust score.', type: 'platform_news', audience_size: 3820, channel: 'in_app', sent_at: '2026-04-28T11:00:00+05:30', delivery_rate: 0.88, open_rate: 0.19, sent_by: 'admin_jaya' },
];

const NOTIFICATION_TYPES = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'feature_update', label: 'Feature Update' },
  { value: 'tournament', label: 'Tournament' },
  { value: 'platform_news', label: 'Platform News' },
];

const PLATFORM_LEVELS = ['Beginner', 'Hustler', 'Extreme', 'Pro'];
const DOMAINS = ['dev', 'esports', 'art', 'content', 'business', 'writing', 'audio'];

const TYPE_COLOURS = {
  announcement:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  maintenance:    'bg-amber-500/10 text-amber-400 border-amber-500/20',
  feature_update: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  tournament:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  platform_news:  'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

function DeliveryBar({ rate }) {
  const pct = Math.round(rate * 100);
  const colour = pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 w-20 rounded-full bg-slate-700">
        <div className={`absolute left-0 top-0 h-1.5 rounded-full ${colour}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-[var(--theme-text-muted)]">{pct}%</span>
    </div>
  );
}

export default function NotificationsAdmin() {
  usePageTheme('admin');
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('announcement');
  const [audienceAll, setAudienceAll] = useState(true);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [channel, setChannel] = useState('both');
  const [scheduleNow, setScheduleNow] = useState(true);
  const [scheduleAt, setScheduleAt] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);

  const estimatedReach = useMemo(() => {
    let base = 18420;
    if (!audienceAll) {
      if (selectedLevels.length > 0) base = Math.round(base * (selectedLevels.length / 4));
      if (selectedDomains.length > 0) base = Math.round(base * (selectedDomains.length / 7) * 0.6);
    }
    return Math.max(base, 100);
  }, [audienceAll, selectedLevels, selectedDomains]);

  function toggleMulti(setter, value) {
    setter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  }

  function handleConfirmSend() {
    // TODO: adminApi.post('/admin/notifications/broadcast', { title, body, type, audience_all: audienceAll, ... })
    showToast(`Notification queued — sending to ~${estimatedReach.toLocaleString()} users.`, 'success');
    setConfirmOpen(false);
    setTitle(''); setBody(''); setAudienceAll(true);
    setSelectedLevels([]); setSelectedDomains([]);
    setChannel('both'); setScheduleNow(true); setScheduleAt('');
  }

  const ic = 'admin-input w-full';
  const lc = 'admin-label block mb-1';

  return (
    <div className="admin-page-shell">
      <Helmet><title>Notifications Admin | GzoneSphere Admin</title></Helmet>
      <AdminPageHero kicker="Platform" title="Notifications" description="Send platform-wide broadcasts and review delivery history." />

      <AdminPanel title="Send Platform Broadcast" meta="Reaches all users matching the audience filter">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: content */}
          <div className="space-y-5">
            <div>
              <label className={lc}>Title <span className="opacity-40 text-[10px] font-normal">{title.length}/80</span></label>
              <input className={ic} maxLength={80} value={title} onChange={e => setTitle(e.target.value)} placeholder="Notification title…" />
            </div>
            <div>
              <label className={lc}>Body <span className="opacity-40 text-[10px] font-normal">{body.length}/200</span></label>
              <textarea className={`${ic} resize-none`} rows={4} maxLength={200} value={body} onChange={e => setBody(e.target.value)} placeholder="Notification body text…" />
            </div>
            <div>
              <label className={lc}>Type</label>
              <select className="admin-select w-full" value={type} onChange={e => setType(e.target.value)}>
                {NOTIFICATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className={lc}>Delivery Channel</label>
              <div className="flex gap-4">
                {[{ value: 'in_app', label: 'In-app only' }, { value: 'email', label: 'Email only' }, { value: 'both', label: 'Both' }].map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm text-[var(--theme-text)]">
                    <input type="radio" name="channel" value={opt.value} checked={channel === opt.value} onChange={() => setChannel(opt.value)} className="accent-[var(--theme-primary)]" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={lc}>Schedule</label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--theme-text)]">
                  <input type="radio" name="schedule" checked={scheduleNow} onChange={() => setScheduleNow(true)} className="accent-[var(--theme-primary)]" />
                  Send now
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--theme-text)]">
                  <input type="radio" name="schedule" checked={!scheduleNow} onChange={() => setScheduleNow(false)} className="accent-[var(--theme-primary)]" />
                  Schedule for later (IST)
                </label>
                {!scheduleNow && <input type="datetime-local" className={ic} value={scheduleAt} onChange={e => setScheduleAt(e.target.value)} />}
              </div>
            </div>
          </div>

          {/* Right: audience + reach + send */}
          <div className="space-y-5">
            <div>
              <label className={lc}>Audience</label>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--theme-text)]">
                  <input type="radio" name="audience" checked={audienceAll} onChange={() => setAudienceAll(true)} className="accent-[var(--theme-primary)]" /> All users
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--theme-text)]">
                  <input type="radio" name="audience" checked={!audienceAll} onChange={() => setAudienceAll(false)} className="accent-[var(--theme-primary)]" /> Filtered segment
                </label>
              </div>
              {!audienceAll && (
                <div className="space-y-4 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] p-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-[var(--theme-text-muted)] mb-2">Platform Level</p>
                    <div className="flex flex-wrap gap-2">
                      {PLATFORM_LEVELS.map(level => (
                        <button key={level} type="button" onClick={() => toggleMulti(setSelectedLevels, level)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${selectedLevels.includes(level) ? 'bg-[var(--theme-primary)] text-white border-[var(--theme-primary)]' : 'border-[var(--theme-border)] text-[var(--theme-text-muted)]'}`}>
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-[var(--theme-text-muted)] mb-2">Domain Sub-profile</p>
                    <div className="flex flex-wrap gap-2">
                      {DOMAINS.map(domain => (
                        <button key={domain} type="button" onClick={() => toggleMulti(setSelectedDomains, domain)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${selectedDomains.includes(domain) ? 'bg-[var(--theme-primary)] text-white border-[var(--theme-primary)]' : 'border-[var(--theme-border)] text-[var(--theme-text-muted)]'}`}>
                          {domain}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-4">
              <div className="flex items-center gap-2 mb-1">
                <FiUsers size={14} className="text-[var(--theme-primary)]" />
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--theme-text-muted)]">Estimated reach</span>
              </div>
              <p className="text-2xl font-black text-[var(--theme-text)]">~{estimatedReach.toLocaleString()}</p>
              {channel !== 'in_app' && (
                <p className="text-xs text-[var(--theme-text-muted)] mt-1">
                  <FiMail size={11} className="inline mr-1" />
                  ~{Math.round(estimatedReach * 0.965).toLocaleString()} will also receive email
                </p>
              )}
            </div>

            <button type="button" className="admin-btn w-full flex items-center justify-center gap-2"
              onClick={() => { setConfirmChecked(false); setConfirmOpen(true); }}
              disabled={!title.trim() || !body.trim()}>
              <FiSend size={14} /> Preview &amp; Send
            </button>
          </div>
        </div>
      </AdminPanel>

      {/* History table */}
      <AdminPanel title="Notification History" meta="Last broadcasts sent">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr><th>Title</th><th>Type</th><th>Audience</th><th>Channel</th><th>Sent</th><th>Delivery</th><th>Open rate</th></tr>
            </thead>
            <tbody>
              {MOCK_HISTORY.map(n => (
                <tr key={n.id}>
                  <td>
                    <p className="text-sm font-semibold text-[var(--theme-text)]">{n.title}</p>
                    <p className="text-xs text-[var(--theme-text-muted)] truncate max-w-xs">{n.body}</p>
                  </td>
                  <td><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border ${TYPE_COLOURS[n.type] || TYPE_COLOURS.platform_news}`}>{n.type.replace('_', ' ')}</span></td>
                  <td className="text-sm font-semibold text-[var(--theme-text)]">{n.audience_size.toLocaleString()}</td>
                  <td className="text-xs text-[var(--theme-text-muted)] capitalize">{n.channel.replace('_', '-')}</td>
                  <td className="text-xs text-[var(--theme-text-muted)]">
                    {new Date(n.sent_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    <br /><span className="opacity-50">by {n.sent_by}</span>
                  </td>
                  <td><DeliveryBar rate={n.delivery_rate} /></td>
                  <td><DeliveryBar rate={n.open_rate} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminPanel>

      {/* Confirmation modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[var(--theme-card)] border border-[var(--theme-border)] p-6 shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <FiAlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-bold text-[var(--theme-text)]">Confirm broadcast</h2>
                <p className="text-sm text-[var(--theme-text-muted)] mt-1">
                  You are about to notify <strong className="text-[var(--theme-text)]">~{estimatedReach.toLocaleString()} users</strong>.
                  {channel !== 'in_app' && <> This also sends email to ~{Math.round(estimatedReach * 0.965).toLocaleString()} subscribers.</>}
                </p>
                <p className="text-xs text-rose-400 mt-2 font-semibold">This action cannot be undone.</p>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] p-3 mb-4 text-xs text-[var(--theme-text-muted)]">
              <strong className="text-[var(--theme-text)]">{title}</strong>
              <p className="mt-1">{body}</p>
            </div>
            <label className="flex items-start gap-3 cursor-pointer mb-5">
              <input type="checkbox" className="mt-0.5 accent-[var(--theme-primary)]" checked={confirmChecked} onChange={e => setConfirmChecked(e.target.checked)} />
              <span className="text-sm text-[var(--theme-text)]">I confirm this broadcast is intentional and the content is correct.</span>
            </label>
            <div className="flex justify-end gap-3">
              <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button type="button" className="admin-btn flex items-center gap-2" disabled={!confirmChecked} onClick={handleConfirmSend}>
                <FiSend size={14} /> Send notification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
