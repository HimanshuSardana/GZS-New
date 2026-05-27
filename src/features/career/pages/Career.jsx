import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiMapPin, FiClock, FiUsers, FiCpu, FiLayout, FiMessageSquare, FiTrendingUp, FiCloud, FiPaperclip, FiBriefcase } from 'react-icons/fi';
import { usePageTheme } from '@/app/providers/ThemeProvider';

const DEPARTMENTS = ['All', 'Engineering', 'Design', 'Community', 'Marketing', 'Content'];

const ROLES = [
  { id: 1, title: 'Senior Frontend Engineer', dept: 'Engineering', loc: 'Remote', type: 'Full-time', desc: 'Help us build the most fluid, high-performance creator ecosystem in gaming.' },
  { id: 2, title: 'Lead Product Designer', dept: 'Design', loc: 'Remote', type: 'Full-time', desc: 'Define the visual language and interaction patterns for the GzoneSphere platform.' },
  { id: 3, title: 'Community Growth Manager', dept: 'Community', loc: 'Remote', type: 'Full-time', desc: 'Scale our creator branch communities and bridge the gap between players and devs.' },
  { id: 4, title: 'Backend Architect (Go/FastAPI)', dept: 'Engineering', loc: 'Remote', type: 'Full-time', desc: 'Design scalable real-time services for global gaming matchmaking and identity.' },
  { id: 5, title: 'Social Media Strategist', dept: 'Marketing', loc: 'Remote', type: 'Contract', desc: 'Tell the GzoneSphere story across TikTok, YouTube, and X.' },
  { id: 6, title: 'Technical Writer', dept: 'Content', loc: 'Remote', type: 'Part-time', desc: 'Document our internal APIs and platform guidelines for external partners.' },
];

const VALUES = [
  { icon: FiUsers, title: 'Community First', desc: 'We build for the people who play and create, not just the systems that host them.' },
  { icon: FiCpu, title: 'Performance Obsessed', desc: 'Latency and friction are the enemy of gaming. We optimize every millisecond.' },
  { icon: FiTrendingUp, title: 'Always Learning', desc: 'The gaming landscape changes every day. We stay curious and adapt fast.' },
  { icon: FiCloud, title: 'Global by Default', desc: 'Our team is distributed across the world, just like the community we serve.' },
];

