import { Helmet } from 'react-helmet-async';
import { FiTwitter, FiCheck, FiChevronLeft, FiGithub, FiArrowRight, FiActivity, FiCommand, FiGlobe } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import { useSettingsForm } from '../useSettingsForm';
import profileService from '@/services/features/profileService';
import Skeleton from '@/shared/components/Skeleton';

const SOCIAL_PLATFORMS = [
  {
    id: 'discord',
    name: 'Discord',
    icon: <FiCommand size={22} />,
    description: 'Coordinate with squads and bridge community hubs.',
    color: '#7289da',
  },
  {
    id: 'github',
    name: 'Github',
    icon: <FiGithub size={22} />,
    description: 'Verify technical proofs and code contributions.',
    color: 'var(--theme-text)',
  },
  {
    id: 'twitter',
    name: 'Twitter',
    icon: <FiTwitter size={22} />,
    description: 'Synchronize highlights and transmit domain updates.',
    color: '#1DA1F2',
  },
  {
    id: 'website',
    name: 'Portfolio',
    icon: <FiGlobe size={22} />,
    description: 'Link your personal domain or portfolio site.',
    color: 'var(--theme-primary)',
  }
];

export default function LinkedAccounts() {
  usePageTheme('profile');
  const navigate = useNavigate();

  const { values, isLoading, isSaving, isDirty, handleChange, handleSave } = useSettingsForm(
    () => profileService.getMasterProfile().then(p => p.social_links || {}),
    (data) => profileService.updateMasterProfile({ social_links: data })
  );

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] font-body pb-32">
      <Helmet><title>External Shards | GzoneSphere</title></Helmet>

      <main className="max-w-4xl mx-auto px-6 pt-32 space-y-16">
        
        <header className="flex items-center gap-8">
          <button 
            onClick={() => navigate('/settings')} 
            className="w-14 h-14 rounded-2xl bg-[var(--theme-card)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] hover:border-[var(--theme-primary)]/30 transition-all shadow-sm group"
          >
            <FiChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-4 mb-3 px-4 py-1.5 bg-[var(--theme-primary)]/5 border border-[var(--theme-primary)]/10 rounded-full w-fit">
              <FiActivity className="text-[var(--theme-primary)] animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest text-[var(--theme-primary)] italic leading-none">Protocol Nexus v1.0</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter italic leading-[0.85] text-[var(--theme-text)]">External <br/><span className="text-[var(--theme-text-muted)] opacity-20">Shard Links</span></h1>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6">
          {SOCIAL_PLATFORMS.map(platform => {
            const isConnected = !!values[platform.id];
            
            return (
              <div key={platform.id} className={`bg-[var(--theme-card)] rounded-[2.5rem] border p-8 transition-all duration-500 overflow-hidden relative group ${isConnected ? 'border-[var(--theme-primary)]/40 bg-[var(--theme-primary)]/[0.02]' : 'border-[var(--theme-border)] hover:bg-[var(--theme-bg-alt)]'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-2xl bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] flex items-center justify-center transition-all duration-500 group-hover:rotate-6 ${isConnected ? 'bg-[var(--theme-primary)]/10 border-[var(--theme-primary)]/20' : ''}`} style={{ color: platform.color }}>
                      {platform.icon}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-black uppercase tracking-tight italic text-[var(--theme-text)] leading-none">{platform.name}</h3>
                        {isConnected && (
                          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20 text-[10px] font-black uppercase tracking-wide italic leading-none">
                            <FiCheck size={10} strokeWidth={4} /> LINKED
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium italic text-[var(--theme-text-muted)] opacity-70">
                        {platform.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 md:max-w-[300px]">
                    {isLoading ? <Skeleton className="h-12 w-full rounded-2xl" /> : (
                      <input
                        className="pr-input h-12 text-sm"
                        value={values[platform.id] || ''}
                        onChange={(e) => handleChange(platform.id, e.target.value)}
                        placeholder={`Enter your ${platform.name} handle...`}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-8">
          <button
            type="button"
            className="pr-btn-primary min-w-[200px]"
            disabled={!isDirty || isSaving}
            onClick={handleSave}
          >
            {isSaving ? 'SAVING...' : isDirty ? 'SYNCHRONIZE SHARDS' : 'PROTOCOL UP TO DATE'}
          </button>
        </div>

        {/* Technical Protocol Footer */}
        <div className="p-10 bg-[var(--theme-bg-alt)]/30 rounded-[3rem] border border-[var(--theme-border)] space-y-6 relative overflow-hidden group">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--theme-text-muted)] italic opacity-40">Synchronicity Protocol v4.2 //Reputation Node</h4>
          <p className="text-xs font-bold text-[var(--theme-text-muted)] italic leading-relaxed uppercase tracking-wide opacity-50 max-w-2xl">
            Linked shards are utilized for identity verification and cross-domain reputation scoring via GzoneSphere Truth Protocol. Communications are bridge-mediated via encrypted OAuth headers.
          </p>
        </div>
      </main>
    </div>
  );
}








