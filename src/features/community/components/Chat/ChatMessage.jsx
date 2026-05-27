import { useMemo, useState } from 'react';
import { FiCheckCircle, FiChevronDown, FiCode, FiCopy, FiCornerUpLeft, FiEdit2, FiFlag, FiTrash2 } from 'react-icons/fi';

function formatRelativeTime(value) {
  const now = Date.now();
  const diffMs = now - new Date(value).getTime();
  const diffMin = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} hr ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays} day ago`;
}

const reactionEntries = (reactions) =>
  Object.entries(reactions || {}).map(([emoji, users]) => ({
    emoji,
    count: Array.isArray(users) ? users.length : Number(users) || 0,
  }));

function renderInlineMarkdown(text) {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return tokens.map((token, idx) => {
    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code key={`md-${idx}`} className="rounded px-1 py-0.5 text-xs" style={{ background: 'var(--theme-bg-section)', color: 'var(--theme-text)' }}>
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={`md-${idx}`}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith('*') && token.endsWith('*')) {
      return <em key={`md-${idx}`}>{token.slice(1, -1)}</em>;
    }
    return <span key={`md-${idx}`}>{token}</span>;
  });
}

function renderMarkdown(content) {
  const parts = content.split(/```([\s\S]*?)```/g);
  return parts.map((part, idx) => {
    if (idx % 2 === 1) {
      return (
        <pre key={`block-${idx}`} className="my-2 overflow-x-auto rounded-xl border p-3 text-xs" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-card)', color: 'var(--theme-text)' }}>
          <code>{part}</code>
        </pre>
      );
    }
    return (
      <p key={`text-${idx}`} className="whitespace-pre-wrap">
        {renderInlineMarkdown(part)}
      </p>
    );
  });
}

const REACTION_CHOICES = ['👍', '❤️', '😂', '🔥', '👀'];

export default function ChatMessage({ message, isOwn, isGrouped, onOpenProfile }) {
  const reactions = reactionEntries(message.reactions);
  const [showActions, setShowActions] = useState(false);
  const exactTime = useMemo(() => new Date(message.created_at).toLocaleString(), [message.created_at]);

  const mediaItems = message.media_urls || [];

  if (isGrouped) {
    return (
      <div className="group pl-14 pr-3">
        <div className="rounded-2xl px-3 py-2 text-sm leading-6 transition hover:bg-[var(--theme-bg-alt)]" style={{ color: 'var(--theme-text)' }}>
          {renderMarkdown(message.content)}
        </div>
        {reactions.length ? (
          <div className="mt-2 flex flex-wrap gap-2 pl-3">
            {reactions.map((reaction) => (
              <button
                key={`${message.id}-${reaction.emoji}`}
                className="rounded-full border px-2.5 py-1 text-xs"
                style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-card)', color: 'var(--theme-text)' }}
              >
                {reaction.emoji} {reaction.count}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="community-message group flex gap-3 transition">
      <div className="shrink-0">
        {message.sender?.avatar_url ? (
          <img
            src={message.sender.avatar_url}
            alt={message.sender.display_name || message.sender.username}
            className="h-10 w-10 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-sm font-semibold text-indigo-200">
            {(message.sender?.display_name || message.sender?.username || 'G')[0]}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onMouseEnter={() => onOpenProfile?.(message.sender)}
            onClick={() => onOpenProfile?.(message.sender)}
            className="text-sm font-semibold underline decoration-dotted underline-offset-4"
            style={{ color: 'var(--theme-text)' }}
          >
            @{message.sender?.username || 'community_member'}
          </button>
          <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs font-medium text-indigo-200">
            {message.branchLabel || 'Community'}
          </span>
          <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }} title={exactTime}>
            {formatRelativeTime(message.created_at)}
          </span>
        </div>

        <div className="mt-1 text-sm leading-6" style={{ color: 'var(--theme-text)' }}>{renderMarkdown(message.content)}</div>

        {mediaItems.length ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {mediaItems.map((url) => (
              <div key={url} className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-card)' }}>
                <img src={url} alt="attachment" className="h-28 w-full object-cover" />
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {REACTION_CHOICES.map((emoji) => (
            <button
              key={`${message.id}-${emoji}-option`}
              className="rounded-full border px-2 py-1 text-xs opacity-0 transition group-hover:opacity-100 hover:border-[var(--theme-primary)]"
              style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-alt)', color: 'var(--theme-text-muted)' }}
            >
              {emoji}
            </button>
          ))}
          <button
            className="rounded-full border px-2.5 py-1 text-xs opacity-0 transition group-hover:opacity-100"
            style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-alt)', color: 'var(--theme-text-muted)' }}
          >
            Add reaction
          </button>
          {reactions.map((reaction) => (
            <button
              key={`${message.id}-${reaction.emoji}`}
              className="rounded-full border px-2.5 py-1 text-xs transition hover:border-[var(--theme-primary)]"
              style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-card)', color: 'var(--theme-text)' }}
            >
              {reaction.emoji} {reaction.count}
            </button>
          ))}
        </div>
      </div>

      <div className="relative self-start">
        <button
          type="button"
          onClick={() => setShowActions((current) => !current)}
          className="hidden rounded-xl border px-2 py-1 opacity-0 transition group-hover:flex group-hover:opacity-100"
          style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-alt)', color: 'var(--theme-text-muted)' }}
          aria-label="Message actions"
        >
          <FiChevronDown size={14} />
        </button>

        {showActions ? (
          <div className="absolute right-0 z-10 mt-1 w-40 rounded-xl border p-1 shadow-lg" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-card)' }}>
            {[
              { label: 'Reply', icon: FiCornerUpLeft },
              { label: 'Copy', icon: FiCopy },
              { label: 'Report', icon: FiFlag },
              ...(isOwn ? [{ label: 'Edit', icon: FiEdit2 }, { label: 'Delete', icon: FiTrash2 }] : []),
            ].map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={`${message.id}-${action.label}`}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition hover:bg-[var(--theme-bg-alt)]"
                  style={{ color: 'var(--theme-text)' }}
                >
                  <Icon size={13} />
                  {action.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
