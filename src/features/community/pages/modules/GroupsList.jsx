import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiLock, FiSearch, FiUnlock, FiUsers, FiX, FiSliders } from 'react-icons/fi';
import { useQueryClient } from '@tanstack/react-query';
import { useGroups } from '@/services/mutators/useCommunity';
import core from '@/services/api/core';
import { useToast } from '@/shared/components/Toast';

const TOPICS_BY_BRANCH = {
  dev: ['UE5', 'Unity', 'Shaders', 'Tooling', 'Netcode'],
  esports: ['Scrims', 'Coaching', 'VOD', 'Ranked', 'Tournaments'],
  content: ['Streaming', 'Editing', 'Branding', 'Growth', 'Collabs'],
  business: ['Publishing', 'Hiring', 'Fundraising', 'Ops', 'Marketing'],
  art: ['Concept', '3D', 'Animation', 'VFX', 'Critique'],
  writing: ['Worldbuilding', 'Dialogue', 'Quest Design', 'Narrative'],
  audio: ['Composition', 'Mixing', 'Foley', 'Voice'],
  general: ['Community', 'Networking', 'Collaboration'],
  newcomers: ['Introductions', 'First Steps', 'Mentorship'],
};

const BRANCH_GRADIENTS = {
  dev: 'from-indigo-500/30 to-violet-500/20',
  esports: 'from-rose-500/30 to-orange-500/20',
  content: 'from-pink-500/30 to-fuchsia-500/20',
  business: 'from-sky-500/30 to-cyan-500/20',
  art: 'from-amber-500/30 to-yellow-500/20',
  writing: 'from-teal-500/30 to-emerald-500/20',
  audio: 'from-purple-500/30 to-indigo-500/20',
  general: 'from-slate-500/30 to-slate-400/20',
  newcomers: 'from-green-500/30 to-teal-500/20',
};

