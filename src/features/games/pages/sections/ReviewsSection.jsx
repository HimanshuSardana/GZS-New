import { useState } from 'react';

const SORT_OPTIONS = ['Most Recent', 'Highest Rated', 'Lowest Rated'];

export default function ReviewsSection({ expert, user }) {
  const [sortOrder, setSortOrder] = useState('Most Recent');

  if (!expert && !user) return null;

  const sortedUser = [...(user || [])].sort((a, b) => {
    if (sortOrder === 'Highest Rated') return Number(b.rating) - Number(a.rating);
    if (sortOrder === 'Lowest Rated')  return Number(a.rating) - Number(b.rating);
    return 0;
  });

  return (
    <section className="gp-content-section relative">

      <div className="mb-20 gp-animate-in relative z-10">
        <span className="gp-section-label">
          THE FEEDBACK
        </span>
        <h2 className="gp-section-heading">
          REVIEWS
        </h2>

        {/* Expert Reviews */}
        <div className="flex items-center gap-6 mb-12">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-[var(--gp-primary)]">EXPERT CRITICS</h3>
          <div className="h-[1px] flex-1 bg-[var(--theme-border)] opacity-30" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-32">
          {expert?.map((r, i) => (
            <div
              key={i}
              className={`gp-card flex flex-col justify-between group overflow-hidden
                ${i === 1 ? 'bg-[var(--gp-primary)] text-[var(--theme-text-inverse)] border-transparent scale-105 z-10 shadow-[0_40px_80px_-20px_var(--gp-primary-alpha)]' : ''}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="relative z-10">
                 <div className={`text-[60px] font-serif leading-none opacity-20 mb-[-20px] ${i === 1 ? 'text-white' : 'text-[var(--gp-primary)]'}`}>“</div>
                 <p className={`gzs-body mb-10 text-[20px] font-bold leading-tight italic ${i === 1 ? 'text-[var(--theme-text-inverse)]' : 'text-[var(--theme-text)]'}`}>
                    {r.quote}
                 </p>
              </div>

              <div className={`flex justify-between items-center relative z-10 pt-10 border-t ${i === 1 ? 'border-white/20' : 'border-[var(--theme-border)]'}`}>
                <div>
                  <p className={`font-black uppercase tracking-widest text-[13px] ${i === 1 ? 'text-[var(--theme-text-inverse)]' : 'text-[var(--gp-primary)]'}`}>{r.site}</p>
                  <p className={`text-[10px] font-black tracking-widest mt-1 opacity-50`}>VERIFIED EXPERT</p>
                </div>
                <div className={`flex items-baseline gap-1 ${i === 1 ? 'text-[var(--theme-text-inverse)]' : 'text-[var(--theme-text)]'}`}>
                  <span className="text-[44px] font-[var(--weight-display)] font-heading leading-none tracking-tighter">{r.rating}</span>
                  <span className="text-[16px] opacity-40 font-black">/10</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* User Reviews header + sort */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-16 gap-8">
          <div className="flex items-center gap-6">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[var(--gp-primary)]">COMMUNITY VOICES</h3>
            <div className="h-[1px] w-32 bg-[var(--theme-border)] opacity-30" />
          </div>

          {/* Sort options */}
          <div className="flex items-center gap-4 bg-[var(--theme-bg-section)] p-1.5 rounded-2xl border border-[var(--theme-border)]">
             {SORT_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => setSortOrder(opt)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sortOrder === opt ? 'bg-[var(--theme-card)] text-[var(--gp-primary)] shadow-md' : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'}`}
                >
                  {opt}
                </button>
              ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {sortedUser.map((r, i) => (
            <div
              key={i}
              className="gp-card group relative hover:border-[var(--gp-primary)]"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="flex gap-1 mb-8">
                  {[...Array(5)].map((_, starIdx) => (
                    <div
                      key={starIdx}
                      className={`w-3 h-3 rounded-full transition-all duration-500 ${starIdx < Math.round((parseInt(r.rating) / 10) * 5) ? 'bg-[var(--gp-primary)] scale-110' : 'bg-[var(--theme-bg-section)]'}`}
                    />
                  ))}
              </div>

              <p className="gzs-body mb-12 text-[16px] font-bold leading-relaxed text-[var(--theme-text)] opacity-90 italic">"{r.comment}"</p>

              <div className="flex justify-between items-center border-t border-[var(--theme-border)] pt-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--theme-bg-section)] flex items-center justify-center font-black text-[var(--gp-primary)] text-[14px] shadow-inner uppercase border border-[var(--theme-border)] group-hover:bg-[var(--gp-primary)] group-hover:text-white group-hover:border-transparent transition-all">
                    {r.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-black text-[11px] uppercase text-[var(--theme-text)] tracking-widest mb-0.5">{r.username}</p>
                    <p className="text-[9px] font-black uppercase text-[var(--theme-text-subtle)] tracking-widest">VERIFIED AGENT</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-[32px] font-black text-[var(--theme-text)]">{r.rating}</span>
                  <span className="text-[10px] font-black text-[var(--theme-text-muted)] opacity-40">/10</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
