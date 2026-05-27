import { useEffect, useMemo, useRef, useState } from 'react';
import { FiBold, FiCode, FiFileText, FiImage, FiMic, FiPaperclip, FiSend, FiSmile, FiType, FiChevronDown } from 'react-icons/fi';
import communityService from '@/services/features/communityService';
import core from '@/services/api/core';

const MAX_CHARACTERS = 2000;
const QUICK_EMOJIS = ['😀', '🎮', '🔥', '👏', '🚀', '💬'];
const MOCK_GIFS = Array.from({ length: 6 }).map((_, idx) => `https://picsum.photos/220/120?random=gif-${idx + 1}`);

const DOMAIN_TO_BRANCH = {
  developer: 'dev',
  esports:   'esports',
  content:   'content',
  business:  'business',
  artist:    'art',
  writer:    'writing',
  audio:     'audio',
};

const BRANCH_DOT_COLOR = {
  dev:      '#14B8A6',
  esports:  '#EF4444',
  content:  '#F59E0B',
  business: '#3B82F6',
  art:      '#EC4899',
  writing:  '#22C55E',
  audio:    '#64748B',
};

// Mocked — replace with GET /profiles/me/sub-profiles
const MOCK_MY_SUB_PROFILES = [
  { id: 'sp_dev',     domain: 'developer', username: 'gzs_coder'   },
  { id: 'sp_esports', domain: 'esports',   username: 'gzs_pro'     },
  { id: 'sp_art',     domain: 'artist',    username: 'gzs_artist'  },
];

