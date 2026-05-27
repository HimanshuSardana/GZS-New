import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import Breadcrumb from '@/shared/components/Breadcrumb';

const CHAPTERS = [
  { 
    id: 'problem', 
    title: 'The Problem', 
    subtitle: 'Fragmented Identity', 
    content: [
      "Gaming culture was massive, but the systems around it were broken. A person could be a legend in one community and invisible in the next. Talent was everywhere, but discovery was accidental.",
      "We realized that the most valuable asset in gaming—the individual's journey and contribution history—was being lost in the noise of a dozen different platforms."
    ],
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800'
  },
  { 
    id: 'vision', 
    title: 'The Vision', 
    subtitle: 'The Shared Structure', 
    content: [
      "The vision wasn't to build another 'social network' for gamers. It was to build an infrastructure layer. A shared structure that could hold identity, progress, and opportunity in one ecosystem.",
      "GzoneSphere was designed to be the 'Identity Layer' that bridges the gap between competitive gaming, professional creation, and industry hiring."
    ],
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800'
  },
  { 
    id: 'build', 
    title: 'The Build', 
    subtitle: 'Purpose-Driven Tech', 
    content: [
      "We built GzoneSphere in phases. Every feature, from the LFG board to the Unified Profile, was tested by the people who needed it most. We prioritized performance and low-friction interactions.",
      "Our tech stack was chosen for stability and speed, ensuring that the platform could handle the real-time demands of global tournaments and massive content feeds."
    ],
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800'
  },
  { 
    id: 'next', 
    title: 'What\'s Next', 
    subtitle: 'The Future Layer', 
    content: [
      "The story is still unfolding. In the coming months, we're activating the AI Matchmaking engine and expanding our Branch system to include Music, Writing, and Strategy.",
      "This is just the foundation. The real story begins with the connections you make on the platform today."
    ],
    image: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800'
  }
];

export default function AboutStory() {
  usePageTheme('about');
  const [activeChapter, setActiveChapter] = useState(CHAPTERS[0].id);

  // Intersection Observer for scroll-sync navigation
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveChapter(entry.target.id);
        }
      });
    }, { threshold: 0.5, rootMargin: '-10% 0px -40% 0px' });

    CHAPTERS.forEach(ch => {
      const el = document.getElementById(ch.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)]">
      <Helmet>
        <title>The Story | GzoneSphere</title>
      </Helmet>

      {/* Header */}
      <section className="pt-24 pb-12 border-b border-[var(--theme-border)]">
        <div className="container-global">
          <Breadcrumb 
            items={[{ label: 'Home', to: '/' }, { label: 'About', to: '/about' }, { label: 'Our Story' }]} 
            className="mb-10"
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--theme-primary)] italic mb-4">The Origin</p>
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic leading-[0.85]">
              The Story of <br />
              <span className="opacity-20">GzoneSphere.</span>
            </h1>
          </motion.div>
        </div>
      </section>

      <div className="container-global py-16">
        <div className="flex flex-col lg:flex-row gap-20">
          
          {/* Sticky Navigation (Desktop) */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-28 space-y-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-50 mb-8 italic">Chapters</p>
              <div className="space-y-1 relative">
                <div className="absolute left-0 top-0 w-0.5 h-full bg-[var(--theme-border)]" />
                {CHAPTERS.map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => scrollTo(ch.id)}
                    className={`relative w-full text-left pl-6 py-3 text-[10px] font-black uppercase tracking-widest italic transition-all group ${
                      activeChapter === ch.id ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-text-muted)] opacity-60 hover:opacity-100'
                    }`}
                  >
                    {activeChapter === ch.id && (
                      <motion.div 
                        layoutId="nav-pill"
                        className="absolute left-0 top-0 w-0.5 h-full bg-[var(--theme-primary)] shadow-[0_0_12px_var(--theme-primary)]"
                      />
                    )}
                    <span className="block text-[8px] opacity-40 mb-1">0{CHAPTERS.indexOf(ch) + 1}</span>
                    {ch.title}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Mobile Navigation */}
          <div className="lg:hidden sticky top-[64px] z-30 bg-[var(--theme-bg)]/80 backdrop-blur-xl -mx-4 px-4 py-3 border-b border-[var(--theme-border)] overflow-x-auto no-scrollbar flex gap-2">
            {CHAPTERS.map(ch => (
              <button
                key={ch.id}
                onClick={() => scrollTo(ch.id)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest italic whitespace-nowrap border-2 ${
                  activeChapter === ch.id 
                  ? 'bg-[var(--theme-primary)] text-white border-[var(--theme-primary)]' 
                  : 'bg-[var(--theme-bg-section)] text-[var(--theme-text-muted)] border-[var(--theme-border)]'
                }`}
              >
                {ch.title}
              </button>
            ))}
          </div>

          {/* Content */}
          <main className="flex-1 space-y-32 pb-32">
            {CHAPTERS.map((ch, idx) => (
              <section key={ch.id} id={ch.id} className="scroll-mt-32">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-primary)] italic">
                        Chapter 0{idx + 1}
                      </p>
                      <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-[var(--theme-text)]">
                        {ch.title}
                      </h2>
                      <p className="text-lg font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40 italic">
                        {ch.subtitle}
                      </p>
                    </div>
                    
                    <div className="space-y-6 text-sm font-bold italic text-[var(--theme-text-muted)] opacity-80 leading-loose">
                      {ch.content.map((p, i) => <p key={i}>{p}</p>)}
                    </div>
                  </div>

                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative"
                  >
                    <div className="aspect-[4/5] rounded-[3rem] overflow-hidden bg-[var(--theme-bg-section)] border-2 border-[var(--theme-border)] shadow-2xl">
                      <img src={ch.image} alt={ch.title} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
                    </div>
                    {/* Decorative element */}
                    <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[var(--theme-primary)]/10 border-2 border-[var(--theme-primary)]/20 rounded-[2rem] -z-10 backdrop-blur-xl" />
                  </motion.div>
                </div>
              </section>
            ))}
          </main>

        </div>
      </div>
    </div>
  );
}
