import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SectionOverline from './shared/SectionOverline';
import { useFeaturedGames } from '@/services/mutators/useGames';

const LATEST_BLOGS = [
  {
    id: 1,
    title: 'Top 10 Valorant Agents for 2026',
    desc: 'Our analysts break down the current meta and which agents you should grind in the new season.',
    category: 'Esports',
    readTime: '5 min read',
  },
  {
    id: 2,
    title: 'How to Turn Gaming Into a Career',
    desc: 'From playtesting gigs to full-time studio roles — the complete guide to gaming industry careers.',
    category: 'Career',
    readTime: '8 min read',
  },
  {
    id: 3,
    title: 'The Rise of Indie Game Development',
    desc: 'Why indie studios are winning hearts and how GzoneSphere helps indie devs find their audience.',
    category: 'Game Dev',
    readTime: '6 min read',
  },
];

export default function ContentPreviewSection() {
  const { data: games = [], isLoading } = useFeaturedGames();

  return (
    <section className="section-white">
      <div className="container-global space-y-16">

        {/* Trending Games */}
        <div>
          <div className="flex items-end justify-between mb-6">
            <div>
              <SectionOverline color="var(--home-games-accent)">Trending Games</SectionOverline>
              <h3 className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>Most played this week</h3>
            </div>
            <Link to="/games" className="text-sm font-semibold hover:underline" style={{ color: 'var(--home-games-accent)' }}>
              View All Games →
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {isLoading
              ? Array(4).fill(0).map((_, i) => (
                  <div key={i} className="w-48 h-64 rounded-2xl bg-[var(--theme-bg-section)] animate-pulse shrink-0" />
                ))
              : games.slice(0, 6).map(g => (
                  <Link
                    key={g.id}
                    to={`/games/${g.slug}`}
                    className="shrink-0 w-48 rounded-2xl overflow-hidden border border-[var(--theme-border)] hover:-translate-y-1 transition-transform duration-200"
                  >
                    <img
                      src={g.banner_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400'}
                      className="w-full h-32 object-cover"
                      alt={g.title}
                    />
                    <div className="p-3">
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--home-games-accent)' }}>{g.genres?.[0] || 'Game'}</p>
                      <p className="text-sm font-bold line-clamp-2" style={{ color: 'var(--theme-text)' }}>{g.title}</p>
                    </div>
                  </Link>
                ))
            }
          </div>
        </div>

        {/* Latest Blogs */}
        <div>
          <div className="flex items-end justify-between mb-6">
            <div>
              <SectionOverline color="var(--home-profile-accent)">Latest Blogs</SectionOverline>
              <h3 className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>Fresh from the community</h3>
            </div>
            <Link to="/blog" className="text-sm font-semibold hover:underline" style={{ color: 'var(--home-profile-accent)' }}>
              View All Blogs →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {LATEST_BLOGS.map(b => (
              <Link
                key={b.id}
                to={`/blog/${b.id}`}
                className="gzs-card block"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--home-profile-bg)', color: 'var(--home-profile-accent)' }}>
                    {b.category}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{b.readTime}</span>
                </div>
                <p className="text-sm font-bold mb-2 leading-snug" style={{ color: 'var(--theme-text)' }}>{b.title}</p>
                <p className="text-xs leading-relaxed line-clamp-3" style={{ color: 'var(--theme-text-muted)' }}>{b.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Active Tournaments */}
        <div>
          <div className="flex items-end justify-between mb-6">
            <div>
              <SectionOverline color="var(--home-tourney-accent)">Active Tournaments</SectionOverline>
              <h3 className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>Compete right now</h3>
            </div>
            <Link to="/tournaments" className="text-sm font-semibold hover:underline" style={{ color: 'var(--home-tourney-accent)' }}>
              Browse All Tournaments →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="gzs-card">
                <div className="h-28 rounded-xl bg-[var(--home-tourney-bg)] mb-3 flex items-center justify-center">
                  <span className="text-2xl">🏆</span>
                </div>
                <span className="inline-block text-xs font-bold px-2 py-0.5 rounded bg-[var(--home-tourney-bg)] text-[var(--home-tourney-accent)] mb-2 border border-[var(--home-tourney-accent)]/20">Open</span>
                <p className="text-sm font-bold" style={{ color: 'var(--theme-text)' }}>Tournament Slot {i}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>Registration open</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