export default function GroupsList() {
  const { slug = 'general' } = useParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [tab, setTab] = useState('All Groups');
  const [sortBy, setSortBy] = useState('Most active');
  const [visibility, setVisibility] = useState('All');
  const [query, setQuery] = useState('');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [joinedIds, setJoinedIds] = useState(new Set());
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    topics: [],
    visibility: 'public',
    maxMembers: 100,
    cover: '',
  });

  const topics = TOPICS_BY_BRANCH[slug] || TOPICS_BY_BRANCH.general;
  const gradient = BRANCH_GRADIENTS[slug] || BRANCH_GRADIENTS.general;

  const { data: groupsData } = useGroups(slug);
  const apiGroups = useMemo(() => groupsData?.data || groupsData || [], [groupsData]);

  const groups = useMemo(() => {
    const mapped = apiGroups.map((g, i) => ({
      ...g,
      topicTags: g.topic_tags || g.topicTags || topics.slice(i % topics.length, (i % topics.length) + 3),
      owner_username: g.owner_username || g.owner?.username || 'group_owner',
      owner_avatar: g.owner_avatar || g.owner?.avatar_url || `https://i.pravatar.cc/150?u=${g.id}`,
      lastActiveHours: g.last_active_hours || (i + 1) * 3,
      isMember: g.is_member ?? joinedIds.has(g.id),
    }));

    let result = mapped
      .filter((g) => (tab === 'My Groups' ? g.isMember : true))
      .filter((g) => (tab === 'Recommended' ? !g.isMember : true))
      .filter((g) => (visibility === 'All' ? true : g.visibility === visibility.toLowerCase()))
      .filter((g) => g.name.toLowerCase().includes(query.toLowerCase()))
      .filter((g) => (selectedTopics.length ? selectedTopics.some((t) => g.topicTags?.includes(t)) : true));

    if (sortBy === 'Most members') result = [...result].sort((a, b) => b.member_count - a.member_count);
    if (sortBy === 'Newest') result = [...result].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (sortBy === 'Most active') result = [...result].sort((a, b) => a.lastActiveHours - b.lastActiveHours);
    return result;
  }, [apiGroups, topics, tab, visibility, query, selectedTopics, sortBy, joinedIds]);

  function toggleTopic(topic) {
    setSelectedTopics((prev) => (prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]));
  }

  async function handleJoin(groupId) {
    try {
      await core.post(`/community/groups/${groupId}/join`);
      queryClient.invalidateQueries({ queryKey: ['community', 'groups', slug] });
      showToast('Joined group!', 'success');
    } catch {
      showToast('Could not join group.', 'error');
    }
  }

  async function handleCreateGroup(e) {
    e.preventDefault();
    try {
      await core.post(`/community/${slug}/groups`, {
        name: createForm.name,
        description: createForm.description,
        topic_tags: createForm.topics,
        is_private: createForm.visibility === 'private',
        max_members: createForm.maxMembers,
      });
      queryClient.invalidateQueries({ queryKey: ['community', 'groups', slug] });
      showToast('Group created!', 'success');
    } catch {
      showToast('Failed to create group.', 'error');
    }
    setIsCreateOpen(false);
    setCreateForm({ name: '', description: '', topics: [], visibility: 'public', maxMembers: 100, cover: '' });
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold text-white">Groups</h1>
              <p className="mt-1 text-sm text-slate-400">
                Find and join focused collaboration groups in the{' '}
                <span className="capitalize text-indigo-300">{slug}</span> branch.
              </p>
            </div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 transition-colors"
            >
              Create Group
            </button>
          </div>

          {/* Tab row */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {['All Groups', 'My Groups', 'Recommended'].map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`rounded-full px-3 py-1 text-sm transition-colors ${tab === item ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                {item}
              </button>
            ))}
            <span className="mx-1 text-slate-700">|</span>
            {['Most active', 'Newest', 'Most members'].map((item) => (
              <button
                key={item}
                onClick={() => setSortBy(item)}
                className={`rounded-full px-3 py-1 text-sm transition-colors ${sortBy === item ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                {item}
              </button>
            ))}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-colors ${showFilters ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              <FiSliders size={13} />
              Filters
            </button>
          </div>

          {/* Expanded filter panel */}
          {showFilters ? (
            <div className="mt-4 space-y-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              {/* Search */}
              <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2">
                <FiSearch className="text-slate-500" size={14} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search group name..."
                  className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
                />
                {query ? (
                  <button onClick={() => setQuery('')}>
                    <FiX size={14} className="text-slate-500" />
                  </button>
                ) : null}
              </div>

              {/* Visibility */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Visibility:</span>
                {['All', 'Public', 'Private'].map((item) => (
                  <button
                    key={item}
                    onClick={() => setVisibility(item)}
                    className={`rounded-full px-3 py-1 text-xs transition-colors ${visibility === item ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {/* Topic chips */}
              <div className="flex flex-wrap gap-2">
                {topics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => toggleTopic(topic)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${selectedTopics.includes(topic) ? 'border-indigo-400 bg-indigo-500/20 text-indigo-200' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
                  >
                    {topic}
                  </button>
                ))}
              </div>

              {(selectedTopics.length > 0 || query) ? (
                <button
                  onClick={() => { setSelectedTopics([]); setQuery(''); }}
                  className="text-xs text-slate-500 underline hover:text-slate-300"
                >
                  Clear all filters
                </button>
              ) : null}
            </div>
          ) : null}
        </section>

        {/* Group cards grid */}
        {groups.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 py-16 text-center">
            <p className="text-slate-400">No groups found for these filters.</p>
          </div>
        ) : (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => {
              const capacityPct = Math.min(100, Math.round((group.member_count / group.max_members) * 100));
              const isJoined = group.isMember;
              const isFull = group.member_count >= group.max_members;

              return (
                <article key={group.id} className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 transition-all hover:border-slate-700">
                  {/* Cover */}
                  <div className={`h-28 bg-gradient-to-r ${gradient}`} />

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-lg font-bold text-white leading-tight">{group.name}</h2>
                      <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${group.visibility === 'public' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
                        {group.visibility === 'public' ? <FiUnlock size={10} /> : <FiLock size={10} />}
                        {group.visibility === 'public' ? 'Public' : 'Private'}
                      </span>
                    </div>

                    <p className="mt-1.5 text-xs leading-5 text-slate-400 line-clamp-2">{group.description}</p>

                    {/* Topic tags */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {group.topicTags.slice(0, 3).map((tag) => (
                        <span key={`${group.id}-${tag}`} className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Capacity */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span className="inline-flex items-center gap-1"><FiUsers size={11} /> {group.member_count}/{group.max_members} members</span>
                        <span>{capacityPct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800">
                        <div
                          className={`h-1.5 rounded-full transition-all ${capacityPct >= 90 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                          style={{ width: `${capacityPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Owner */}
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                      <img src={group.owner_avatar} alt={group.owner_username} className="h-5 w-5 rounded-full object-cover" />
                      <span>@{group.owner_username}</span>
                      <span className="ml-auto text-slate-600">
                        {group.lastActiveHours <= 3 ? 'Active today' : `${group.lastActiveHours}h ago`}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center justify-between">
                      <Link to={`/community/${slug}/groups/${group.id}`} className="text-sm font-medium text-indigo-300 hover:text-indigo-200">
                        View →
                      </Link>
                      {isJoined ? (
                        <Link
                          to={`/community/${slug}/groups/${group.id}`}
                          className="rounded-xl bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-400"
                        >
                          Open Group
                        </Link>
                      ) : isFull ? (
                        <span className="rounded-xl bg-slate-700 px-3 py-1.5 text-sm text-slate-400 cursor-not-allowed">Full</span>
                      ) : (
                        <button
                          onClick={() => handleJoin(group.id)}
                          className={`rounded-xl px-3 py-1.5 text-sm font-semibold text-white transition-colors ${group.visibility === 'public' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-600 hover:bg-amber-500'}`}
                        >
                          {group.visibility === 'public' ? 'Join' : 'Request to Join'}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>

      {/* Create Group Modal */}
      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form
            onSubmit={handleCreateGroup}
            className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Create Group</h3>
              <button type="button" onClick={() => setIsCreateOpen(false)}>
                <FiX className="text-slate-400 hover:text-white" size={18} />
              </button>
            </div>

            <label className="block text-xs text-slate-400 mb-1">Name <span className="text-slate-600">({createForm.name.length}/50)</span></label>
            <input
              maxLength={50}
              required
              value={createForm.name}
              onChange={(e) => setCreateForm((c) => ({ ...c, name: e.target.value }))}
              placeholder="Give your group a name"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500"
            />

            <label className="mt-3 block text-xs text-slate-400 mb-1">Description <span className="text-slate-600">({createForm.description.length}/200)</span></label>
            <textarea
              maxLength={200}
              required
              rows={3}
              value={createForm.description}
              onChange={(e) => setCreateForm((c) => ({ ...c, description: e.target.value }))}
              placeholder="What is this group about?"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500 resize-none"
            />

            <label className="mt-3 block text-xs text-slate-400 mb-1">Topics <span className="text-slate-600">(up to 5)</span></label>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <button
                  key={`create-${topic}`}
                  type="button"
                  onClick={() =>
                    setCreateForm((c) => ({
                      ...c,
                      topics: c.topics.includes(topic)
                        ? c.topics.filter((t) => t !== topic)
                        : [...c.topics, topic].slice(0, 5),
                    }))
                  }
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${createForm.topics.includes(topic) ? 'border-indigo-400 bg-indigo-500/20 text-indigo-200' : 'border-slate-700 text-slate-400'}`}
                >
                  {topic}
                </button>
              ))}
            </div>

            <label className="mt-3 block text-xs text-slate-400 mb-1">Visibility</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCreateForm((c) => ({ ...c, visibility: 'public' }))}
                className={`flex-1 rounded-xl py-2 text-sm font-medium transition-colors ${createForm.visibility === 'public' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'}`}
              >
                <FiUnlock className="inline mr-1.5" size={13} />Public
              </button>
              <button
                type="button"
                onClick={() => setCreateForm((c) => ({ ...c, visibility: 'private' }))}
                className={`flex-1 rounded-xl py-2 text-sm font-medium transition-colors ${createForm.visibility === 'private' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'}`}
              >
                <FiLock className="inline mr-1.5" size={13} />Private
              </button>
            </div>

            <label className="mt-3 block text-xs text-slate-400 mb-1">Max members: <span className="text-white">{createForm.maxMembers}</span></label>
            <input
              type="range"
              min={10}
              max={500}
              step={10}
              value={createForm.maxMembers}
              onChange={(e) => setCreateForm((c) => ({ ...c, maxMembers: Number(e.target.value) }))}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>10</span><span>500</span>
            </div>

            <label className="mt-3 block text-xs text-slate-400 mb-1">Cover image URL <span className="text-slate-600">(optional)</span></label>
            <input
              type="url"
              value={createForm.cover}
              onChange={(e) => setCreateForm((c) => ({ ...c, cover: e.target.value }))}
              placeholder="https://..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500"
            />

            <p className="mt-3 text-xs text-amber-300">Groups require mod approval before becoming discoverable.</p>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                Cancel
              </button>
              <button
                type="submit"
                disabled={!createForm.name || !createForm.description}
                className="rounded-xl bg-indigo-500 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