export default function ChatInput({ branchSlug, channelName, onSend, mentionUsers = [] }) {
  const [value, setValue] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showMentionList, setShowMentionList] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const fileInputRef = useRef(null);

  // Sub-profile identity selector
  const [subProfiles, setSubProfiles] = useState([]);
  const [activeSubProfileId, setActiveSubProfileId] = useState(null);

  useEffect(() => {
    core.get('/profiles/me/sub-profiles')
      .then(r => {
        const list = r.data?.data || r.data || [];
        if (list.length > 0) {
          const normalized = list.map(sp => ({
            id: sp.id,
            domain: sp.type || sp.domain,
            username: sp.username,
          }));
          setSubProfiles(normalized);
          const matching = normalized.find((sp) => DOMAIN_TO_BRANCH[sp.domain] === branchSlug);
          setActiveSubProfileId(matching?.id ?? normalized[0]?.id ?? null);
        } else {
          setSubProfiles(MOCK_MY_SUB_PROFILES);
          const matching = MOCK_MY_SUB_PROFILES.find((sp) => DOMAIN_TO_BRANCH[sp.domain] === branchSlug);
          setActiveSubProfileId(matching?.id ?? MOCK_MY_SUB_PROFILES[0]?.id ?? null);
        }
      })
      .catch(() => {
        setSubProfiles(MOCK_MY_SUB_PROFILES);
        const matching = MOCK_MY_SUB_PROFILES.find((sp) => DOMAIN_TO_BRANCH[sp.domain] === branchSlug);
        setActiveSubProfileId(matching?.id ?? MOCK_MY_SUB_PROFILES[0]?.id ?? null);
      });
  }, [branchSlug]);
  const [showIdentityPopover, setShowIdentityPopover] = useState(false);
  const identityPopoverRef = useRef(null);

  const activeSubProfile = useMemo(
    () => subProfiles.find((sp) => sp.id === activeSubProfileId) ?? subProfiles[0],
    [subProfiles, activeSubProfileId],
  );

  // Close popover on outside click
  useEffect(() => {
    if (!showIdentityPopover) return;
    const handler = (e) => {
      if (identityPopoverRef.current && !identityPopoverRef.current.contains(e.target)) {
        setShowIdentityPopover(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showIdentityPopover]);

  // Clear limit when channel changes
  useMemo(() => { setLimitReached(false); }, [channelName]);

  const remaining = useMemo(() => MAX_CHARACTERS - value.length, [value.length]);
  const mentionQuery = useMemo(() => {
    const atIndex = value.lastIndexOf('@');
    if (atIndex < 0) return '';
    const suffix = value.slice(atIndex + 1);
    if (suffix.includes(' ')) return '';
    return suffix.toLowerCase();
  }, [value]);
  const mentionCandidates = useMemo(
    () => mentionUsers.filter((user) => user.username.toLowerCase().includes(mentionQuery)).slice(0, 5),
    [mentionQuery, mentionUsers],
  );

  const submitMessage = async () => {
    const trimmed = value.trim();

    if (!trimmed || trimmed.length > MAX_CHARACTERS || isSending || limitReached) {
      return;
    }

    const payload = {
      id: `local-${Date.now()}`,
      channel_id: channelName,
      sender_id: 'current-user',
      sender: {
        username: activeSubProfile?.username ?? 'gzs_member',
        display_name: 'You',
        avatar_url: '',
      },
      content: trimmed,
      reactions: {},
      created_at: new Date().toISOString(),
      branchLabel: branchSlug,
      media_urls: attachments,
      sub_profile_id: activeSubProfile?.id ?? null,
      optimistic: true,
    };

    onSend?.(payload);
    setValue('');
    setAttachments([]);
    setShowEmojiPicker(false);
    setShowGifPicker(false);
    setShowMentionList(false);
    setIsSending(true);

    try {
      // TODO Phase E: Replace with WebSocket connection
      const res = await communityService.sendMessage({
        branch: branchSlug,
        channel: channelName,
        content: trimmed,
        sub_profile_id: activeSubProfile?.id ?? null,
      });
      // communityService returns the raw Response; check status
      if (res && res.status === 429) {
        setLimitReached(true);
      }
    } catch (err) {
      if (err?.status === 429 || err?.response?.status === 429) {
        setLimitReached(true);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await submitMessage();
      return;
    }

    if (event.key === '@') {
      setShowMentionList(true);
    }
  };

  const wrapText = (prefix, suffix = prefix) => {
    setValue((current) => `${current}${prefix}${suffix}`);
  };

  return (
    <div style={{ background: 'var(--theme-card)', borderTop: '1px solid var(--theme-border)' }} className="px-4 py-4">
      {/* Identity chip — only shown when user has >1 sub-profile */}
      {subProfiles.length > 1 && activeSubProfile && (
        <div className="mb-2 flex items-center gap-2 relative" ref={identityPopoverRef}>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--theme-text-muted)' }}>Posting as</span>
          <button
            type="button"
            onClick={() => setShowIdentityPopover((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-black transition hover:border-[var(--theme-primary)]"
            style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-alt)', color: 'var(--theme-text)' }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: BRANCH_DOT_COLOR[DOMAIN_TO_BRANCH[activeSubProfile.domain]] ?? '#94A3B8' }}
            />
            @{activeSubProfile.username}
            <FiChevronDown size={11} style={{ color: 'var(--theme-text-muted)' }} />
          </button>

          {showIdentityPopover && (
            <div
              className="absolute bottom-full mb-1.5 left-0 z-20 rounded-xl border shadow-xl py-1 min-w-[160px]"
              style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
            >
              {subProfiles.map((sp) => {
                const dot = BRANCH_DOT_COLOR[DOMAIN_TO_BRANCH[sp.domain]] ?? '#94A3B8';
                const active = sp.id === activeSubProfileId;
                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => { setActiveSubProfileId(sp.id); setShowIdentityPopover(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs transition hover:bg-[var(--theme-bg-section)]"
                    style={{ color: active ? 'var(--theme-primary)' : 'var(--theme-text)', fontWeight: active ? 700 : 500 }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: dot }} />
                    @{sp.username}
                    {active && <span className="ml-auto text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--theme-primary)' }}>Active</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {limitReached ? (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          <span>⚠️</span>
          <span>Daily message limit reached. Connect with someone in this channel to keep chatting.</span>
          <button className="ml-auto font-semibold underline" onClick={() => setLimitReached(false)}>Dismiss</button>
        </div>
      ) : (
        <p className="mb-2 text-xs" style={{ color: 'var(--theme-text-muted)' }}>Ava is typing...</p>
      )}

      {showEmojiPicker ? (
        <div className="mb-3 flex flex-wrap gap-2 rounded-2xl border p-3" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-alt)' }}>
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                if (value.length < MAX_CHARACTERS) {
                  setValue((current) => `${current}${emoji}`);
                }
              }}
              className="rounded-xl px-3 py-2 text-xl transition hover:bg-[var(--theme-bg-section)]"
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : null}

      {showGifPicker ? (
        <div className="mb-3 grid grid-cols-3 gap-2 rounded-2xl border p-3" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-alt)' }}>
          {MOCK_GIFS.map((gif) => (
            <button
              key={gif}
              type="button"
              onClick={() => {
                setAttachments((current) => [...current, gif].slice(0, 4));
                setShowGifPicker(false);
              }}
              className="overflow-hidden rounded-lg border"
              style={{ borderColor: 'var(--theme-border)' }}
            >
              <img src={gif} alt="gif option" className="h-16 w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      <div className="rounded-2xl border p-3" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-alt)' }}>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {[
            { label: 'Bold', icon: FiBold, onClick: () => wrapText('**', '**') },
            { label: 'Italic', icon: FiType, onClick: () => wrapText('*', '*') },
            { label: 'Code', icon: FiCode, onClick: () => wrapText('`', '`') },
            { label: 'Code block', icon: FiFileText, onClick: () => wrapText('\n```\n', '\n```\n') },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className="rounded-lg border px-2 py-1 text-xs transition hover:border-[var(--theme-primary)] hover:text-[var(--theme-text)]"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
              >
                <span className="inline-flex items-center gap-1">
                  <Icon size={12} />
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-end gap-3">
          <textarea
            value={value}
            onChange={(event) => {
              const next = event.target.value.slice(0, MAX_CHARACTERS);
              setValue(next);
              setShowMentionList(next.includes('@'));
            }}
            onKeyDown={handleKeyDown}
            rows={value.includes('\n') ? 4 : 2}
            placeholder={limitReached ? 'Message limit reached — connect to keep chatting' : `Message #${channelName}`}
            disabled={limitReached}
            className="min-h-[52px] flex-1 resize-none bg-transparent text-sm leading-6 outline-none disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ color: 'var(--theme-text)', '--placeholder-color': 'var(--theme-text-muted)' }}
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEmojiPicker((current) => !current)}
              className="rounded-xl p-2.5 transition hover:bg-[var(--theme-bg-section)] hover:text-[var(--theme-text)]"
              style={{ color: 'var(--theme-text-muted)' }}
              aria-label="Toggle emoji picker"
            >
              <FiSmile />
            </button>
            <button
              type="button"
              className="rounded-xl p-2.5 transition hover:bg-[var(--theme-bg-section)] hover:text-[var(--theme-text)]"
              style={{ color: 'var(--theme-text-muted)' }}
              aria-label="Attach file"
              onClick={() => fileInputRef.current?.click()}
            >
              <FiPaperclip />
            </button>
            <button
              type="button"
              onClick={() => setShowGifPicker((current) => !current)}
              className="rounded-xl p-2.5 transition hover:bg-[var(--theme-bg-section)] hover:text-[var(--theme-text)]"
              style={{ color: 'var(--theme-text-muted)' }}
              aria-label="GIF picker"
            >
              <FiImage />
            </button>
            <button
              type="button"
              onClick={() => setIsRecording((current) => !current)}
              className={`rounded-xl p-2.5 transition ${isRecording ? 'bg-rose-500/20 text-rose-300' : 'hover:bg-[var(--theme-bg-section)] hover:text-[var(--theme-text)]'}`}
              style={!isRecording ? { color: 'var(--theme-text-muted)' } : {}}
              aria-label="Voice note"
            >
              <FiMic />
            </button>
            <button
              type="button"
              onClick={submitMessage}
              disabled={!value.trim() || isSending || limitReached}
              className="rounded-xl p-2.5 text-white transition disabled:cursor-not-allowed"
              style={{ background: 'var(--theme-primary)', opacity: (!value.trim() || isSending || limitReached) ? 0.5 : 1 }}
              aria-label="Send message"
            >
              <FiSend />
            </button>
          </div>
        </div>

        {attachments.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <img key={attachment} src={attachment} alt="attachment preview" className="h-14 w-20 rounded-lg border object-cover" style={{ borderColor: 'var(--theme-border)' }} />
            ))}
          </div>
        ) : null}

        {showMentionList && mentionCandidates.length ? (
          <div className="mt-2 rounded-xl border p-2 shadow-xl" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-card)' }}>
            {mentionCandidates.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => {
                  const atIndex = value.lastIndexOf('@');
                  if (atIndex >= 0) {
                    setValue(`${value.slice(0, atIndex + 1)}${member.username} `);
                  }
                  setShowMentionList(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition hover:bg-[var(--theme-bg-section)]"
                style={{ color: 'var(--theme-text)' }}
              >
                <img src={member.avatar_url} alt={member.username} className="h-6 w-6 rounded-md object-cover" />
                @{member.username}
              </button>
            ))}
          </div>
        ) : null}

        {isRecording ? <p className="mt-2 text-xs text-rose-300">Recording voice note...</p> : null}
        <div className="mt-3 flex items-center justify-end text-xs" style={{ color: 'var(--theme-text-muted)' }}>{remaining}/2000</div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files || []);
          const urls = files.map((file) => URL.createObjectURL(file));
          setAttachments((current) => [...current, ...urls].slice(0, 4));
        }}
      />
    </div>
  );
}
