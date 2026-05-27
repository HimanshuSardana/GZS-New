import { useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import { SettingsField, SettingsSection, SettingsShell } from '../components/SettingsShell';
import { useSettingsForm } from '../useSettingsForm';
import profileService from '@/services/features/profileService';
import core from '@/services/api/core';
import { CORE } from '@/services/api/endpoints';
import Skeleton from '@/shared/components/Skeleton';
import { FiCamera } from 'react-icons/fi';

export default function ProfileSettings() {
  usePageTheme('profile');
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const { values, isLoading, isSaving, isDirty, handleChange, handleSave } = useSettingsForm(
    () => profileService.getMasterProfile(),
    (data) => profileService.updateMasterProfile(data)
  );

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await core.post(CORE.USER.AVATAR, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      handleChange('avatar_url', response.data.avatar_url);
    } catch (err) {
      console.error('Avatar upload failed:', err);
    }
  };

  return (
    <>
      <Helmet>
        <title>Profile Settings | GzoneSphere</title>
      </Helmet>
      <SettingsShell
        title="Profile Settings"
        subtitle="Manage your public identity, visual branding, and professional details."
      >
        <SettingsSection
          title="Visual Identity"
          description="Update your profile avatar and banner image."
        >
          <div className="space-y-8">
            {/* Banner Section */}
            <div className="relative group">
              <div className="h-48 w-full rounded-2xl bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] overflow-hidden">
                {isLoading ? <Skeleton className="h-full w-full" /> : (
                  values.banner_url ? (
                    <img src={values.banner_url} alt="Banner" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[var(--theme-text-muted)] italic text-sm">
                      No banner image set
                    </div>
                  )
                )}
              </div>
              <button
                type="button"
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
                onClick={() => bannerInputRef.current?.click()}
              >
                <div className="flex items-center gap-2 text-white font-black uppercase text-xs tracking-widest italic">
                  <FiCamera size={18} /> UPDATE BANNER
                </div>
              </button>
              <input
                type="file"
                ref={bannerInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    // In a real app we'd upload here. For now we set temporary preview or mock
                    handleChange('banner_url', URL.createObjectURL(file));
                  }
                }}
              />
            </div>

            {/* Avatar Section */}
            <div className="relative w-32 h-32 -mt-16 ml-8 group">
              <div className="w-full h-full rounded-full border-4 border-[var(--theme-bg)] bg-[var(--theme-bg-alt)] overflow-hidden shadow-xl">
                {isLoading ? <Skeleton className="h-full w-full" /> : (
                  values.avatar_url ? (
                    <img src={values.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[var(--theme-text-muted)] font-black text-2xl uppercase">
                      {values.display_name?.[0] || '?'}
                    </div>
                  )
                )}
              </div>
              <button
                type="button"
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                onClick={() => avatarInputRef.current?.click()}
              >
                <FiCamera size={24} className="text-white" />
              </button>
              <input
                type="file"
                ref={avatarInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
              />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Profile Details"
          description="Update your professional information and online presence."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <SettingsField label="Tagline">
              {isLoading ? <Skeleton className="h-12 w-full rounded-2xl" /> : (
                <input
                  className="pr-input"
                  value={values.tagline || ''}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  placeholder="e.g. Senior Game Developer @ Ubisoft"
                />
              )}
            </SettingsField>
            <SettingsField label="Location">
              {isLoading ? <Skeleton className="h-12 w-full rounded-2xl" /> : (
                <input
                  className="pr-input"
                  value={values.location || ''}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="e.g. Montreal, Canada"
                />
              )}
            </SettingsField>
            <SettingsField label="Website">
              {isLoading ? <Skeleton className="h-12 w-full rounded-2xl" /> : (
                <input
                  className="pr-input"
                  value={values.website || ''}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://yourportfolio.com"
                />
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








