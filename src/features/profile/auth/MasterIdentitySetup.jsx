import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLink, FiCpu, FiGlobe, FiUser, FiArrowRight, FiArrowLeft, FiShield, FiZap, FiActivity, FiHash, FiTerminal, FiLayers, FiTwitter, FiPhone, FiClock, FiMapPin } from 'react-icons/fi';
import AuthLayout from '@/app/layouts/AuthLayout';
import { motion, AnimatePresence } from 'framer-motion';
import profileService from '@/services/features/profileService';

export default function MasterIdentitySetup() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [apiError, setApiError] = useState('');
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        username: '',
        dob: '',
        gender: '',
        nationality: '',
        languages: '',
        origin: '',
        about: '',
        discord: '',
        linkedin: '',
        github: '',
        behance: '',
        twitter: '',
        website: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        phone: '',
    });

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const validateStep = () => {
        const newErrors = {};
        if (step === 1) {
            if (!formData.username) {
                newErrors.username = "Username is required";
            } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
                newErrors.username = "Username must be 3-20 characters, letters/numbers/underscore only";
            }
            
            if (!formData.dob) {
                newErrors.dob = "Origin date is required";
            } else if (new Date().getFullYear() - new Date(formData.dob).getFullYear() < 13) {
                newErrors.dob = "You must be at least 13 years old";
            }
        }
        
        if (step === 2) {
            if (formData.website && !/^https?:\/\//.test(formData.website)) {
                newErrors.website = "URL must start with http:// or https://";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = (e) => {
        e.preventDefault();
        if (validateStep()) {
            if (step < 3) setStep(prev => prev + 1);
            else setShowModal(true);
        }
    };

    const completeSetup = async () => {
        setApiError('');
        const payload = {
            username: formData.username,
            date_of_birth: formData.dob,
            gender: formData.gender,
            nationality: formData.nationality,
            languages: formData.languages.split(',').map(l => l.trim()).filter(Boolean),
            about: formData.about,
            social_links: {
              discord: formData.discord,
              linkedin: formData.linkedin,
              github: formData.github,
              twitter: formData.twitter,
              website: formData.website,
              behance: formData.behance,
            },
            timezone: formData.timezone,
            phone: formData.phone,
            origin: formData.origin,
        };

        try {
            await profileService.updateMasterProfile(payload);
            setShowModal(false);
            navigate('/profile/choose-subprofile');
        } catch (err) {
            setApiError(err.response?.data?.message || 'Failed to save profile. Please try again.');
            setShowModal(false);
        }
    };

    const timezones = [
        'UTC', 'UTC+1', 'UTC+2', 'UTC+3', 'UTC+4', 'UTC+5', 'UTC+6', 'UTC+7', 'UTC+8', 'UTC+9', 'UTC+10', 'UTC+11', 'UTC+12',
        'UTC-1', 'UTC-2', 'UTC-3', 'UTC-4', 'UTC-5', 'UTC-6', 'UTC-7', 'UTC-8', 'UTC-9', 'UTC-10', 'UTC-11', 'UTC-12'
    ];

    return (
        <AuthLayout
            title="MASTER IDENTITY"
            subtitle="The definitive source of truth for your professional domain persona."
        >
            <div className="space-y-12">
                {/* Tactical Step Indicator */}
                <div className="flex gap-4 p-2 bg-[var(--theme-bg-alt)]/50 backdrop-blur-md rounded-2xl border-2 border-[var(--theme-border)] shadow-inner">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex-1 space-y-2">
                             <div className={`h-2 rounded-full transition-all duration-1000 ${step >= i ? 'bg-[var(--theme-primary)] shadow-[0_0_15px_rgba(var(--theme-primary-rgb),0.5)]' : 'bg-[var(--theme-border)]/20'}`} />
                             <p className={`text-xs font-black uppercase text-center tracking-tight italic ${step === i ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-text-muted)] opacity-20'}`}>STAGE_0{i}</p>
                        </div>
                    ))}
                </div>

                <form onSubmit={handleNext} className="flex flex-col gap-10">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div 
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-4">
                                    <label className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-30 flex items-center gap-4 ml-2">
                                        <FiUser className="text-[var(--theme-primary)]" strokeWidth={3} /> PLATFORM_SIGNATURE_ID
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        placeholder="TRACE_IDENTIFIER_v4..."
                                        className={`w-full bg-[var(--theme-bg-alt)]/50 border-2 ${errors.username ? 'border-[var(--status-error)]' : 'border-[var(--theme-border)]'} px-8 py-6 rounded-2xl font-black text-base uppercase tracking-widest outline-none focus:border-[var(--theme-primary)]/40 transition-all italic placeholder:opacity-10 shadow-inner`}
                                    />
                                    {errors.username && (
                                        <span style={{ color: 'var(--status-error)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)', display: 'block' }}>
                                            {errors.username}
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-30 leading-none ml-2">ORIGIN_DATE</label>
                                        <input
                                            type="date"
                                            name="dob"
                                            value={formData.dob}
                                            onChange={handleChange}
                                            className={`w-full bg-[var(--theme-bg-alt)]/50 border-2 ${errors.dob ? 'border-[var(--status-error)]' : 'border-[var(--theme-border)]'} px-8 py-6 rounded-2xl font-black text-base uppercase tracking-widest outline-none focus:border-[var(--theme-primary)]/40 hover:border-[var(--theme-primary)]/20 transition-all italic shadow-inner [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-20`}
                                        />
                                        {errors.dob && (
                                            <span style={{ color: 'var(--status-error)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)', display: 'block' }}>
                                                {errors.dob}
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-30 leading-none ml-2">ENTITY_SYNK</label>
                                        <div className="relative group/sel">
                                            <select 
                                                name="gender" 
                                                value={formData.gender} 
                                                onChange={handleChange} 
                                                className="w-full bg-[var(--theme-bg-alt)]/50 border-2 border-[var(--theme-border)] px-8 py-6 rounded-2xl font-black text-base uppercase tracking-widest outline-none focus:border-[var(--theme-primary)]/40 hover:border-[var(--theme-primary)]/20 transition-all italic cursor-pointer shadow-inner appearance-none"
                                            >
                                                <option value="" className="bg-[var(--theme-card)]">PREFER NOT TO SAY</option>
                                                <option value="male" className="bg-[var(--theme-card)] font-black">MALE_NODE</option>
                                                <option value="female" className="bg-[var(--theme-card)] font-black">FEMALE_NODE</option>
                                                <option value="non-binary" className="bg-[var(--theme-card)] font-black">NON_BINARY_NODE</option>
                                                <option value="other" className="bg-[var(--theme-card)] font-black">OTHER_DOMAIN</option>
                                            </select>
                                            <FiZap className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--theme-primary)] opacity-40 group-hover/sel:opacity-100 transition-opacity" size={18} strokeWidth={3} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-30 flex items-center gap-4 ml-2">
                                            <FiGlobe className="text-[var(--theme-primary)]" strokeWidth={3} /> GEODATA_NATIONALITY
                                        </label>
                                        <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} placeholder="WORLD_COORDS..." className="w-full bg-[var(--theme-bg-alt)]/50 border-2 border-[var(--theme-border)] px-8 py-6 rounded-2xl font-black text-base uppercase tracking-widest outline-none focus:border-[var(--theme-primary)]/40 transition-all italic placeholder:opacity-10 shadow-inner" />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-30 ml-2 leading-none">LEXICON_SYNC</label>
                                        <input type="text" name="languages" value={formData.languages} onChange={handleChange} placeholder="English, Hindi..." className="w-full bg-[var(--theme-bg-alt)]/50 border-2 border-[var(--theme-border)] px-8 py-6 rounded-2xl font-black text-base uppercase tracking-widest outline-none focus:border-[var(--theme-primary)]/40 transition-all italic placeholder:opacity-10 shadow-inner" />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div 
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-4">
                                    <label className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-30 flex items-center gap-4 ml-2">
                                        <FiActivity className="text-[var(--status-success)]" strokeWidth={3} /> PROFESSIONAL_BIOGRAPHIC_LOG
                                    </label>
                                    <textarea
                                        name="about"
                                        value={formData.about}
                                        onChange={handleChange}
                                        rows={4}
                                        maxLength={300}
                                        placeholder="BRIEFLY DESCRIBE YOUR CORE DOMAIN EXPERTISE AND NETWORK BACKGROUND..."
                                        className="w-full bg-[var(--theme-bg-alt)]/50 border-2 border-[var(--theme-border)] px-10 py-8 rounded-3xl font-black text-base uppercase tracking-widest outline-none focus:border-[var(--theme-primary)]/40 hover:border-[var(--theme-primary)]/20 transition-all italic placeholder:opacity-10 shadow-inner resize-none tracking-tighter"
                                    />
                                    <div className="text-right text-[var(--theme-text-muted)] text-[10px] font-black uppercase tracking-widest opacity-30 italic">
                                        {formData.about.length}/300
                                    </div>
                                </div>

                                <p className="text-xs font-black text-[var(--theme-primary)] uppercase tracking-widest mb-4 flex items-center gap-4 animate-pulse ml-2 leading-none italic"><FiLink strokeWidth={3} /> CONNECT_SOCIAL_INTERFACE_PROOF</p>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="relative group/link">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--theme-primary)] opacity-40 group-focus-within/link:opacity-100 transition-opacity">
                                            <FiHash size={18} strokeWidth={3} />
                                        </div>
                                        <input type="text" name="discord" value={formData.discord} onChange={handleChange} placeholder="DISCORD_TAG (username#0000)" className="w-full bg-[var(--theme-bg-alt)]/50 border-2 border-[var(--theme-border)] pl-14 pr-6 py-4 rounded-xl font-black text-sm uppercase tracking-widest outline-none focus:border-[var(--theme-primary)]/40 transition-all italic placeholder:opacity-10 shadow-inner" />
                                    </div>
                                    <div className="relative group/link">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--theme-primary)] opacity-40 group-focus-within/link:opacity-100 transition-opacity">
                                            <FiTerminal size={18} strokeWidth={3} />
                                        </div>
                                        <input type="text" name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="linkedin.com/in/yourname" className="w-full bg-[var(--theme-bg-alt)]/50 border-2 border-[var(--theme-border)] pl-14 pr-6 py-4 rounded-xl font-black text-sm uppercase tracking-widest outline-none focus:border-[var(--theme-primary)]/40 transition-all italic placeholder:opacity-10 shadow-inner" />
                                    </div>
                                    <div className="relative group/link">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--theme-primary)] opacity-40 group-focus-within/link:opacity-100 transition-opacity">
                                            <FiLayers size={18} strokeWidth={3} />
                                        </div>
                                        <input type="text" name="github" value={formData.github} onChange={handleChange} placeholder="github.com/username" className="w-full bg-[var(--theme-bg-alt)]/50 border-2 border-[var(--theme-border)] pl-14 pr-6 py-4 rounded-xl font-black text-sm uppercase tracking-widest outline-none focus:border-[var(--theme-primary)]/40 transition-all italic placeholder:opacity-10 shadow-inner" />
                                    </div>
                                    <div className="relative group/link">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--theme-primary)] opacity-40 group-focus-within/link:opacity-100 transition-opacity">
                                            <FiTwitter size={18} strokeWidth={3} />
                                        </div>
                                        <input type="text" name="twitter" value={formData.twitter} onChange={handleChange} placeholder="@handle" className="w-full bg-[var(--theme-bg-alt)]/50 border-2 border-[var(--theme-border)] pl-14 pr-6 py-4 rounded-xl font-black text-sm uppercase tracking-widest outline-none focus:border-[var(--theme-primary)]/40 transition-all italic placeholder:opacity-10 shadow-inner" />
                                    </div>
                                    <div className="col-span-2 relative group/link">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--theme-primary)] opacity-40 group-focus-within/link:opacity-100 transition-opacity">
                                            <FiGlobe size={18} strokeWidth={3} />
                                        </div>
                                        <input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://yoursite.com" className={`w-full bg-[var(--theme-bg-alt)]/50 border-2 ${errors.website ? 'border-[var(--status-error)]' : 'border-[var(--theme-border)]'} pl-14 pr-6 py-4 rounded-xl font-black text-sm uppercase tracking-widest outline-none focus:border-[var(--theme-primary)]/40 transition-all italic placeholder:opacity-10 shadow-inner`} />
                                        {errors.website && <span style={{ color: 'var(--status-error)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)', display: 'block' }}>{errors.website}</span>}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div 
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-30 flex items-center gap-4 ml-2">
                                            <FiClock className="text-[var(--theme-primary)]" strokeWidth={3} /> TEMPORAL_SYNC
                                        </label>
                                        <div className="relative group/sel">
                                            <select 
                                                name="timezone" 
                                                value={formData.timezone} 
                                                onChange={handleChange} 
                                                className="w-full bg-[var(--theme-bg-alt)]/50 border-2 border-[var(--theme-border)] px-8 py-6 rounded-2xl font-black text-base uppercase tracking-widest outline-none focus:border-[var(--theme-primary)]/40 hover:border-[var(--theme-primary)]/20 transition-all italic cursor-pointer shadow-inner appearance-none"
                                            >
                                                {timezones.map(tz => (
                                                    <option key={tz} value={tz} className="bg-[var(--theme-card)] font-black">{tz}</option>
                                                ))}
                                            </select>
                                            <FiZap className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--theme-primary)] opacity-40 group-hover/sel:opacity-100 transition-opacity" size={18} strokeWidth={3} />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-30 flex items-center gap-4 ml-2">
                                            <FiPhone className="text-[var(--theme-primary)]" strokeWidth={3} /> COMMS_LINK
                                        </label>
                                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" className="w-full bg-[var(--theme-bg-alt)]/50 border-2 border-[var(--theme-border)] px-8 py-6 rounded-2xl font-black text-base uppercase tracking-widest outline-none focus:border-[var(--theme-primary)]/40 transition-all italic placeholder:opacity-10 shadow-inner" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-30 flex items-center gap-4 ml-2">
                                        <FiMapPin className="text-[var(--theme-primary)]" strokeWidth={3} /> ORIGIN_LOCUS
                                    </label>
                                    <input type="text" name="origin" value={formData.origin} onChange={handleChange} placeholder="CITY, COUNTRY..." className="w-full bg-[var(--theme-bg-alt)]/50 border-2 border-[var(--theme-border)] px-8 py-6 rounded-2xl font-black text-base uppercase tracking-widest outline-none focus:border-[var(--theme-primary)]/40 transition-all italic placeholder:opacity-10 shadow-inner" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="pt-6 flex flex-col gap-6">
                        {apiError && (
                            <div className="p-4 bg-[var(--status-error-soft)] border border-[var(--status-error)] rounded-xl text-sm text-[var(--status-error)] font-black uppercase italic tracking-widest">
                                {apiError}
                            </div>
                        )}
                        <button type="submit" className="w-full py-8 bg-[var(--theme-text)] text-[var(--theme-bg)] rounded-3xl text-sm font-black uppercase tracking-widest shadow-2xl hover:bg-[var(--theme-primary)] hover:text-white hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-8 italic border-4 border-white/5 group/btn ">
                            <span className="relative z-10 flex items-center gap-6">
                                {step < 3 ? 'CONTINUE_PROTOCOL' : 'FINALIZE_MASTER_IDENTITY'} <FiArrowRight className="group-hover/btn:translate-x-4 transition-transform" strokeWidth={5} />
                            </span>
                        </button>
                        {step > 1 && (
                            <button type="button" onClick={() => setStep(prev => prev - 1)} className="w-full py-4 text-[var(--theme-text-muted)] text-xs font-black uppercase tracking-wider hover:text-[var(--theme-primary)] transition-all flex items-center justify-center gap-6 italic opacity-40 hover:opacity-100 group/back">
                                <FiArrowLeft className="group-hover/back:-translate-x-2 transition-transform" strokeWidth={3} /> PREVIOUS_SYNC_PHASE
                            </button>
                        )}
                    </div>
                </form>

                <div className="pt-10 border-t border-[var(--theme-border)] opacity-10 flex justify-center gap-12">
                     <FiCpu size={32} />
                     <FiShield size={32} />
                     <FiGlobe size={32} />
                </div>
            </div>

            {/* ── Welcome Modal (High-Contrast Forensic Design) ──────────────────────────────── */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--theme-bg)]/90 backdrop-blur-2xl p-6 font-body">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 50 }}
                            className="bg-[var(--theme-card)] rounded-full shadow-[0_60px_120px_-20px_rgba(0,0,0,0.4)] max-w-lg w-full text-center overflow-hidden border-2 border-[var(--theme-border)] relative"
                        >
                            <div className="h-3 bg-gradient-to-r from-[var(--theme-primary)] via-[var(--theme-secondary)] to-[var(--theme-primary)] animate-gradient-x" />
                            <div className="p-16 md:p-24 space-y-12">
                                <div className="w-28 h-28 rounded-3xl bg-[var(--theme-text)] flex items-center justify-center mx-auto shadow-2xl border-4 border-white/5 relative group">
                                    <FiShield className="w-14 h-14 text-[var(--theme-primary)] animate-pulse relative z-10" strokeWidth={2.5} />
                                    <div className="absolute inset-0 bg-gradient-to-tr from-[var(--theme-primary)]/20 to-transparent" />
                                </div>
                                <div className="space-y-6">
                                    <h3 className="text-5xl font-black text-[var(--theme-text)] uppercase tracking-tighter italic leading-none">
                                        IDENTITY <span className="text-[var(--theme-primary)]">SECURED_v4</span>
                                    </h3>
                                    <div className="h-1 w-20 bg-[var(--theme-primary)] mx-auto rounded-full opacity-40" />
                                    <p className="text-sm text-[var(--theme-text-muted)] font-black uppercase tracking-wider leading-relaxed italic opacity-40 px-4">
                                        Master Identity architecture is now the anchor for your domain reputation. Ready to project specialized Facade Shards?
                                    </p>
                                </div>
                                <button
                                    onClick={completeSetup}
                                    className="w-full bg-[var(--theme-text)] text-[var(--theme-bg)] text-sm font-black uppercase tracking-widest px-12 py-8 rounded-3xl transition-all hover:bg-[var(--theme-primary)] hover:text-white hover:scale-105 active:scale-95 shadow-2xl italic border-4 border-white/5"
                                >
                                    ACTIVATE_DOMAIN_FACADES
                                </button>
                            </div>
                            <FiTerminal size={400} className="absolute bottom-[-100px] right-[-100px] opacity-[0.015] text-[var(--theme-text)] pointer-events-none -rotate-12" />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </AuthLayout>
    );
}








