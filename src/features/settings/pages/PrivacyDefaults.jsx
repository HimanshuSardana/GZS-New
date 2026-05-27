import { Helmet } from 'react-helmet-async';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import { SettingsField, SettingsSection, SettingsShell } from '../components/SettingsShell';
import { useSettingsForm } from '../useSettingsForm';
import core from '@/services/api/core';
import Skeleton from '@/shared/components/Skeleton';

const OPTIONS = {
  profile_visibility: ['public', 'friends', 'private'],
  allow_messages_from: ['everyone', 'friends', 'nobody'],
  show_online_status: ['true', 'false'],
};

export default function PrivacyDefaults() {
  usePageTheme('profile');

  const { values, isLoading, isSaving, isDirty, handleChange, handleSave } = useSettingsForm(
    () => core.get('/privacy/settings').then(r => r.data),
    (data) => core.patch('/privacy/settings', data)
  );

  return (
    <>
      <Helmet>
        <title>Privacy Settings | GzoneSphere</title>
      </Helmet>
      <SettingsShell
        title="Privacy Defaults"
        subtitle="Set the default audience and contact rules that shape how others can find and interact with you."
      >
        <SettingsSection
          title="Privacy Rules"
          description="These defaults affect profile visibility, discovery, and direct contact."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <SettingsField label="Profile Visibility">
              {isLoading ? <Skeleton className="h-12 w-full rounded-2xl" /> : (
                <select
                  className="pr-input appearance-none"
                  value={values.profile_visibility || 'public'}
                  onChange={(e) => handleChange('profile_visibility', e.target.value)}
                >
                  <option value="public">Public (Everyone)</option>
                  <option value="friends">Friends Only</option>
                  <option value="private">Private (Only Me)</option>
                </select>
              )}
            </SettingsField>
            <SettingsField label="Allow Messages From">
              {isLoading ? <Skeleton className="h-12 w-full rounded-2xl" /> : (
                <select
                  className="pr-input appearance-none"
                  value={values.allow_messages_from || 'everyone'}
                  onChange={(e) => handleChange('allow_messages_from', e.target.value)}
                >
                  <option value="everyone">Everyone</option>
                  <option value="friends">Friends Only</option>
                  <option value="nobody">Nobody</option>
                </select>
              )}
            </SettingsField>
            <SettingsField label="Show Online Status">
              {isLoading ? <Skeleton className="h-12 w-full rounded-2xl" /> : (
                <select
                  className="pr-input appearance-none"
                  value={String(values.show_online_status)}
                  onChange={(e) => handleChange('show_online_status', e.target.value === 'true')}
                >
                  <option value="true">Visible</option>
                  <option value="false">Hidden</option>
                </select>
              )}
            </SettingsField>
          </div>
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              className="pr-btn-primary"
              disabled={!isDirty || isSaving}
              onClick={handleSave}
            >
              {isSaving ? 'SAVING...' : 'Save Changes'}
            </button>
          </div>
        </SettingsSection>
      </SettingsShell>
    </>
  );
}
