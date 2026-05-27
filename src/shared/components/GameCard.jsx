import { Link } from 'react-router-dom';
import { FiStar } from 'react-icons/fi';

export default function GameCard({ game, onClick }) {
  const slug = game.slug || game.id;
  const platforms = Array.isArray(game.platforms)
    ? game.platforms
    : [game.platforms].filter(Boolean);
  const genres = Array.isArray(game.genres)
    ? game.genres
    : [game.genre || game.genres].filter(Boolean);
  const score = game.aggregate_score || game.metacritic || null;

  const inner = (
    <div className="group relative bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-[var(--theme-primary)] cursor-pointer flex flex-col h-full">

      {/* Cover — aspect-3/4 */}
      <div style={{ aspectRatio: '3/4', width: '100%', overflow: 'hidden', position: 'relative' }} className="bg-[var(--theme-bg-section)] shrink-0">
        {game.banner_url || game.cover_url ? (
          <img
            src={game.banner_url || game.cover_url}
            alt={game.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            className="group-hover:scale-110 transition-transform duration-700"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--theme-primary)]/10 to-[var(--theme-secondary)]/10"
          >
            <span className="text-4xl grayscale opacity-20">🎮</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

        {/* Genre badge */}
        {genres[0] && (
          <span
            className="absolute top-4 left-4 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg text-white bg-[var(--theme-primary)] shadow-lg italic"
          >
            {genres[0]}
          </span>
        )}

        {/* Score badge */}
        {score && (
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 text-[10px] font-black text-white bg-black/60 px-3 py-1 rounded-lg backdrop-blur-md border border-white/10 italic">
            <FiStar size={10} className="text-yellow-400 fill-yellow-400" />
            {score}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        {/* Platform icons row */}
        {platforms.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {platforms.map(p => (
              <span
                key={p}
                className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] text-[var(--theme-text-muted)] italic"
              >
                {p}
              </span>
            ))}
          </div>
        )}

        <h3
          className="text-base font-black uppercase tracking-tight mb-2 line-clamp-1 group-hover:text-[var(--theme-primary)] transition-colors italic text-[var(--theme-text)]"
        >
          {game.title}
        </h3>

        {(game.short_description || game.description || game.tagline) && (
          <p className="text-xs font-medium leading-relaxed line-clamp-2 flex-1 text-[var(--theme-text-muted)] italic opacity-60">
            {game.short_description || game.description || game.tagline}
          </p>
        )}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <div onClick={onClick} className="h-full">
        {inner}
      </div>
    );
  }

  return (
    <Link to={`/games/${slug}`} className="block h-full">
      {inner}
    </Link>
  );
}
