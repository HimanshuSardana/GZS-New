import { Helmet } from 'react-helmet-async';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import { SettingsSection, SettingsShell } from '../components/SettingsShell';
import { useSettingsForm } from '../useSettingsForm';
import core from '@/services/api/core';
import { CORE } from '@/services/api/endpoints';
import Skeleton from '@/shared/components/Skeleton';
import { FiToggleLeft, FiToggleRight } from 'react-icons/fi';

const EMAIL_NOTIFICATIONS = [
  { key: 'tournamentUpdates', label: 'Tournament updates', description: 'Bracket changes, registration reminders, and result notices.' },
  { key: 'newFollowers', label: 'New followers', description: 'Get emailed when someone follows your account.' },
  { key: 'skillVerifications', label: 'Skill verifications', description: 'Review outcomes for submitted proof and endorsements.' },
  { key: 'platformNews', label: 'Platform news', description: 'Product updates, launches, and release announcements.' },
];

const IN_APP_NOTIFICATIONS = [
  { key: 'messages', label: 'Messages', description: 'Direct messages and inbox updates.' },
  { key: 'mentions', label: 'Mentions', description: 'When someone tags you in posts or threads.' },
  { key: 'friendRequests', label: 'Friend requests', description: 'Incoming connection requests from other members.' },
  { key: 'achievements', label: 'Achievements', description: 'Milestones, verification badges, and progress unlocks.' },
];

function ToggleRow({ label, description, checked, onChange, isLoading }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] p-5 transition-all">
      <div className="min-w-0">
        <p className="text-sm font-bold text-[var(--theme-text)] uppercase tracking-tight italic">{label}</p>
        <p className="mt-1 text-xs text-[var(--theme-text-muted)] font-medium leading-relaxed italic opacity-80">{description}</p>
      </div>
      {isLoading ? <Skeleton className="h-8 w-12 rounded-full" /> : (
        <button
          type="button"
          onClick={onChange}
          className={`transition-colors duration-200 ${checked ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-text-muted)] opacity-30'}`}
        >
          {checked ? <FiToggleRight size={36} /> : <FiToggleLeft size={36} />}
        </button>
      )}
    </div>
  );
}

export default function NotificationSettings() {
  usePageTheme('profile');

  const { values, isLoading, isSaving, isDirty, handleChange, handleSave } = useSettingsForm(
    () => core.get(CORE.NOTIFICATIONS.LIST + '/settings').then(r => r.data),
    (data) => core.patch('/notifications/settings', data)
  );

  return (
    <>
      <Helmet>
        <title>Notification Settings | GzoneSphere</title>
      </Helmet>
      <SettingsShell
        title="Notification Settings"
        subtitle="Choose how often GzoneSphere contacts you and which events should create alerts."
      >
        <SettingsSection
          title="Email Notifications"
          description="Control which important platform updates should reach your inbox."
        >
          <div className="space-y-4">
            {EMAIL_NOTIFICATIONS.map((item) => (
              <ToggleRow
                key={item.key}
                {...item}
                checked={values[item.key]}
                onChange={() => handleChange(item.key, !values[item.key])}
                isLoading={isLoading}
              />
            ))}
          </div>
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              className="pr-btn-primary"
              disabled={!isDirty || isSaving}
              onClick={handleSave}
            >
              {isSaving ? 'SAVING...' : 'Save Preferences'}
            </button>
          </div>
        </SettingsSection>

        <SettingsSection
          title="In-App Notifications"
          description="Choose which activity should appear in your notification center."
        >
          <div className="space-y-4">
            {IN_APP_NOTIFICATIONS.map((item) => (
              <ToggleRow
                key={item.key}
                {...item}
                checked={values[item.key]}
                onChange={() => handleChange(item.key, !values[item.key])}
                isLoading={isLoading}
              />
            ))}
          </div>
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              className="pr-btn-primary"
              disabled={!isDirty || isSaving}
              onClick={handleSave}
            >
              {isSaving ? 'SAVING...' : 'Save Preferences'}
            </button>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Digest Frequency"
          description="Set how often you want a summary email when individual alerts are not urgent."
        >
          <div className="grid gap-3 md:grid-cols-3">
            {['Daily', 'Weekly', 'Never'].map((option) => (
              <button
                key={option}
                type="button"
                className={`rounded-2xl border-2 px-4 py-5 text-xs font-black uppercase tracking-widest transition-all italic ${
                  values.digestFrequency === option
                    ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white shadow-lg shadow-[var(--theme-primary)]/20'
                    : 'border-[var(--theme-border)] bg-[var(--theme-bg-alt)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-card)]'
                }`}
                onClick={() => handleChange('digestFrequency', option)}
                disabled={isLoading}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              className="pr-btn-primary"
              disabled={!isDirty || isSaving}
              onClick={handleSave}
            >
              {isSaving ? 'SAVING...' : 'Save Preferences'}
            </button>
          </div>
        </SettingsSection>
      </SettingsShell>
    </>
  );
}
