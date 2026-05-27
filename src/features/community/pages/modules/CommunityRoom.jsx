import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FiSettings, FiUsers, FiMic, FiHash, FiCheckCircle, FiVolume2 } from 'react-icons/fi';
import ChatInput from '../../components/Chat/ChatInput';
import ChatMessage from '../../components/Chat/ChatMessage';
import { COMMUNITY_BRANCHES, MOCK_CHAT_MESSAGES, MOCK_ONLINE_USERS_BY_BRANCH } from '@/shared/data/communityData';
import core from '@/services/api/core';
import { useWebSocketChannel } from '@/services/hooks/useWebSocketChannel';

const BRANCH_LABELS = {
  dev: 'Dev', esports: 'Esports', content: 'Content',
  business: 'Business', art: 'Art', writing: 'Writing',
  audio: 'Audio', general: 'General', newcomers: 'Newcomers',
};

const CHANNEL_RULES = {
  general: ['Be respectful to all members', 'Stay on-topic for this branch', 'No spam or self-promotion without context', 'Use threads for long discussions'],
  help: ['Clearly state your problem', 'Share code snippets with proper formatting', 'Mark helpful answers as accepted', 'No duplicate questions — search first'],
  showcase: ['Work-in-progress and finished pieces welcome', 'Provide context with every post', 'Give constructive feedback when commenting'],
};

function formatDay(value) {
  return new Date(value).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function sameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

// ── Right sidebar components ──────────────────────────────────────────────────

function OnlineMembersPanel({ slug, onlineCount, mentionUsers }) {
  const onlineUsers = (MOCK_ONLINE_USERS_BY_BRANCH[slug] || []).filter(u => u.status === 'online').slice(0, 8);
  return (
    <div className="rounded-2xl border p-4 space-y-3" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-card)' }}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        Online — {onlineCount}
      </div>
      <div className="space-y-2">
        {onlineUsers.map(user => (
          <div key={user.id} className="flex items-center gap-2">
            <div className="relative shrink-0">
              <img src={user.avatar_url} alt={user.username} className="h-7 w-7 rounded-lg object-cover" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2" style={{ borderColor: 'var(--theme-card)' }} />
            </div>
            <span className="text-xs truncate" style={{ color: 'var(--theme-text)' }}>@{user.username}</span>
          </div>
        ))}
        {onlineCount > 8 && (
          <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>+{onlineCount - 8} more online</p>
        )}
      </div>
    </div>
  );
}

