import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft, FiLock, FiUsers, FiMapPin, FiExternalLink, FiX } from 'react-icons/fi';
import { useQueryClient } from '@tanstack/react-query';
import { useGroup } from '@/services/mutators/useCommunity';
import core from '@/services/api/core';
import ChatInput from '../../components/Chat/ChatInput';
import ChatMessage from '../../components/Chat/ChatMessage';
import { MOCK_CHAT_MESSAGES, MOCK_SHOWCASE_POSTS_BY_BRANCH } from '@/shared/data/communityData';

const BRANCH_GRADIENTS = {
  dev: 'from-indigo-500/40 to-violet-500/30',
  esports: 'from-rose-500/40 to-orange-500/30',
  content: 'from-pink-500/40 to-fuchsia-500/30',
  business: 'from-sky-500/40 to-cyan-500/30',
  art: 'from-amber-500/40 to-yellow-500/30',
  writing: 'from-teal-500/40 to-emerald-500/30',
  audio: 'from-purple-500/40 to-indigo-500/30',
  general: 'from-slate-500/40 to-slate-400/30',
  newcomers: 'from-green-500/40 to-teal-500/30',
};

const ROLE_COLORS = {
  Owner: 'bg-indigo-500/20 text-indigo-300',
  Moderator: 'bg-amber-500/20 text-amber-300',
  Member: 'bg-slate-700 text-slate-300',
};

const MOCK_VIEWER_ID = 'u3-sync-master-uuid';

