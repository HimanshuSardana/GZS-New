import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import { SettingsField, SettingsSection, SettingsShell } from '../components/SettingsShell';
import { useSettingsForm } from '../useSettingsForm';
import core from '@/services/api/core';

const ACTIVE_SESSIONS = [
  { id: 'session-1', device: 'Chrome on Windows 11', ip: '103.42.18.11', location: 'Mumbai, India', current: true, lastSeen: 'Active now' },
  { id: 'session-2', device: 'Safari on iPhone 15', ip: '103.42.18.11', location: 'Mumbai, India', current: false, lastSeen: '2 hours ago' },
  { id: 'session-3', device: 'Edge on Surface Pro', ip: '182.74.88.204', location: 'Pune, India', current: false, lastSeen: 'Yesterday' },
];

const LOGIN_HISTORY = [
  { id: 'login-1', ip: '103.42.18.11', device: 'Chrome on Windows 11', time: '2026-04-26 10:12 IST', location: 'Mumbai, India' },
  { id: 'login-2', ip: '103.42.18.11', device: 'Safari on iPhone 15', time: '2026-04-25 21:03 IST', location: 'Mumbai, India' },
  { id: 'login-3', ip: '182.74.88.204', device: 'Edge on Surface Pro', time: '2026-04-24 08:18 IST', location: 'Pune, India' },
  { id: 'login-4', ip: '45.113.12.90', device: 'Firefox on Linux', time: '2026-04-23 19:42 IST', location: 'Bengaluru, India' },
];

function getStrengthLabel(score) {
  if (score < 2) return { text: 'Weak', color: 'bg-red-500' };
  if (score < 4) return { text: 'Medium', color: 'bg-amber-500' };
  return { text: 'Strong', color: 'bg-emerald-500' };
}

export default function SecurityPassword() {
  usePageTheme('profile');

  const { values, isSaving, isDirty, handleChange, handleSave } = useSettingsForm(
    () => Promise.resolve({ current_password: '', new_password: '', confirm_password: '' }),
    (data) => {
      if (data.new_password !== data.confirm_password) throw new Error('Passwords do not match');
      if (data.new_password.length < 8) throw new Error('Password too short (min 8 chars)');
      return core.post('/auth/change-password', {
        current_password: data.current_password,
        new_password: data.new_password
      });
    }
  );

  const strengthScore = useMemo(() => {
    const pwd = values.new_password || '';
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    return score;
  }, [values.new_password]);

  const strength = getStrengthLabel(strengthScore);

  return (
    <>
      <Helmet>
        <title>Security Settings | GzoneSphere</title>
      </Helmet>
      <SettingsShell
        title="Security & Password"
        subtitle="Manage password hygiene, two-factor authentication, and account access history."
      >
        <SettingsSection
          title="Change Password"
          description="Update your password and review its strength before saving."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <SettingsField label="Current Password">
              <input
                type="password"
                className="pr-input"
                value={values.current_password || ''}
                onChange={(e) => handleChange('current_password', e.target.value)}
                placeholder="••••••••"
              />
            </SettingsField>
            <div />
            <SettingsField label="New Password">
              <input
                type="password"
                className="pr-input"
                value={values.new_password || ''}
                onChange={(e) => handleChange('new_password', e.target.value)}
                placeholder="••••••••"
              />
            </SettingsField>
            <SettingsField label="Confirm New Password">
              <input
                type="password"
                className="pr-input"
                value={values.confirm_password || ''}
                onChange={(e) => handleChange('confirm_password', e.target.value)}
                placeholder="••••••••"
              />
            </SettingsField>
          </div>
          <div className="mt-5 rounded-2xl bg-[var(--theme-bg-alt)] p-6 border border-[var(--theme-border)]">
            <div className="flex items-center justify-between gap-4 mb-3">
              <span className="text-xs font-black uppercase tracking-widest text-[var(--theme-text)] italic">Security Matrix</span>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${strengthScore >= 3 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                {strength.text}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--theme-border)]">
              <div className={`${strength.color} h-full rounded-full transition-all duration-500 shadow-[0_0_8px] shadow-current`} style={{ width: `${Math.max(8, strengthScore * 25)}%` }} />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              className="pr-btn-primary"
              disabled={!isDirty || isSaving}
              onClick={handleSave}
            >
              {isSaving ? 'SAVING...' : 'Update Password'}
            </button>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Active Sessions"
          description="Review devices currently signed in to your account."
        >
          <div className="space-y-4">
            {ACTIVE_SESSIONS.map((session) => (
              <div key={session.id} className="flex flex-col gap-4 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold text-[var(--theme-text)]">{session.device}</p>
                  <p className="mt-1 text-xs text-[var(--theme-text-muted)] font-medium">{session.location} | {session.ip} | {session.lastSeen}</p>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl border border-[var(--theme-border)] text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] transition-colors disabled:opacity-30"
                  disabled={session.current}
                >
                  {session.current ? 'CURRENT' : 'REVOKE'}
                </button>
              </div>
            ))}
          </div>
        </SettingsSection>

        <SettingsSection
          title="Login History"
          description="Last 10 sign-in events including IP address and location."
        >
          <div className="overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--theme-bg-alt)] border-b border-[var(--theme-border)]">
                <tr>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[var(--theme-text-muted)]">IP Address</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[var(--theme-text-muted)]">Terminal</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[var(--theme-text-muted)]">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--theme-border)]">
                {LOGIN_HISTORY.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--theme-bg-alt)] transition-colors">
                    <td className="px-6 py-4 font-mono text-[var(--theme-text)]">{item.ip}</td>
                    <td className="px-6 py-4 text-[var(--theme-text)]">{item.device}</td>
                    <td className="px-6 py-4 text-[var(--theme-text-muted)]">{item.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SettingsSection>
      </SettingsShell>
    </>
  );
}
