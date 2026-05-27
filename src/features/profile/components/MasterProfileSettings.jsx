import React from 'react';
import { FiUser, FiMail, FiGlobe, FiInfo, FiCamera, FiBriefcase, FiUsers, FiCalendar, FiCheckCircle } from 'react-icons/fi';
import { useProfile } from '@/services/mutators/useProfile';

const ToggleButton = ({ active, onClick, icon: Icon, label, description }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between p-6 rounded-2xl border-2 transition-all group ${
      active
        ? 'bg-[var(--theme-primary)]/10 border-[var(--theme-primary)] shadow-[0_0_20px_rgba(var(--theme-primary-rgb),0.1)]'
        : 'bg-[var(--theme-card)] border-[var(--theme-border)] hover:border-[var(--theme-primary)]/40'
    }`}
  >
    <div className="flex items-center gap-5">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
        active
          ? 'bg-[var(--theme-primary)] text-white scale-110 rotate-6 shadow-lg'
          : 'bg-[var(--theme-bg-alt)] text-[var(--theme-text-muted)] group-hover:bg-[var(--theme-bg)]'
      }`}>
        <Icon size={22} />
      </div>
      <div className="text-left">
        <span className={`block text-xs font-black uppercase tracking-tight italic ${
          active ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-text)]'
        }`}>
          {label}
        </span>
        <span className="block text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-60 mt-0.5">
          {description}
        </span>
      </div>
    </div>
    <div className={`w-12 h-6 rounded-full relative transition-colors ${
      active ? 'bg-[var(--theme-primary)]' : 'bg-[var(--theme-bg-alt)]'
    }`}>
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all transform ${
        active ? 'right-1 scale-110 shadow-sm' : 'left-1'
      }`} />
    </div>
  </button>
);

const MasterProfileSettings = ({ profile, user }) => {
  const { useUpdateProfile } = useProfile();
  const updateProfile = useUpdateProfile();

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    updateProfile.mutate(data);
  };

  const handleToggle = (key) => {
    const newValue = !profile[key];
    updateProfile.mutate({ [key]: newValue });
  };

  const options = [
    {
      key: 'hiring_interest',
      label: 'Hiring_Protocol',
      description: 'Appear in talent search',
      icon: FiBriefcase,
    },
    {
      key: 'collaboration_interest',
      label: 'Sync_Request',
      description: 'LFG smart match active',
      icon: FiUsers,
    },
    {
      key: 'open_to_events',
      label: 'Event_Link',
      description: 'Cross-branch recommendations',
      icon: FiCalendar,
    },
  ];

  return (
    <div className="space-y-12">
      <form onSubmit={handleSubmit} className="bg-[var(--theme-card)]/50 backdrop-blur-2xl rounded-3xl border-2 border-[var(--theme-border)] p-10 shadow-sm space-y-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-1.5 h-6 bg-[var(--theme-primary)] rounded-full" />
          <h2 className="text-xl font-black uppercase tracking-tighter text-[var(--theme-text)] italic leading-none">Identity_Core.cfg</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wide text-[var(--theme-text-muted)] italic px-4">Master_Handle</label>
            <div className="relative">
              <FiUser className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--theme-primary)]" />
              <input
                name="username"
                defaultValue={user?.username}
                className="w-full bg-[var(--theme-bg-alt)] border-2 border-[var(--theme-border)] rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-[var(--theme-text)] focus:border-[var(--theme-primary)] transition-all outline-none"
                placeholder="USERNAME"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wide text-[var(--theme-text-muted)] italic px-4">Real_Name_Record</label>
            <div className="relative">
              <FiInfo className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--theme-primary)]" />
              <input
                name="real_name"
                defaultValue={profile?.real_name}
                className="w-full bg-[var(--theme-bg-alt)] border-2 border-[var(--theme-border)] rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-[var(--theme-text)] focus:border-[var(--theme-primary)] transition-all outline-none"
                placeholder="REAL NAME"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wide text-[var(--theme-text-muted)] italic px-4">Primary_Uplink (Email)</label>
          <div className="relative">
            <FiMail className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--theme-primary)]" />
            <input
              name="email"
              defaultValue={user?.email}
              disabled
              className="w-full bg-[var(--theme-bg-alt)]/50 border-2 border-[var(--theme-border)] rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-[var(--theme-text-muted)] cursor-not-allowed italic"
              placeholder="EMAIL_ADDRESS"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wide text-[var(--theme-text-muted)] italic px-4">Entity_Bio</label>
          <textarea
            name="bio"
            defaultValue={profile?.bio}
            rows={4}
            className="w-full bg-[var(--theme-bg-alt)] border-2 border-[var(--theme-border)] rounded-3xl py-4 px-6 text-sm font-bold text-[var(--theme-text)] focus:border-[var(--theme-primary)] transition-all outline-none resize-none"
            placeholder="DESCRIBE_YOUR_ESSENCE..."
          />
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="gzs-btn-primary !px-12 !py-4"
          >
            {updateProfile.isPending ? 'SYNCING...' : 'COMMIT_CHANGES'}
          </button>
        </div>
      </form>

      <div className="bg-[var(--theme-card)]/30 backdrop-blur-2xl rounded-3xl border-2 border-[var(--theme-border)] p-10 mt-12 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-1.5 h-6 bg-[var(--theme-primary)] rounded-full" />
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter text-[var(--theme-text)] italic leading-none">Global_Availability.sys</h2>
            <p className="text-xs font-black uppercase tracking-wider text-[var(--theme-text-muted)] mt-1.5 opacity-60 italic">Define your platform presence parameters</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {options.map((option) => (
            <ToggleButton
              key={option.key}
              active={profile?.[option.key]}
              onClick={() => handleToggle(option.key)}
              label={option.label}
              description={option.description}
              icon={option.icon}
            />
          ))}
        </div>

        {updateProfile.isPending && (
          <div className="mt-6 flex items-center gap-3 text-xs font-black uppercase tracking-widest text-[var(--theme-primary)] italic animate-pulse">
            <div className="w-2 h-2 rounded-full bg-[var(--theme-primary)]" />
            UPDATING_PROTOCOLS...
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterProfileSettings;
