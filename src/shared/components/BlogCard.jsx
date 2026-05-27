import { Link } from 'react-router-dom';
import { HiOutlineHeart, HiHeart } from 'react-icons/hi';
import { FiArrowUpRight, FiClock, FiMaximize2 } from 'react-icons/fi';
import React from 'react';

/**
 * BlogCard — Command Nexus Publication Shard
 * Memoized to prevent re-renders in list contexts
 */
function BlogCard({
  id,
  image,
  title,
  description,
  likes = 0,
  highlighted = false,
}) {
  const [isLiked, setIsLiked] = React.useState(false);
  const [likeCount, setLikeCount] = React.useState(likes);

  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  return (
    <div className={`bg-[var(--theme-card)] overflow-hidden rounded-3xl border border-[var(--theme-border)] flex flex-col group hover:shadow-2xl transition-all duration-500 scale-100 hover:scale-[1.02] ${highlighted ? 'ring-2 ring-[var(--theme-primary)]/20 shadow-xl shadow-[var(--theme-primary)]/5' : ''}`}>
      {/* Image Container */}
      <Link to={`/blog/${id}`} className="relative h-64 overflow-hidden bg-[var(--theme-bg-alt)] block">
        <img
          src={image || "/images/blogs.jpg"}
          alt={title}
          className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--theme-card)] via-transparent to-transparent opacity-60" />
        
        {/* Category/Highlight Tag */}
        {highlighted && (
            <div className="absolute top-6 left-6 px-4 py-1.5 bg-[var(--theme-primary)] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-2xl italic">
                PRIME_INTEL
            </div>
        )}
        
        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-10 h-10 bg-[var(--theme-card)]/80 backdrop-blur-md rounded-xl flex items-center justify-center text-[var(--theme-primary)] border border-[var(--theme-border)]">
                <FiMaximize2 size={16} />
            </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-10 flex flex-col flex-1 space-y-6">
        <Link to={`/blog/${id}`} className="space-y-3 block">
            <div className="flex items-center gap-3 opacity-30">
                <FiClock size={12} className="text-[var(--theme-primary)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Trace Processed // 12H_AGO</span>
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-[var(--theme-text)] italic leading-[1.1] group-hover:text-[var(--theme-primary)] transition-colors">
              {title}
            </h3>
        </Link>

        <p className="text-[var(--theme-text-muted)] text-sm font-medium leading-relaxed italic opacity-60 flex-1 line-clamp-3">
          {description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-8 border-t border-[var(--theme-border)]">
          <Link
            to={`/blog/${id}`}
            className="flex items-center gap-4 text-xs font-black uppercase tracking-tight italic text-[var(--theme-text)] hover:text-[var(--theme-primary)] transition-all group/link"
          >
            REVIEW INTEL <FiArrowUpRight className="group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
          </Link>

          <button 
            onClick={handleLike}
            className={`flex items-center gap-2 transition-all ${isLiked ? 'text-[var(--status-error)]' : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)]'}`}
          >
            <span className="text-xs font-black italic tracking-widest tabular-nums">{likeCount}</span>
            {isLiked ? <HiHeart className="w-5 h-5 shadow-[0_0_10px_rgba(var(--status-error-rgb),0.3)]" /> : <HiOutlineHeart className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(BlogCard, (prevProps, nextProps) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.image === nextProps.image &&
    prevProps.title === nextProps.title &&
    prevProps.description === nextProps.description &&
    prevProps.likes === nextProps.likes &&
    prevProps.highlighted === nextProps.highlighted
  );
});







