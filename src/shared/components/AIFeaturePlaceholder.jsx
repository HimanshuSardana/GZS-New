import React from 'react';
import { FiLock, FiCpu, FiUploadCloud } from 'react-icons/fi';

/**
 * AIFeaturePlaceholder
 * 
 * A reusable component to showcase upcoming AI-driven features in the platform.
 * Part of the Phase 2/3 AI Integration Roadmap.
 */
const AIFeaturePlaceholder = ({ 
  title, 
  description, 
  phase = 'Phase 2', 
  icon: Icon = FiCpu, 
  inputLabel, 
  inputType = 'url', 
  actionLabel 
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50/50 via-white to-violet-50/30 p-6 md:p-8 shadow-sm">
      {/* Phase Badge */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6">
        <span className="inline-flex items-center rounded-full bg-violet-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white italic shadow-lg shadow-violet-600/20">
          {phase} — Coming Soon
        </span>
      </div>

      <div className="flex flex-col gap-6">
        {/* Header: Icon + Info */}
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-xl shadow-violet-600/20">
            <Icon size={24} />
          </div>
          <div className="space-y-1 pr-24 md:pr-0">
            <h3 className="text-xl font-black italic tracking-tighter text-slate-900 uppercase">
              {title}
            </h3>
            <p className="text-sm leading-relaxed text-slate-500 font-medium max-w-2xl">
              {description}
            </p>
          </div>
        </div>

        {/* Disabled Input Simulation */}
        <div className="space-y-3">
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 italic px-1">
            {inputLabel}
          </label>
          
          <div className="relative">
            {inputType === 'textarea' ? (
              <div className="h-32 w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-center">
                <span className="text-xs text-slate-300 font-bold uppercase tracking-widest italic">Input Disabled</span>
              </div>
            ) : inputType === 'file-upload' ? (
              <div className="h-24 w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-2">
                <FiUploadCloud size={20} className="text-slate-300" />
                <span className="text-xs text-slate-300 font-bold uppercase tracking-widest italic">Upload Disabled</span>
              </div>
            ) : (
              <div className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 flex items-center">
                <span className="text-xs text-slate-300 font-bold uppercase tracking-widest italic">https://...</span>
              </div>
            )}
          </div>
        </div>

        {/* Disabled Action Button */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <button 
            disabled 
            className="group relative inline-flex items-center justify-center gap-3 rounded-2xl bg-slate-200 px-8 py-4 text-sm font-black uppercase tracking-widest text-slate-400 italic cursor-not-allowed"
          >
            {actionLabel}
            <FiLock size={16} />
          </button>
          
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            This feature uses Claude AI to help you {description.toLowerCase().split('.')[0]}.
          </p>
        </div>
      </div>

      {/* Decorative Gradient Flare */}
      <div className="absolute -bottom-12 -right-12 h-40 w-40 rounded-full bg-violet-500/5 blur-3xl pointer-events-none" />
    </div>
  );
};

export default AIFeaturePlaceholder;
