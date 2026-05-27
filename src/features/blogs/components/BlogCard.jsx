import React from 'react';
import { Link } from 'react-router-dom';
import { FiClock } from 'react-icons/fi';
import { HiHeart, HiOutlineHeart } from 'react-icons/hi';

function BlogCard({ blog = {}, onClick, variant = 'default' }) {
  const {
    id,
    slug,
    image,
    category,
    type,
    title,
    description,
    author,
    read_time,
    likes = 0,
  } = blog;

  const href = `/blog/${slug || id}`;
  const readTime = read_time || Math.ceil(((description || '').split(/\s+/).length || 200) / 200);

  const [isLiked, setIsLiked] = React.useState(false);
  const [likeCount, setLikeCount] = React.useState(likes);

  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(prev => !prev);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  if (variant === 'compact') {
    return (
      <Link
        to={href}
        className="flex gap-3 group items-center hover:bg-[var(--theme-bg-alt)] rounded-xl p-2 transition-colors"
      >
        <div className="w-16 h-14 rounded-lg overflow-hidden shrink-0 bg-[var(--theme-bg-alt)]">
          <img
            src={image || '/images/blogs.jpg'}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-[var(--theme-text)] group-hover:text-[var(--theme-primary)] transition-colors line-clamp-2 leading-snug">{title}</p>
          <div className="flex items-center gap-1 mt-1 text-[var(--theme-text-muted)]">
            <FiClock size={10} />
            <span className="text-[10px] font-semibold">{readTime} min read</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div
      className="bg-[var(--theme-card)] overflow-hidden rounded-2xl border border-[var(--theme-border)] flex flex-col group hover:shadow-lg hover:-translate-y-0.5 hover:border-[var(--theme-primary)] transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <Link to={href} className="relative aspect-video overflow-hidden bg-[var(--theme-bg-alt)] block">
        <img
          src={image || '/images/blogs.jpg'}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {category && (
          <span
            className="absolute top-3 left-3 px-3 py-1 text-[10px] font-black uppercase tracking-wide rounded-full text-white"
            style={{ background: 'var(--theme-primary)' }}
          >
            {category}
          </span>
        )}
        {type && (
          <span className="absolute top-3 right-3 px-3 py-1 text-[10px] font-black uppercase tracking-wide rounded-full bg-black/50 text-white backdrop-blur-sm">
            {type}
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1 gap-3">
        <Link to={href}>
          <h3 className="text-base font-bold leading-snug text-[var(--theme-text)] group-hover:text-[var(--theme-primary)] transition-colors line-clamp-2">
            {title}
          </h3>
        </Link>

        {description && (
          <p className="text-sm text-[var(--theme-text-muted)] leading-relaxed line-clamp-2 flex-1">
            {description}
          </p>
        )}

        {/* Author row */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--theme-border)] mt-auto">
          <div className="flex items-center gap-2">
            {author?.avatar
              ? <img src={author.avatar} alt={author.name} className="w-7 h-7 rounded-full object-cover" />
              : <div className="w-7 h-7 rounded-full bg-[var(--theme-primary)]/20 flex items-center justify-center text-xs font-bold text-[var(--theme-primary)]">
                  {(author?.name || 'G')[0].toUpperCase()}
                </div>
            }
            <div>
              <p className="text-xs font-bold text-[var(--theme-text)] leading-none">{author?.name || 'GzoneSphere'}</p>
              {author?.domain && (
                <span className="text-[10px] font-semibold text-[var(--theme-primary)] opacity-70">{author.domain}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-[var(--theme-text-muted)]">
            <div className="flex items-center gap-1">
              <FiClock size={11} />
              <span className="font-semibold">{readTime} min</span>
            </div>
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 transition-colors ${isLiked ? 'text-red-500' : 'hover:text-[var(--theme-primary)]'}`}
            >
              {isLiked ? <HiHeart size={13} /> : <HiOutlineHeart size={13} />}
              <span className="font-bold tabular-nums">{likeCount}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(BlogCard);