export default function GroupView() {
  const { slug, groupId } = useParams();
  const queryClient = useQueryClient();
  const { data: groupData, isLoading } = useGroup(groupId);
  const group = groupData?.data || groupData || {};
  const gradient = BRANCH_GRADIENTS[slug] || BRANCH_GRADIENTS.general;

  const baseMessages = useMemo(
    () =>
      MOCK_CHAT_MESSAGES.slice(0, 4).map((m) => ({
        ...m,
        branchLabel: group?.name || 'Group',
      })),
    [group?.name],
  );

  const [messages, setMessages] = useState(baseMessages);
  const [tab, setTab] = useState('PINBOARD');
  const [pinnedIds, setPinnedIds] = useState(new Set(['p1']));

  const members = useMemo(
    () => [
      { id: 'm1', username: 'sync_master', role: 'Owner', skill: 'Unreal Optimization', avatar: 'https://i.pravatar.cc/150?u=sync_master' },
      { id: 'm2', username: 'shader_monk', role: 'Moderator', skill: 'Rendering', avatar: 'https://i.pravatar.cc/150?u=shader_monk' },
      { id: 'm3', username: 'loop_logic', role: 'Member', skill: 'Gameplay Systems', avatar: 'https://i.pravatar.cc/150?u=loop_logic' },
      { id: 'm4', username: 'voxel_drift', role: 'Member', skill: 'Level Design', avatar: 'https://i.pravatar.cc/150?u=voxel_drift' },
    ],
    [],
  );

  const pinboard = useMemo(
    () => [
      { id: 'p1', title: 'Branch architecture docs', url: 'https://example.com/docs', notes: 'Core architecture notes from sprint 3', postedBy: 'sync_master' },
      { id: 'p2', title: 'Shader material repo', url: 'https://example.com/shaders', notes: 'Material experiments — WIP', postedBy: 'shader_monk' },
      { id: 'p3', title: 'Sprint board (Notion)', url: 'https://example.com/sprint', notes: 'Active sprint tasks and backlog', postedBy: 'loop_logic' },
    ],
    [],
  );

  const groupEvents = useMemo(
    () => [
      { id: 'ge1', name: 'Sprint Sync', date: 'Apr 30, 7:00 PM', type: 'community_call' },
      { id: 'ge2', name: 'Live Critique Session', date: 'May 2, 9:00 PM', type: 'workshop' },
      { id: 'ge3', name: 'Jam Kickoff', date: 'May 5, 6:00 PM', type: 'game_jam' },
    ],
    [],
  );

  const showcaseItems = useMemo(
    () => (MOCK_SHOWCASE_POSTS_BY_BRANCH[slug] || []).slice(0, 4),
    [slug],
  );

  const viewerIsOwner = members[0]?.username === 'sync_master';
  const capacityPct = group?.max_members ? Math.min(100, Math.round((group.member_count / group.max_members) * 100)) : 0;

  const handleGroupMessage = async (content) => {
    try {
      await core.post(`/community/groups/${groupId}/messages`, { content });
      queryClient.invalidateQueries({ queryKey: ['community', 'group', groupId] });
    } catch { /* message send failed silently */ }
  };

  function togglePin(id) {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-200">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-slate-400">Loading group...</p>
        </div>
      </div>
    );
  }

  if (!group?.id) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-200">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-slate-400">Group not found.</p>
          <Link to={`/community/${slug}/groups`} className="mt-4 inline-block text-indigo-300">
            ← Back to groups
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">

        {/* Header card */}
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
          <div className={`h-32 bg-gradient-to-r ${gradient}`} />
          <div className="px-6 pb-6 pt-4">
            <Link to={`/community/${slug}/groups`} className="inline-flex items-center gap-1.5 text-sm text-indigo-300 hover:text-indigo-200">
              <FiArrowLeft size={13} /> Back to groups
            </Link>

            <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold text-white">{group.name}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{group.description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1.5 text-sm text-slate-300">
                  <FiUsers size={13} /> {group.member_count} / {group.max_members}
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm ${group.visibility === 'public' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
                  <FiLock size={13} /> {group.visibility}
                </span>
              </div>
            </div>

            {/* Capacity bar */}
            <div className="mt-4">
              <div className="h-1.5 rounded-full bg-slate-800">
                <div
                  className={`h-1.5 rounded-full transition-all ${capacityPct >= 90 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                  style={{ width: `${capacityPct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">{capacityPct}% capacity</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">

          {/* Left — group chat */}
          <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
            <div className="border-b border-slate-800 px-5 py-4">
              <h2 className="text-base font-semibold text-white">Group Chat</h2>
              <p className="mt-0.5 text-xs text-slate-400">Private discussion space for members.</p>
            </div>

            <div className="space-y-1 px-3 py-4 min-h-[260px] max-h-[420px] overflow-y-auto">
              {messages.map((message, index) => {
                const prev = messages[index - 1];
                const isGrouped = Boolean(prev && prev.sender_id === message.sender_id);
                const isOwn = message.sender_id === MOCK_VIEWER_ID;
                return <ChatMessage key={message.id} message={message} isOwn={isOwn} isGrouped={isGrouped} />;
              })}
            </div>

            <ChatInput
              branchSlug={slug}
              channelName={group.name.toLowerCase().replace(/\s+/g, '-')}
              onSend={(message) => {
                setMessages((prev) => [...prev, { ...message, branchLabel: group.name }]);
                handleGroupMessage(message.content || message.text || '');
              }}
            />
          </section>

          {/* Right — sidebar tabs */}
          <aside className="space-y-5">
            {/* Mini profile card */}
            <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
              <div className={`h-16 bg-gradient-to-r ${gradient}`} />
              <div className="p-4">
                <p className="text-sm font-semibold text-white">{group.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {group.member_count}/{group.max_members} members · {group.visibility}
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-slate-800">
                  <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${capacityPct}%` }} />
                </div>
              </div>
            </div>

            {/* Tab panel */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex flex-wrap gap-1.5 mb-4">
                {['PINBOARD', 'MEMBERS', 'EVENTS', 'SHOWCASE'].map((item) => (
                  <button
                    key={item}
                    onClick={() => setTab(item)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${tab === item ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {/* PINBOARD */}
              {tab === 'PINBOARD' ? (
                <div className="space-y-2">
                  {pinboard.map((item) => {
                    const isPinned = pinnedIds.has(item.id);
                    return (
                      <div key={item.id} className={`rounded-xl border p-3 ${isPinned ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-slate-800 bg-slate-950/60'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-indigo-300 hover:underline"
                            >
                              <FiExternalLink size={10} /> {item.url.replace('https://', '')}
                            </a>
                            <p className="mt-1 text-[11px] text-slate-500">{item.notes} · @{item.postedBy}</p>
                          </div>
                          <button
                            onClick={() => togglePin(item.id)}
                            title={isPinned ? 'Unpin' : 'Pin'}
                            className={`shrink-0 p-1 rounded-lg transition-colors ${isPinned ? 'text-indigo-400' : 'text-slate-600 hover:text-slate-400'}`}
                          >
                            <FiMapPin size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <button className="w-full rounded-xl border border-dashed border-slate-700 py-2 text-xs text-slate-500 hover:border-slate-500 hover:text-slate-300 transition-colors">
                    + Add resource
                  </button>
                </div>
              ) : null}

              {/* MEMBERS */}
              {tab === 'MEMBERS' ? (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                      <div className="flex items-center gap-2">
                        <img src={member.avatar} alt={member.username} className="h-7 w-7 rounded-full" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm text-white">@{member.username}</p>
                            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${ROLE_COLORS[member.role] || ROLE_COLORS.Member}`}>
                              {member.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">{member.skill}</p>
                        </div>
                      </div>
                      {viewerIsOwner && member.role !== 'Owner' ? (
                        <div className="mt-2 flex gap-1.5 text-[11px]">
                          <button className="rounded-lg border border-slate-700 px-2 py-1 text-slate-400 hover:border-rose-500/50 hover:text-rose-400 transition-colors">
                            Remove
                          </button>
                          {member.role === 'Member' ? (
                            <button className="rounded-lg border border-slate-700 px-2 py-1 text-slate-400 hover:border-amber-500/50 hover:text-amber-400 transition-colors">
                              Make mod
                            </button>
                          ) : (
                            <button className="rounded-lg border border-slate-700 px-2 py-1 text-slate-400 hover:border-slate-500 hover:text-slate-300 transition-colors">
                              Remove mod
                            </button>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}

              {/* EVENTS */}
              {tab === 'EVENTS' ? (
                <div className="space-y-2">
                  {groupEvents.map((event) => (
                    <div key={event.id} className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5">
                      <p className="text-sm font-medium text-white">{event.name}</p>
                      <p className="text-xs text-slate-400">{event.date}</p>
                    </div>
                  ))}
                  <Link
                    to={`/community/${slug}/events`}
                    className="block w-full rounded-xl border border-dashed border-slate-700 py-2 text-center text-xs text-slate-500 hover:border-slate-500 hover:text-slate-300 transition-colors"
                  >
                    View all branch events →
                  </Link>
                </div>
              ) : null}

              {/* SHOWCASE */}
              {tab === 'SHOWCASE' ? (
                <div className="space-y-2">
                  {showcaseItems.length === 0 ? (
                    <p className="text-xs text-slate-500">No showcase posts yet.</p>
                  ) : (
                    showcaseItems.map((item) => (
                      <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5">
                        <p className="text-sm font-medium text-white line-clamp-1">{item.title}</p>
                        <p className="text-xs text-slate-400">@{item.author.username}</p>
                      </div>
                    ))
                  )}
                  <Link
                    to={`/community/${slug}/showcase`}
                    className="block w-full rounded-xl border border-dashed border-slate-700 py-2 text-center text-xs text-slate-500 hover:border-slate-500 hover:text-slate-300 transition-colors"
                  >
                    View full showcase →
                  </Link>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