function PinnedMessagesPanel({ channelId }) {
  const [pinned, setPinned] = useState([]);

  useEffect(() => {
    if (!channelId) return;
    core.get(`/community/channels/${channelId}/pinned`)
      .then(r => { if (r.data?.data) setPinned(r.data.data); })
      .catch(() => {});
  }, [channelId]);

  if (pinned.length === 0) return null;

  return (
    <div className="rounded-2xl border p-4 space-y-3" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-card)' }}>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
        📌 Pinned ({pinned.length})
      </p>
      <div className="space-y-2">
        {pinned.map(msg => (
          <div key={msg.id} className="rounded-xl p-2.5 text-xs border" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-alt)', color: 'var(--theme-text)' }}>
            <p className="font-semibold mb-0.5" style={{ color: 'var(--theme-text-muted)' }}>@{msg.author_username}</p>
            <p className="line-clamp-2">{msg.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChannelRulesPanel({ channelName }) {
  const rules = CHANNEL_RULES[channelName] || CHANNEL_RULES.general;
  return (
    <div className="rounded-2xl border p-4 space-y-3" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-card)' }}>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
        📋 Channel Rules
      </p>
      <ol className="space-y-1.5 text-xs list-none">
        {rules.map((rule, i) => (
          <li key={i} className="flex items-start gap-2" style={{ color: 'var(--theme-text)' }}>
            <FiCheckCircle className="text-emerald-400 shrink-0 mt-0.5" size={11} />
            {rule}
          </li>
        ))}
      </ol>
    </div>
  );
}

function VoiceRoomPanel() {
  return (
    <div className="rounded-2xl border p-4 space-y-3" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-card)' }}>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
        🎙 Voice Room
      </p>
      <div className="rounded-xl border-2 border-dashed p-4 text-center" style={{ borderColor: 'var(--theme-border)' }}>
        <FiVolume2 className="mx-auto mb-2" size={20} style={{ color: 'var(--theme-text-muted)', opacity: 0.4 }} />
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--theme-text-muted)', opacity: 0.5 }}>
          Voice — Coming Soon
        </p>
        <button
          className="rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider opacity-40 cursor-not-allowed"
          style={{ background: 'var(--theme-bg-alt)', color: 'var(--theme-text)' }}
          disabled
        >
          Join Voice
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CommunityRoom() {
  const { slug, channelId } = useParams();
  const containerRef = useRef(null);
  const branch = COMMUNITY_BRANCHES.find((entry) => entry.slug === slug);
  const [hoveredUser, setHoveredUser] = useState(null);
  const activeChannel = channelId || 'general';

  const initialMessages = useMemo(() => {
    const channelMessages = MOCK_CHAT_MESSAGES.filter((message) => message.channel_id.includes(activeChannel));
    const messages = channelMessages.length ? channelMessages : MOCK_CHAT_MESSAGES;
    return messages.map((message) => ({
      ...message,
      branchLabel: BRANCH_LABELS[slug] || 'Community',
    }));
  }, [activeChannel, slug]);

  const [messages, setMessages] = useState(initialMessages);
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages(initialMessages);
    setVisibleCount(12);
  }, [initialMessages]);

  // WebSocket: receive real-time messages from other connected users
  const handleWsMessage = useCallback((wsMsg) => {
    setMessages((prev) => {
      // Deduplicate against existing messages
      const exists = prev.some(
        (m) => m.created_at === wsMsg.timestamp && m.sender_id === wsMsg.sender_id,
      );
      if (exists) return prev;
      return [
        ...prev,
        {
          id:         `ws-${wsMsg.timestamp}-${wsMsg.sender_id}`,
          channel_id: wsMsg.channel,
          sender_id:  wsMsg.sender_id,
          sender:     { username: wsMsg.sender_id, display_name: wsMsg.sender_id, avatar_url: '' },
          content:    wsMsg.content,
          reactions:  {},
          created_at: wsMsg.timestamp,
          branchLabel: BRANCH_LABELS[slug] || 'Community',
        },
      ];
    });
  }, [slug]);

  const { sendMessage: wsSend } = useWebSocketChannel(slug, activeChannel, { onMessage: handleWsMessage });

  useEffect(() => {
    const node = containerRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, visibleCount]);

  const visibleMessages = messages.slice(Math.max(0, messages.length - visibleCount));
  const mentionUsers = (MOCK_ONLINE_USERS_BY_BRANCH[slug] || MOCK_ONLINE_USERS_BY_BRANCH.general || []).filter(u => u.status === 'online');
  const onlineCount = Math.max(18, Math.round((branch?.member_count || 200) * 0.07));

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* ── Main chat area ── */}
      <div className="community-chat-container" style={{ flex: 1, minWidth: 0 }}>
        <div style={{ background: 'var(--theme-card)', borderBottom: '1px solid var(--theme-border)' }} className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FiHash size={14} style={{ color: 'var(--theme-text-muted)' }} />
                <span className="community-message-author">{activeChannel}</span>
                <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Live discussion for {branch?.name || 'this branch'}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--theme-text-muted)' }}>
                <FiUsers size={13} />
                <span>{onlineCount} online</span>
              </div>
            </div>
            <button
              className="rounded-xl border p-2.5 transition hover:border-[var(--theme-primary)]"
              style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-alt)', color: 'var(--theme-text)' }}
            >
              <FiSettings />
            </button>
          </div>
        </div>

        <div ref={containerRef} className="community-chat-container custom-scrollbar flex-1 px-3 py-4 sm:px-6">
          {visibleCount < messages.length ? (
            <div className="mb-4 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + 10)}
                className="rounded-full border px-4 py-2 text-sm transition hover:border-[var(--theme-primary)]"
                style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-card)', color: 'var(--theme-text)' }}
              >
                Load more
              </button>
            </div>
          ) : null}

          <div className="space-y-1">
            {visibleMessages.map((message, index) => {
              const previousMessage = visibleMessages[index - 1];
              const isGrouped = Boolean(previousMessage && previousMessage.sender_id === message.sender_id && sameDay(previousMessage.created_at, message.created_at));
              const showDateSeparator = !previousMessage || !sameDay(previousMessage.created_at, message.created_at);
              const isOwn = message.sender_id === 'current-user';

              return (
                <div key={message.id}>
                  {showDateSeparator ? (
                    <div className="my-4 flex items-center gap-3">
                      <div className="h-px flex-1" style={{ background: 'var(--theme-border)' }} />
                      <span className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--theme-text-muted)' }}>{formatDay(message.created_at)}</span>
                      <div className="h-px flex-1" style={{ background: 'var(--theme-border)' }} />
                    </div>
                  ) : null}
                  <ChatMessage message={message} isOwn={isOwn} isGrouped={isGrouped} onOpenProfile={setHoveredUser} />
                </div>
              );
            })}
          </div>
        </div>

        {hoveredUser ? (
          <div className="pointer-events-none absolute right-[316px] top-20 z-20 w-72 rounded-2xl border p-4 shadow-2xl" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-card)' }}>
            <div className="flex items-start gap-3">
              <img src={hoveredUser.avatar_url} alt={hoveredUser.username} className="h-12 w-12 rounded-xl object-cover" />
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>@{hoveredUser.username}</p>
                <p className="mt-1 text-xs" style={{ color: 'var(--theme-text-muted)' }}>{hoveredUser.role || 'Community Member'}</p>
                <div className="mt-2 flex items-center gap-1 text-xs text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Online
                </div>
                <p className="mt-2 text-xs" style={{ color: 'var(--theme-text)' }}>Level {hoveredUser.level || 10}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(hoveredUser.skills || ['Collaboration', 'Mentoring']).slice(0, 2).map((skill) => (
                <span key={skill} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs" style={{ background: 'var(--theme-bg-section)', color: 'var(--theme-text)' }}>
                  <FiCheckCircle className="text-emerald-400" />
                  {skill}
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <button className="pointer-events-auto rounded-lg border px-3 py-1 text-xs" style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}>Connect</button>
              <button className="pointer-events-auto rounded-lg border px-3 py-1 text-xs" style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}>Message</button>
            </div>
          </div>
        ) : null}

        <ChatInput
          branchSlug={slug}
          channelName={activeChannel}
          mentionUsers={mentionUsers}
          onSend={(message) => {
            setMessages((current) => [...current, { ...message, branchLabel: BRANCH_LABELS[slug] || 'Community' }]);
            wsSend(message.content, message.sender_id);
          }}
        />
      </div>

      {/* ── Right sidebar ── */}
      <aside
        className="hidden lg:flex flex-col gap-4 overflow-y-auto custom-scrollbar p-4 shrink-0"
        style={{ width: 280, borderLeft: '1px solid var(--theme-border)', background: 'var(--theme-bg-alt)' }}
      >
        <OnlineMembersPanel slug={slug} onlineCount={onlineCount} mentionUsers={mentionUsers} />
        <PinnedMessagesPanel channelId={channelId} />
        <ChannelRulesPanel channelName={activeChannel} />
        <VoiceRoomPanel />
      </aside>
    </div>
  );
}
