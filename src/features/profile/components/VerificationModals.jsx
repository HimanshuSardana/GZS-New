import React, { useState } from 'react';
import { FiCheckCircle, FiCircle, FiX, FiArrowRight, FiLock, FiCheck, FiPlus, FiShield, FiAlertCircle, FiTrendingUp } from 'react-icons/fi';
import useProfileStore from '@/store/profile/useProfileStore';

/**
 * SelectSkillToVerifyModal - Select a specific skill for manual proof submission.
 */
export function SelectSkillToVerifyModal({ onClose, onSelect }) {
    const [selectedId, setSelectedId] = useState(null);
    const { skills } = useProfileStore();

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[var(--theme-text)]/90 backdrop-blur-2xl theme-community">
            <div className="bg-[var(--theme-card)] rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] w-full max-w-2xl p-16 md:p-20 border-2 border-[var(--theme-border)] font-body relative overflow-hidden animate-in zoom-in-95 duration-500">
                <button onClick={onClose} className="absolute top-10 right-10 text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] transition-all hover:rotate-90 group focus:outline-none">
                    <FiX strokeWidth={4} className="text-3xl group-active:scale-90" />
                </button>

                <div className="mb-14">
                    <h2 className="gzs-h1 !text-4xl uppercase tracking-tighter italic">Select Skill to Verify</h2>
                    <p className="gzs-label-sm !text-[var(--theme-text-muted)] uppercase tracking-tight leading-relaxed mt-3 opacity-60">Submit proof to get your skill verified by our review team.</p>
                </div>

                <div className="grid grid-cols-1 gap-5 max-h-[450px] overflow-y-auto pr-6 custom-scrollbar">
                    {skills.map(skill => {
                        const isItemSelected = selectedId === skill.id;
                        return (
                            <button
                                key={skill.id}
                                onClick={() => setSelectedId(skill.id)}
                                className={`p-10 rounded-3xl border-2 text-left flex items-center justify-between transition-all group ${
                                    isItemSelected ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/5 shadow-2xl shadow-[var(--theme-primary)]/10' : 
                                    skill.is_verified ? 'border-[var(--color-success-soft)] bg-[var(--color-success-soft)]/5' : 'border-[var(--theme-border)] bg-[var(--theme-bg-alt)]/30 hover:border-[var(--theme-primary)]/30'
                                }`}
                            >
                                <div className="flex items-center gap-8">
                                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all shadow-xl ${
                                        isItemSelected ? 'bg-[var(--theme-primary)] text-white animate-in zoom-in-75 duration-300' :
                                        skill.is_verified ? 'bg-[var(--color-success-soft)] text-[var(--color-success)]' : 'bg-[var(--theme-card)] border-2 border-[var(--theme-border)] text-[var(--theme-text-muted)] group-hover:border-[var(--theme-primary)]/50'
                                    }`}>
                                        {isItemSelected ? <FiCheck size={32} strokeWidth={4} /> : skill.is_verified ? <FiCheckCircle size={28} strokeWidth={3} /> : <FiLock size={24} strokeWidth={3} />}
                                    </div>
                                    <div>
                                        <span className={`gzs-label-sm !text-xs uppercase tracking-wide mb-2 block leading-none font-black ${isItemSelected ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-text-muted)]'} italic opacity-60`}>
                                            {skill.skill_name}
                                        </span>
                                        <h4 className={`gzs-h2 !text-xl uppercase tracking-tight italic ${isItemSelected ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-text)]'}`}>
                                            {skill.proficiency_level}
                                        </h4>
                                    </div>
                                </div>
                                <div className={`gzs-label-sm !px-6 !py-2 !rounded-xl !text-xs uppercase tracking-widest italic font-black ${
                                    isItemSelected ? 'bg-[var(--theme-primary)] text-white' :
                                    skill.is_verified ? 'bg-[var(--color-success-soft)] text-[var(--color-success)]' : 'bg-[var(--theme-bg-alt)] text-[var(--theme-text-muted)] border border-[var(--theme-border)]'
                                }`}>
                                    {isItemSelected ? 'SELECTED' : skill.is_verified ? 'VERIFIED' : 'UNVERIFIED'}
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-16 flex items-center justify-between">
                    <button onClick={onClose} className="gzs-label-sm !text-[var(--theme-text-muted)] hover:!text-[var(--theme-primary)] font-black uppercase tracking-widest text-xs italic transition-colors">Cancel</button>
                    <button 
                        disabled={!selectedId}
                        onClick={() => onSelect(selectedId)}
                        className={`gzs-btn-primary px-14 py-6 !rounded-3xl !text-sm shadow-2xl transition-all flex items-center gap-5 ${
                            selectedId ? 'italic' : 'opacity-20 grayscale pointer-events-none'
                        }`}
                    >
                        Continue <FiArrowRight className="text-xl" strokeWidth={4} />
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * AddProofModal - Standard link/upload form for manual verification.
 */
export function AddProofModal({ onClose, onSubmit }) {
    const [proofType, setProofType] = useState('Portfolio link');
    
    const proofTypes = ['Portfolio link', 'File upload', 'Video / demo link', 'Code repo', 'Gameplay clip'];

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[var(--theme-text)]/90 backdrop-blur-2xl theme-community">
            <div className="bg-[var(--theme-card)] rounded-full shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] w-full max-w-4xl overflow-hidden font-body flex flex-col lg:flex-row animate-in fade-in duration-700 border-2 border-[var(--theme-border)]">
                {/* LEFT: Guide */}
                <div className="lg:w-[35%] bg-[var(--theme-bg-alt)]/50 p-16 md:p-20 flex flex-col justify-center border-r-2 border-[var(--theme-border)]/50 italic relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-[var(--theme-primary)]" />
                    <h4 className="gzs-label-sm !text-[var(--theme-primary)] uppercase tracking-widest mb-16 block font-black">PROOF GUIDE</h4>
                    
                    <div className="space-y-14 relative z-10">
                        <div className="opacity-40 grayscale group hover:grayscale-0 transition-all cursor-help hover:opacity-100">
                            <div className="flex items-center gap-4 mb-4">
                                <FiAlertCircle className="text-[var(--theme-text-muted)]" size={18} />
                                <span className="gzs-label-sm !text-[var(--theme-text-muted)] uppercase tracking-widest font-black">Weak Proof</span>
                            </div>
                            <div className="bg-[var(--theme-card)] p-8 rounded-3xl border-2 border-[var(--theme-border)] shadow-xl">
                                <p className="gzs-body-sm !text-[var(--theme-text-muted)] leading-relaxed uppercase italic opacity-70">"I worked on UE5 lighting for 3 years at a studio."</p>
                                <div className="mt-6 flex items-center gap-3">
                                    <div className="h-1.5 flex-1 bg-[var(--theme-bg-alt)] rounded-full overflow-hidden">
                                        <div className="h-full w-1/4 bg-[var(--theme-text-muted)] opacity-30" />
                                    </div>
                                    <span className="gzs-label-sm !text-[var(--theme-text-muted)] opacity-40 italic">LOW</span>
                                </div>
                            </div>
                        </div>

                        <div className="group cursor-help scale-105">
                            <div className="flex items-center gap-4 mb-4">
                                <FiCheckCircle className="text-[var(--color-success)]" size={18} />
                                <span className="gzs-label-sm !text-[var(--color-success)] uppercase tracking-widest font-black">Strong Proof</span>
                            </div>
                            <div className="bg-[var(--theme-card)] p-8 rounded-3xl border-2 border-[var(--color-success-soft)] shadow-2xl shadow-[var(--color-success)]/10">
                                <p className="gzs-body-sm !text-[var(--theme-text)] leading-relaxed uppercase italic font-black">Detailed Portfolio Case Study + Deep-Linked Repository with execution history.</p>
                                <div className="mt-6 flex items-center gap-3">
                                    <div className="h-2 flex-1 bg-[var(--color-success-soft)] rounded-full overflow-hidden">
                                        <div className="h-full w-[95%] bg-[var(--color-success)]" />
                                    </div>
                                    <span className="gzs-label-sm !text-[var(--color-success)] italic font-black">STRONG</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="mt-20 gzs-label-sm !text-[var(--theme-text-muted)] uppercase tracking-widest leading-relaxed max-w-[240px] opacity-40 font-bold">
                        The review team prioritizes evidence over statements. Detailed proof gets faster approval.
                    </p>
                </div>

                {/* RIGHT: Input Form */}
                <div className="flex-1 p-16 md:p-20 relative">
                    <div className="mb-16">
                        <h2 className="gzs-h1 !text-5xl uppercase tracking-tighter italic leading-none">Manual Verification</h2>
                        <p className="gzs-label-sm !text-[var(--theme-text-muted)] uppercase tracking-wide mt-3 italic opacity-60">Standard Peer-Review Cycle: 3–5 Business Days.</p>
                    </div>

                    <div className="space-y-14">
                        <div>
                            <label className="gzs-label-sm !text-[var(--theme-primary)] uppercase tracking-wider mb-6 block italic font-black">SELECT PROOF TYPE</label>
                            <div className="relative">
                                <select 
                                    value={proofType} 
                                    onChange={(e) => setProofType(e.target.value)}
                                    className="w-full h-24 bg-[var(--theme-bg-alt)] border-2 border-[var(--theme-border)] rounded-3xl px-12 text-sm font-black uppercase tracking-widest focus:ring-8 focus:ring-[var(--theme-primary)]/5 focus:border-[var(--theme-primary)] outline-none transition-all appearance-none cursor-pointer hover:bg-[var(--theme-card)] text-[var(--theme-text)] shadow-sm"
                                >
                                    {proofTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                                <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--theme-text-muted)] opacity-50"><FiArrowRight className="rotate-90" size={24} /></div>
                            </div>
                        </div>

                        <div className="p-16 rounded-[4rem] border-4 border-dashed border-[var(--theme-border)] bg-[var(--theme-bg-alt)]/30 flex flex-col items-center group cursor-pointer hover:bg-[var(--theme-card)] hover:border-[var(--theme-primary)]/50 transition-all">
                            <div className="w-28 h-28 bg-[var(--theme-card)] rounded-3xl shadow-2xl border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-muted)] text-5xl mb-8 group-hover:scale-110 group-hover:text-[var(--theme-primary)] transition-all group-hover:rotate-12 duration-500">
                                <FiPlus strokeWidth={5} />
                            </div>
                            <span className="gzs-label-sm !text-sm font-black text-[var(--theme-text-muted)] uppercase tracking-wide mb-4 italic group-hover:text-[var(--theme-primary)] transition-colors">Upload Proof File</span>
                            <p className="gzs-label-sm !text-xs text-[var(--theme-text-muted)] opacity-40 uppercase tracking-widest text-center max-w-[240px] leading-relaxed">Reviewers will validate proof quality and approve within 3-5 days.</p>
                        </div>

                        <div className="bg-[var(--theme-bg-alt)] border-2 border-[var(--theme-border)] rounded-full p-12 flex items-center gap-10 relative overflow-hidden">
                            <div className="bg-[var(--theme-primary)] p-6 rounded-2xl text-white text-4xl shrink-0 shadow-2xl shadow-[var(--theme-primary)]/40">
                                <FiTrendingUp strokeWidth={4} />
                            </div>
                            <div>
                                <span className="gzs-label-sm !text-[var(--theme-primary)] uppercase tracking-widest mb-3 block italic font-black">Selected Format</span>
                                <p className="gzs-h2 !text-lg !text-[var(--theme-text)] tracking-tight leading-snug uppercase italic opacity-90">
                                    "{proofType}" — submitted for peer review.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 pt-12 border-t-2 border-dashed border-[var(--theme-border)]/50 flex items-center justify-between">
                        <button onClick={onClose} className="gzs-label-sm !text-[var(--theme-text-muted)] hover:!text-[var(--theme-primary)] font-black uppercase tracking-widest text-xs italic transition-colors">Cancel</button>
                        <button 
                            onClick={onSubmit}
                            className="gzs-btn-primary px-20 py-8 !rounded-3xl !text-xs italic font-black shadow-2xl shadow-[var(--theme-primary)]/20"
                        >
                            Submit for Review <FiArrowRight className="text-xl" strokeWidth={5} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * ProofSubmittedPopup - Confirmation for successful manual review submission.
 */
export function ProofSubmittedPopup({ onClose }) {
    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-[var(--theme-text)]/95 backdrop-blur-3xl theme-community">
            <div className="bg-[var(--theme-card)] rounded-full shadow-[0_60px_120px_-30px_rgba(0,0,0,0.6)] w-full max-w-xl p-16 md:p-20 border-4 border-[var(--color-success-soft)] font-body text-center animate-in zoom-in duration-500 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-4 bg-[var(--color-success)]" />
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-[var(--color-success-soft)] rounded-full blur-[100px] opacity-20" />
                
                <div className="w-36 h-36 bg-[var(--color-success)] rounded-full flex items-center justify-center text-white shadow-3xl mb-14 mx-auto border-8 border-white/20">
                    <FiCheckCircle size={72} strokeWidth={4} />
                </div>
                
                <h2 className="gzs-h1 !text-5xl tracking-tighter italic uppercase leading-tight mb-6">
                    Proof Submitted
                </h2>
                <p className="gzs-body-sm !text-lg !text-[var(--theme-text-muted)] tracking-tight leading-relaxed mb-14 max-w-xs mx-auto italic opacity-70">
                    Verification expected within <span className="text-[var(--theme-primary)] font-black">2–5 business days</span>.
                </p>

                <div className="bg-[var(--theme-bg-alt)] border-2 border-[var(--theme-border)] px-14 py-12 rounded-full mb-14 shadow-inner">
                    <span className="gzs-label-sm !text-[var(--theme-text-muted)] uppercase tracking-widest mb-4 block italic leading-none font-black opacity-40">Review Reference ID</span>
                    <p className="gzs-stat !text-4xl text-[var(--theme-text)] tabular-nums tracking-tighter italic">GZ-VER-PR-842-X</p>
                </div>

                <button 
                    onClick={onClose}
                    className="gzs-btn-primary w-full !py-8 !rounded-3xl !text-sm italic font-black"
                >
                    Done <FiArrowRight className="text-xl" strokeWidth={4} />
                </button>
            </div>
        </div>
    );
}








