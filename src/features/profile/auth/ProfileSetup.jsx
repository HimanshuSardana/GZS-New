import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '@/app/layouts/AuthLayout';
import useProfileStore from '@/store/profile/useProfileStore';
import { FiUser, FiBriefcase, FiArrowRight } from 'react-icons/fi';

export default function ProfileSetup() {
    const navigate = useNavigate();
    const [selected, setSelected] = useState(null);
    const setAccountType = useProfileStore(state => state.setAccountType);

    const handleNext = () => {
        if (!selected) return;
        
        // Persist selection
        setAccountType(selected);
        localStorage.setItem('gzs_account_type', selected);

        if (selected === 'individual') {
            navigate('/profile/master-setup');
        } else if (selected === 'organization') {
            navigate('/profile/org-setup');
        }
    };

    return (
        <AuthLayout
            title="CHOOSE YOUR PATH"
            subtitle="Are you joining as an individual player or represent an organization?"
        >
            <div className="flex flex-col gap-6 font-body">
                {/* Individual Option */}
                <button
                    onClick={() => setSelected('individual')}
                    className={`w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center gap-6 group ${selected === 'individual'
                            ? 'bg-[var(--theme-text)] border-[var(--theme-primary)] shadow-xl'
                            : 'bg-[var(--theme-bg-alt)]/20 border-[var(--theme-border)] hover:border-[var(--theme-primary)]/40 hover:bg-[var(--theme-bg-alt)]/40'
                        }`}
                >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${selected === 'individual' ? 'bg-[var(--theme-bg-alt)] text-[var(--theme-text)]' : 'bg-[var(--theme-bg-alt)]/40 text-[var(--theme-text-muted)]'
                        }`}>
                        <FiUser className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className={`text-base font-black uppercase tracking-wider ${selected === 'individual' ? 'text-[var(--theme-bg-alt)]' : 'text-[var(--theme-text)]'
                            }`}>Individual Player</h3>
                        <p className={`text-xs mt-1 ${selected === 'individual' ? 'text-[var(--theme-bg-alt)]/60' : 'text-[var(--theme-text-muted)]'
                            }`}>Build your career, verify skills, and compete.</p>
                    </div>
                    <FiArrowRight className={`w-5 h-5 transition-transform ${selected === 'individual' ? 'text-[var(--theme-bg-alt)] translate-x-1' : 'text-[var(--theme-text)]/20'
                        }`} />
                </button>

                {/* Organization Option */}
                <button
                    onClick={() => setSelected('organization')}
                    className={`w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center gap-6 group ${selected === 'organization'
                            ? 'bg-[var(--theme-text)] border-[var(--theme-primary)] shadow-xl'
                            : 'bg-[var(--theme-bg-alt)]/20 border-[var(--theme-border)] hover:border-[var(--theme-primary)]/40 hover:bg-[var(--theme-bg-alt)]/40'
                        }`}
                >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${selected === 'organization' ? 'bg-[var(--theme-bg-alt)] text-[var(--theme-text)]' : 'bg-[var(--theme-bg-alt)]/40 text-[var(--theme-text-muted)]'
                        }`}>
                        <FiBriefcase className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className={`text-base font-black uppercase tracking-wider ${selected === 'organization' ? 'text-[var(--theme-bg-alt)]' : 'text-[var(--theme-text)]'
                            }`}>Organization / Studio</h3>
                        <p className={`text-xs mt-1 ${selected === 'organization' ? 'text-[var(--theme-bg-alt)]/60' : 'text-[var(--theme-text-muted)]'
                            }`}>Discover talent, manage teams, and publish games.</p>
                    </div>
                    <FiArrowRight className={`w-5 h-5 transition-transform ${selected === 'organization' ? 'text-[var(--theme-bg-alt)] translate-x-1' : 'text-[var(--theme-text)]/20'
                        }`} />
                </button>

                <div className="mt-8">
                    <button
                        onClick={handleNext}
                        disabled={!selected}
                        className={`w-full py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${selected
                                ? 'bg-[var(--theme-text)] text-[var(--theme-bg-alt)] shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                                : 'bg-[var(--theme-bg-alt)]/20 text-[var(--theme-text-muted)]/40 cursor-not-allowed'
                            }`}
                    >
                        CONTINUE SETUP
                    </button>
                </div>
            </div>
        </AuthLayout>
    );
}






