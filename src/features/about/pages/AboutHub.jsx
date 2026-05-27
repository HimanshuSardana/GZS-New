import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, animate } from 'framer-motion';
import { FiArrowRight, FiCompass, FiFeather, FiTarget, FiZap, FiHeart, FiCode } from 'react-icons/fi';
import { usePageTheme } from '@/app/providers/ThemeProvider';

const MILESTONES = [
  { year: '2023', title: 'The Blueprint', desc: 'GzoneSphere was conceived as a solution to fragmented gaming identity.' },
  { year: '2024', title: 'Seed Funding', desc: 'Secured strategic backing from gaming industry veterans and tech visionaries.' },
  { year: '2025', title: 'Alpha Launch', desc: 'Launched the first 3 branches: Dev, Esports, and Content.' },
  { year: '2025', title: 'Global Expansion', desc: 'Reached 100k verified members across 50+ countries.' },
  { year: '2026', title: 'The Hub', desc: 'Unified the ecosystem into the high-performance platform you see today.' },
];

const TEAM = [
  { name: 'Marcus Chen', role: 'Founder & CEO', fact: 'Ex-Pro Dota 2 Player', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus' },
  { name: 'Sarah Jenkins', role: 'CTO', fact: 'Built scalable backend for 3 AAA titles', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
  { name: 'Liam O\'Shea', role: 'Head of Design', fact: 'Minimalism enthusiast', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liam' },
  { name: 'Elena Rossi', role: 'Community Lead', fact: 'Speaks 5 languages', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena' },
];

function Counter({ value, suffix = "" }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 2,
      onUpdate: (latest) => setCount(Math.floor(latest)),
    });
    return () => controls.stop();
  }, [value]);

  return <span>{count.toLocaleString()}{suffix}</span>;
}

export default function AboutHub() {
  usePageTheme('about');

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)]">
      {/* Hero */}
      <section className="relative pt-32 pb-20 bg-[var(--theme-bg-section)]">
        <div className="container-global">
          <div className="max-w-3xl">
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs font-black uppercase tracking-[0.3em] text-[var(--theme-primary)] italic mb-4"
            >
              The Hub
            </motion.p>
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic leading-[0.85]">
              One Ecosystem. <br />
              <span className="opacity-20">No Compromise.</span>
            </h1>
            <p className="mt-8 text-lg font-bold italic text-[var(--theme-text-muted)] opacity-60 leading-relaxed">
              GzoneSphere is the first unified professional platform designed specifically for the gaming industry's unique roles and relationships.
            </p>
          </div>
        </div>
      </section>

      {/* Stats / Mission */}
      <section className="py-20 border-y border-[var(--theme-border)]">
        <div className="container-global">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { label: 'Active Members', val: 125000, suffix: '+', icon: FiZap },
              { label: 'Games in Library', val: 1400, suffix: '', icon: FiCode },
              { label: 'Tournaments Hosted', val: 3200, suffix: '+', icon: FiTarget }
            ].map((stat, _i) => (
              <div key={stat.label} className="text-center space-y-4">
                <div className="w-12 h-12 bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] rounded-2xl flex items-center justify-center mx-auto">
                  <stat.icon size={24} />
                </div>
                <div>
                  <h3 className="text-5xl font-black italic tracking-tighter text-[var(--theme-text)]">
                    <Counter value={stat.val} suffix={stat.suffix} />
                  </h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-50">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24">
        <div className="container-global">
          <div className="mb-16">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter">Our Journey.</h2>
          </div>
          <div className="space-y-12">
            {MILESTONES.map((m, _i) => (
              <motion.div 
                key={m.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex flex-col md:flex-row gap-8 items-start"
              >
                <div className="text-4xl font-black italic text-[var(--theme-primary)] opacity-20 min-w-[120px]">
                  {m.year}
                </div>
                <div className="max-w-2xl">
                  <h3 className="text-2xl font-black uppercase italic text-[var(--theme-text)] mb-2">{m.title}</h3>
                  <p className="text-sm font-bold italic text-[var(--theme-text-muted)] opacity-60 leading-relaxed">
                    {m.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-[var(--theme-bg-section)] border-y border-[var(--theme-border)]">
        <div className="container-global">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter">The Squad.</h2>
            <p className="mt-4 text-xs font-bold italic text-[var(--theme-text-muted)] opacity-50 uppercase tracking-widest">
              Builders of the gaming identity layer
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {TEAM.map((member) => (
              <div key={member.name} className="bg-[var(--theme-bg)] border-2 border-[var(--theme-border)] rounded-[2.5rem] p-8 text-center space-y-4 hover:border-[var(--theme-primary)]/40 transition-all group">
                <img src={member.avatar} alt={member.name} className="w-24 h-24 rounded-3xl mx-auto mb-4 bg-[var(--theme-bg-section)] group-hover:scale-105 transition-transform" />
                <div>
                  <h4 className="text-lg font-black uppercase italic text-[var(--theme-text)]">{member.name}</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-primary)] mb-4">{member.role}</p>
                  <div className="px-4 py-2 bg-[var(--theme-bg-section)] rounded-xl text-[10px] font-bold italic text-[var(--theme-text-muted)] opacity-60">
                    "{member.fact}"
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container-global">
          <div className="bg-[var(--theme-primary)] rounded-[3rem] p-10 md:p-20 text-center text-white relative overflow-hidden">
            <div className="relative z-10 space-y-8">
              <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
                Join the Mission.
              </h2>
              <p className="max-w-xl mx-auto text-sm md:text-lg font-bold italic opacity-80">
                We are always looking for the next generation of builders, designers, and community architects.
              </p>
              <Link 
                to="/career" 
                className="inline-flex items-center gap-3 px-10 py-5 bg-white text-black rounded-2xl text-sm font-black uppercase tracking-widest italic hover:scale-105 active:scale-95 transition-all shadow-2xl"
              >
                View Careers <FiArrowRight strokeWidth={3} />
              </Link>
            </div>
            {/* Decorative background icons */}
            <FiZap className="absolute top-[-50px] left-[-50px] text-white opacity-[0.05]" size={300} />
            <FiHeart className="absolute bottom-[-50px] right-[-50px] text-white opacity-[0.05]" size={300} />
          </div>
        </div>
      </section>
    </div>
  );
}