export default function Career() {
  usePageTheme('about'); // Using about theme for consistent professional feel
  const [activeDept, setActiveDept] = useState('All');

  const filteredRoles = useMemo(() => 
    activeDept === 'All' ? ROLES : ROLES.filter(r => r.dept === activeDept)
  , [activeDept]);

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] selection:bg-[var(--theme-primary)]/30">
      <Helmet>
        <title>Careers | Join GzoneSphere</title>
      </Helmet>

      {/* Hero with Stats */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-[var(--theme-bg-section)]">
        <div className="container-global relative z-10">
          <div className="max-w-4xl">
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs font-black uppercase tracking-[0.3em] text-[var(--theme-primary)] italic mb-4"
            >
              Careers @ GzoneSphere
            </motion.p>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic leading-[0.85]"
            >
              Building the <br />
              <span className="opacity-20">Gaming Future.</span>
            </motion.h1>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mt-16 max-w-3xl">
            {[
              { label: 'Open Roles', val: ROLES.length, sub: 'Across 5 departments' },
              { label: 'Team Members', val: 24, sub: '12 countries represented' },
              { label: 'Hiring Goal', val: '50+', sub: 'By the end of 2026' }
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + (i * 0.1) }}
                className="space-y-1"
              >
                <h3 className="text-4xl md:text-5xl font-black italic tracking-tighter text-[var(--theme-primary)]">{stat.val}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-60">{stat.label}</p>
                <p className="text-[9px] font-bold text-[var(--theme-text-muted)] opacity-30 italic">{stat.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[var(--theme-primary)]/[0.05] to-transparent pointer-events-none" />
      </section>

      {/* Filter Tabs */}
      <section className="sticky top-[64px] z-30 bg-[var(--theme-bg)]/80 backdrop-blur-xl border-b border-[var(--theme-border)]">
        <div className="container-global py-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
            {DEPARTMENTS.map(dept => (
              <button
                key={dept}
                onClick={() => setActiveDept(dept)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all whitespace-nowrap border-2 ${
                  activeDept === dept 
                  ? 'bg-[var(--theme-primary)] text-white border-[var(--theme-primary)]' 
                  : 'bg-[var(--theme-bg-section)] text-[var(--theme-text-muted)] border-[var(--theme-border)] hover:border-[var(--theme-primary)]/40'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Job Grid */}
      <section className="py-20">
        <div className="container-global">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredRoles.map((role) => (
                <motion.div
                  key={role.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[var(--theme-bg-section)] border-2 border-[var(--theme-border)] rounded-3xl p-8 flex flex-col hover:border-[var(--theme-primary)]/40 transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-lg bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] text-[9px] font-black uppercase tracking-widest border border-[var(--theme-primary)]/20">
                      {role.dept}
                    </span>
                    <div className="flex gap-2">
                      <span className="flex items-center gap-1 text-[9px] font-bold text-[var(--theme-text-muted)] opacity-50 uppercase italic">
                        <FiMapPin size={10} /> {role.loc}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-black uppercase italic tracking-tight text-[var(--theme-text)] group-hover:text-[var(--theme-primary)] transition-colors">
                    {role.title}
                  </h3>
                  <p className="mt-4 text-xs font-bold italic text-[var(--theme-text-muted)] opacity-60 leading-relaxed flex-1">
                    {role.desc}
                  </p>
                  <div className="mt-8 pt-6 border-t border-dashed border-[var(--theme-border)] flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[9px] font-black text-[var(--theme-text-muted)] opacity-40 uppercase">
                      <FiClock size={10} /> {role.type}
                    </span>
                    <button className="flex items-center gap-2 text-xs font-black uppercase italic text-[var(--theme-primary)] hover:gap-3 transition-all">
                      Apply Now <FiArrowRight strokeWidth={3} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Culture Section */}
      <section className="py-24 bg-[var(--theme-bg-section)] border-y border-[var(--theme-border)]">
        <div className="container-global">
          <div className="mb-16">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--theme-primary)] italic mb-2">Our Culture</p>
            <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">How We Build.</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {VALUES.map((val) => {
              const Icon = val.icon;
              return (
                <div key={val.title} className="space-y-4">
                  <div className="w-12 h-12 bg-[var(--theme-bg)] border-2 border-[var(--theme-border)] rounded-2xl flex items-center justify-center text-[var(--theme-primary)] shadow-lg shadow-[var(--theme-primary)]/5">
                    <Icon size={20} />
                  </div>
                  <h4 className="text-lg font-black uppercase italic text-[var(--theme-text)]">{val.title}</h4>
                  <p className="text-xs font-bold italic text-[var(--theme-text-muted)] opacity-60 leading-relaxed">
                    {val.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Open Application CTA */}
      <section className="py-24">
        <div className="container-global">
          <div className="bg-[var(--theme-text)] rounded-[3rem] p-10 md:p-20 text-center relative overflow-hidden shadow-2xl">
            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-[var(--theme-bg)] leading-none">
                Don't See Your Role?
              </h2>
              <p className="text-sm md:text-lg font-bold italic text-[var(--theme-bg)]/60">
                We're always looking for exceptional creators, thinkers, and builders. Send us an open application and let's start a conversation.
              </p>
              
              <form className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto pt-4">
                <input 
                  type="email" 
                  placeholder="Your professional email"
                  className="flex-1 px-6 py-4 rounded-2xl bg-[var(--theme-bg)]/10 border-2 border-[var(--theme-bg)]/20 text-[var(--theme-bg)] placeholder:[var(--theme-bg)]/30 text-sm font-bold italic outline-none focus:border-[var(--theme-bg)]/50 transition-all"
                />
                <button className="px-8 py-4 bg-[var(--theme-bg)] text-[var(--theme-text)] hover:bg-[var(--theme-primary)] hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest italic transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2">
                  <FiPaperclip size={14} /> Send CV
                </button>
              </form>
            </div>

            {/* Decorative Icon */}
            <FiBriefcase className="absolute bottom-[-40px] right-[-40px] text-[var(--theme-bg)] opacity-[0.03]" size={300} />
          </div>
        </div>
      </section>
    </div>
  );
}
