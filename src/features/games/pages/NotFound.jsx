import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiSearch, FiTarget, FiActivity } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { usePageTheme } from '@/app/providers/ThemeProvider';

const QUOTES = [
  "\"It's dangerous to go alone! Take this.\" — The Legend of Zelda",
  "\"War. War never changes.\" — Fallout",
  "\"What is a man? A miserable little pile of secrets!\" — Castlevania",
  "\"The cake is a lie.\" — Portal",
  "\"Stay awhile and listen!\" — Diablo",
];

export default function NotFound() {
  usePageTheme('home');
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--theme-bg)] p-6 relative overflow-hidden">
      {/* Decorative Gaming Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none flex items-center justify-center">
         <h1 className="text-[30vw] font-black italic uppercase tracking-tighter">GAME OVER</h1>
      </div>

      <div className="max-w-4xl w-full relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-12 inline-block"
        >
          {/* Animated Broken Controller SVG */}
          <svg width="240" height="160" viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto drop-shadow-2xl">
            <motion.path 
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, repeat: Infinity }}
              d="M60 40H180C202.091 40 220 57.9086 220 80V100C220 122.091 202.091 140 180 140H60C37.9086 140 20 122.091 20 100V80C20 57.9086 37.9086 40 60 40Z" 
              stroke="var(--theme-primary)" 
              strokeWidth="4" 
              strokeDasharray="8 8"
            />
            <path d="M70 70H90M80 60V80" stroke="var(--theme-primary)" strokeWidth="4" strokeLinecap="round"/>
            <circle cx="160" cy="70" r="6" fill="var(--theme-primary)"/>
            <circle cx="180" cy="70" r="6" fill="var(--theme-primary)" opacity="0.5"/>
            <circle cx="160" cy="90" r="6" fill="var(--theme-primary)" opacity="0.5"/>
            <circle cx="180" cy="90" r="6" fill="var(--theme-primary)" opacity="0.5"/>
            
            {/* Crack line */}
            <motion.path 
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              d="M120 40L110 70L130 100L120 140" 
              stroke="var(--status-error)" 
              strokeWidth="3"
            />
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <h1 className="text-6xl md:text-8xl font-black text-[var(--theme-text)] uppercase italic tracking-tighter leading-none">
            404 <span className="text-[var(--status-error)]">/</span> <br/>
            LOST_IN_SPACE
          </h1>
          
          <p className="text-xl md:text-2xl font-bold text-[var(--theme-text-muted)] italic max-w-2xl mx-auto uppercase tracking-wide opacity-70">
            The coordinate you provided doesn't exist in our current map. 
            The page has been deleted or moved to a different branch.
          </p>

          <div className="flex flex-wrap justify-center gap-4 py-10">
            <Link to="/" className="gzs-btn-primary px-10 py-4 flex items-center gap-3">
              <FiHome size={18} /> GO_HOME
            </Link>
            <Link to="/games" className="px-10 py-4 rounded-full border-2 border-[var(--theme-primary)] text-[var(--theme-primary)] font-black uppercase tracking-widest text-xs hover:bg-[var(--theme-primary)] hover:text-white transition-all flex items-center gap-3 italic">
              <FiSearch size={18} /> BROWSE_GAMES
            </Link>
            <Link to="/tournaments" className="px-10 py-4 rounded-full border-2 border-[var(--theme-border)] text-[var(--theme-text-muted)] font-black uppercase tracking-widest text-xs hover:border-[var(--theme-primary)] hover:text-[var(--theme-primary)] transition-all flex items-center gap-3 italic">
              <FiTarget size={18} /> TOURNAMENTS
            </Link>
          </div>

          <div className="pt-10 border-t border-[var(--theme-border)]/50 max-w-lg mx-auto">
             <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--theme-text-muted)] mb-2 italic opacity-40">RANDOM_GAMING_INTEL</p>
             <p className="text-sm font-bold text-[var(--theme-text)] italic opacity-60">
                {quote}
             </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
