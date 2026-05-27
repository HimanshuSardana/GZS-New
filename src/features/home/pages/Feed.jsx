import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { FiCalendar, FiAward, FiImage, FiChevronDown, FiLoader } from 'react-icons/fi';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import Skeleton from '@/shared/components/Skeleton';
import core from '@/services/api/core';

async function fetchFeedPage({ pageParam = 1 }) {
  const res = await core.get('/feed', { params: { page: pageParam, limit: 20 } });
  return res.data ?? res;
}

const TYPE_CONFIG = {
  tournament: {
    icon: FiAward,
    label: 'Tournament',
    accent: 'var(--accent-esports)',
    bg: 'var(--accent-esports-bg)',
    border: 'var(--accent-esports-border)',
    href: (item) => item.slug ? `/tournaments/${item.slug}` : null,
  },
  showcase: {
    icon: FiImage,
    label: 'Showcase',
    accent: 'var(--accent-community)',
    bg: 'var(--accent-community-bg)',
    border: 'var(--accent-community-border)',
    href: () => null,
  },
};

function FeedItem({ item }) {
  const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.showcase;
  const Icon = config.icon;
  const href = config.href(item);

  const content = (
    <div
      className="group flex gap-4 rounded-2xl border p-5 transition-all hover:shadow-md"
      style={{
        background: 'var(--theme-card)',
        borderColor: 'var(--theme-border)',
      }}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ background: config.bg, color: config.accent }}
      >
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2 flex-wrap">
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider"
            style={{ background: config.bg, color: config.accent }}
          >
            {config.label}
          </span>
          {item.ts && (
            <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
              <FiCalendar size={11} />
              {new Date(item.ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>
        <p className="font-bold leading-snug text-sm" style={{ color: 'var(--theme-text)' }}>
          {item.headline || item.title || 'Untitled'}
        </p>
        {item.body && (
          <p className="mt-1 text-xs line-clamp-2" style={{ color: 'var(--theme-text-muted)' }}>
            {item.body}
          </p>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link to={href} className="block">{content}</Link>;
  }
  return content;
}

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 rounded-2xl border p-5" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-card)' }}>
          <Skeleton width="44px" height="44px" rounded="xl" animate="shimmer" />
          <div className="flex-1 space-y-2">
            <Skeleton height="16px" width="30%" />
            <Skeleton height="20px" width="80%" />
            <Skeleton height="14px" width="60%" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Feed() {
  usePageTheme('home');
  const [typeFilter, setTypeFilter] = useState('all');

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['feed', typeFilter],
    queryFn: fetchFeedPage,
    getNextPageParam: (lastPage, pages) =>
      lastPage.has_more ? pages.length + 1 : undefined,
    staleTime: 60_000,
    retry: 1,
  });

  const allItems = data?.pages.flatMap((p) => p.items ?? []) ?? [];
  const filtered = typeFilter === 'all'
    ? allItems
    : allItems.filter((item) => item.type === typeFilter);

  return (
    <div className="min-h-screen" style={{ background: 'var(--theme-bg)' }}>
      <Helmet>
        <title>Feed | GzoneSphere</title>
      </Helmet>

      <div className="mx-auto max-w-2xl px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <p
            className="mb-1 text-[10px] font-black uppercase tracking-[0.2em]"
            style={{ color: 'var(--theme-primary)' }}
          >
            Your Activity
          </p>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--theme-text)' }}>
            Feed
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            Upcoming tournaments and community highlights from GzoneSphere.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {['all', 'tournament', 'showcase'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(type)}
              className="rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wider transition-all"
              style={
                typeFilter === type
                  ? { background: 'var(--theme-primary)', color: '#fff' }
                  : { background: 'var(--theme-bg-alt)', color: 'var(--theme-text-muted)' }
              }
            >
              {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1) + 's'}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <FeedSkeleton />
        ) : isError ? (
          <div
            className="rounded-2xl border px-6 py-12 text-center"
            style={{ borderColor: 'var(--status-error)' + '33', background: 'var(--status-error-soft)' }}
          >
            <p className="font-bold text-sm" style={{ color: 'var(--status-error-text)' }}>
              Could not load feed. Check your connection and try again.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="rounded-2xl border px-6 py-16 text-center"
            style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-card)' }}
          >
            <p className="font-bold text-sm" style={{ color: 'var(--theme-text-muted)' }}>
              Nothing to show right now. Check back soon.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <FeedItem key={`${item.type}-${item.id}`} item={item} />
            ))}
          </div>
        )}

        {/* Load more */}
        {hasNextPage && !isLoading && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-50"
              style={{ background: 'var(--theme-bg-alt)', color: 'var(--theme-text)' }}
            >
              {isFetchingNextPage ? (
                <FiLoader size={16} className="animate-spin" />
              ) : (
                <FiChevronDown size={16} />
              )}
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
