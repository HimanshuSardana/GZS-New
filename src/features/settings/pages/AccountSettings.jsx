import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import { SettingsField, SettingsSection, SettingsShell } from '../components/SettingsShell';
import { useSettingsForm } from '../useSettingsForm';
import authService from '@/services/features/authService';
import core from '@/services/api/core';
import { CORE } from '@/services/api/endpoints';
import Skeleton from '@/shared/components/Skeleton';

export default function AccountSettings() {
  usePageTheme('profile');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { values, isLoading, isSaving, isDirty, handleChange, handleSave } = useSettingsForm(
    () => authService.me(),
    (data) => core.patch(CORE.USER.UPDATE, {
      display_name: data.display_name,
      username: data.username,
      bio: data.bio
    })
  );

  return (
    <>
      <Helmet>
        <title>Account Settings | GzoneSphere</title>
      </Helmet>
      <SettingsShell
        title="Account Settings"
        subtitle="Update your public profile details and account-level information."
      >
        <SettingsSection
          title="Profile Information"
          description="Control the core identity information shown across your profile and account records."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <SettingsField label="Display Name">
              {isLoading ? <Skeleton className="h-12 w-full rounded-2xl" /> : (
                <input
                  className="pr-input"
                  value={values.display_name || ''}
                  onChange={(e) => handleChange('display_name', e.target.value)}
                  placeholder="Enter your display name"
                />
              )}
            </SettingsField>
            <SettingsField label="Username">
              {isLoading ? <Skeleton className="h-12 w-full rounded-2xl" /> : (
                <input
                  className="pr-input"
                  value={values.username || ''}
                  onChange={(e) => handleChange('username', e.target.value)}
                  placeholder="Enter your username"
                />
              )}
            </SettingsField>
            <SettingsField label="Email (Read-only)">
              {isLoading ? <Skeleton className="h-12 w-full rounded-2xl" /> : (
                <input
                  className="pr-input opacity-60 cursor-not-allowed"
                  value={values.email || ''}
                  readOnly
                />
              )}
            </SettingsField>
            <SettingsField label="Bio">
              {isLoading ? <Skeleton className="h-24 w-full rounded-2xl" /> : (
                <textarea
                  className="pr-input min-h-[100px] py-3"
                  value={values.bio || ''}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  placeholder="Tell us a bit about yourself..."
                />
              )}
            </SettingsField>
          </div>
          <div className="mt-6 flex justify-end">
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

        <SettingsSection
          title="Danger Zone"
          description="Delete your account and permanently remove associated profile data from the platform."
          danger
        >
          <div className="flex flex-col gap-4 rounded-2xl border border-[var(--status-error)] bg-[var(--status-error-soft)] p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-bold text-[var(--status-error)]">Delete Account</p>
              <p className="mt-1 text-xs text-[var(--theme-text-muted)]">This action is irreversible and requires confirmation.</p>
            </div>
            <button
              type="button"
              className="px-5 py-3 rounded-xl bg-[var(--status-error)] text-white text-sm font-black uppercase tracking-wider transition-all hover:brightness-110 active:scale-95"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </button>
          </div>
        </SettingsSection>
      </SettingsShell>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-[var(--theme-bg)] border border-[var(--theme-border)] p-8 shadow-2xl">
            <h3 className="text-xl font-black text-[var(--status-error)] uppercase tracking-tight">Confirm account deletion</h3>
            <p className="mt-4 text-sm leading-relaxed text-[var(--theme-text-muted)]">
              Deleting your account will permanently remove all profile data, contributions, and access across the GzoneSphere ecosystem.
            </p>
            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                className="px-6 py-3 rounded-xl text-sm font-bold text-[var(--theme-text-muted)] hover:bg-[var(--theme-bg-alt)] transition-colors"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-6 py-3 rounded-xl bg-[var(--status-error)] text-white text-sm font-black uppercase tracking-wider transition-all hover:brightness-110"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
