import React, { useState } from 'react';
import { FiTrendingUp, FiHeart, FiMessageCircle } from 'react-icons/fi';
import { MOCK_TRENDING_POSTS } from '@/shared/data/communityData';

const FILTERS = [
    { label: 'Last 24h', value: '24h' },
    { label: 'This week', value: 'week' },
    { label: 'All time', value: 'all' },
];

const TrendingPostsFeed = () => {
    const [activeFilter, setActiveFilter] = useState('24h');

    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <FiTrendingUp className="text-[var(--theme-primary)]" size={16} />
                    <h3 className="text-sm font-bold text-[var(--theme-text)]">Trending Posts</h3>
                </div>
                <div className="flex gap-1">
                    {FILTERS.map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setActiveFilter(f.value)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                                activeFilter === f.value
                                    ? 'bg-[var(--theme-primary)] text-[var(--theme-text-inverse)]'
                                    : 'bg-[var(--theme-bg-alt)] text-[var(--theme-text-muted)] border border-[var(--theme-border)] hover:border-[var(--theme-border-strong)] hover:text-[var(--theme-text)]'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                {MOCK_TRENDING_POSTS.map((post) => (
                    <div
                        key={post.id}
                        className="rounded-xl border border-[var(--theme-border)]/50 bg-[var(--theme-bg-alt)]/50 p-4 hover:border-[var(--theme-border-strong)] hover:bg-[var(--theme-bg-alt)]/70 transition cursor-pointer"
                    >
                        <div className="flex items-center gap-2.5 mb-2">
                            <img
                                src={post.author.avatar_url}
                                alt={post.author.display_name}
                                className="w-6 h-6 rounded-full object-cover"
                            />
                            <span className="text-sm font-semibold text-[var(--theme-text)]">{post.author.display_name}</span>
                            <span
                                className="ml-auto px-2 py-0.5 rounded-md text-[11px] font-bold"
                                style={{ backgroundColor: `${post.branch_color}25`, color: post.branch_color }}
                            >
                                {post.branch_label}
                            </span>
                        </div>

                        <p className="text-sm text-[var(--theme-text)] line-clamp-2">
                            {post.content.length > 100 ? `${post.content.slice(0, 100)}…` : post.content}
                        </p>

                        <div className="flex items-center gap-4 mt-3 text-xs text-[var(--theme-text-muted)]">
                            <span className="flex items-center gap-1.5">
                                <FiHeart size={11} />
                                {post.likes.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <FiMessageCircle size={11} />
                                {post.comments}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default TrendingPostsFeed;
