import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiCheckCircle, FiClock, FiFilter, FiHeart, FiMessageCircle, FiPlayCircle, FiPlus, FiShare2, FiStar, FiX } from 'react-icons/fi';
import { useToast } from '@/shared/components/Toast';
import { MOCK_SHOWCASE_POSTS_BY_BRANCH } from '@/shared/data/communityData';
import { useShowcaseFeed } from '@/services/mutators/useCommunity';
import core from '@/services/api/core';
const PAGE_SIZE = 12;
const SORT_OPTIONS = ['Trending', 'Newest', 'Top Rated', 'Most Discussed'];
const MEDIA_OPTIONS = ['All', 'Images', 'Video', 'Audio'];
const TIME_OPTIONS = ['Today', 'This week', 'This month', 'All time'];

const BRANCH_SKILLS = {
  dev: ['Gameplay Systems', 'UE5', 'Netcode', 'Optimization', 'Rendering', 'Tooling'],
  esports: ['Strategy', 'VOD Review', 'Team Comms', 'Shotcalling', 'Aim'],
  content: ['Editing', 'Thumbnail Design', 'Branding', 'Audio Post', 'Publishing'],
  business: ['Pitching', 'Fundraising', 'Publishing', 'Contracts', 'Hiring'],
  art: ['Concept Art', 'Character Design', '3D Sculpting', 'Lighting', 'Critique'],
  writing: ['Worldbuilding', 'Narrative Design', 'Dialogue', 'Quest Writing', 'Storyboarding'],
  audio: ['Composition', 'Adaptive Music', 'Foley', 'Mixing', 'Voice Acting'],
  general: ['Community', 'Highlights', 'Onboarding', 'Moderation'],
  newcomers: ['Onboarding', 'First Steps', 'Profile Setup', 'Q&A'],
};

const toEpoch = (dateString) => new Date(dateString).getTime();
const inRange = (postDate, selected) => {
  if (selected === 'All time') return true;
  const now = Date.now();
  const diff = now - toEpoch(postDate);
  if (selected === 'Today') return diff <= 24 * 60 * 60 * 1000;
  if (selected === 'This week') return diff <= 7 * 24 * 60 * 60 * 1000;
  return diff <= 30 * 24 * 60 * 60 * 1000;
};

const getMediaLabel = (type) => {
  if (type === 'images') return 'Images';
  if (type === 'video') return 'Video';
  if (type === 'audio') return 'Audio';
  return 'Text';
};

function VideoCard({ post }) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 group cursor-pointer shadow-lg">
      <img src={post.media[0]} alt={post.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all">
        <div className="bg-white/80 backdrop-blur-md rounded-full p-4 border border-white/30 transform group-hover:scale-110 transition-transform">
          <FiPlayCircle className="h-8 w-8 text-white" />
        </div>
      </div>
      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        <span className="rounded-lg bg-black/60 backdrop-blur-md px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-200 border border-white/10">
          {post.videoUrl?.includes('vimeo') ? 'Vimeo' : 'YouTube'}
        </span>
      </div>
    </div>
  );
}

function AudioCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <button className="rounded-full bg-indigo-100 p-2 text-indigo-600">
          <FiPlayCircle />
        </button>
        <svg viewBox="0 0 240 40" className="h-10 w-full">
          {Array.from({ length: 36 }).map((_, index) => (
            <rect
              key={`wave-${index}`}
              x={index * 6}
              y={10 + ((index * 7) % 14)}
              width="3"
              height={20 - ((index * 5) % 14)}
              rx="1.5"
              fill="#64748b"
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

export default function ShowcaseFeed() {
  const { slug = 'general' } = useParams();
  const { showToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [sortBy, setSortBy] = useState('Trending');
  const [mediaFilter, setMediaFilter] = useState('All');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [timeRange, setTimeRange] = useState('All time');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [expanded, setExpanded] = useState(new Set());
  const [savedPosts, setSavedPosts] = useState(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0 });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [createForm, setCreateForm] = useState({
    mediaType: 'images',
    title: '',
    description: '',
    videoUrl: '',
    audioFile: '',
    imageUrls: [],
    skillTags: [],
  });

  const { data: apiShowcasePosts } = useShowcaseFeed(slug);
  useEffect(() => {
    const live = apiShowcasePosts?.data || apiShowcasePosts || [];
    const fallback = MOCK_SHOWCASE_POSTS_BY_BRANCH[slug] || MOCK_SHOWCASE_POSTS_BY_BRANCH.general || [];
    setPosts(live.length > 0 ? live : fallback);
  }, [apiShowcasePosts, slug]);

  const [likedPosts, setLikedPosts] = useState(new Set());
  const handleLike = async (postId) => {
    const isLiked = likedPosts.has(postId);
    setLikedPosts(prev => {
      const s = new Set(prev);
      isLiked ? s.delete(postId) : s.add(postId);
      return s;
    });
    try {
      if (!isLiked) await core.post(`/community/showcase/${postId}/like`);
      else await core.delete(`/community/showcase/${postId}/like`);
    } catch {
      setLikedPosts(prev => {
        const s = new Set(prev);
        isLiked ? s.add(postId) : s.delete(postId);
        return s;
      });
    }
  };

  const handleSave = async (postId) => {
    const isSaved = savedPosts.has(postId);
    setSavedPosts(prev => {
      const s = new Set(prev);
      isSaved ? s.delete(postId) : s.add(postId);
      return s;
    });
    try {
      if (!isSaved) await core.post(`/community/showcase/${postId}/save`);
      else await core.delete(`/community/showcase/${postId}/save`);
    } catch {
      setSavedPosts(prev => {
        const s = new Set(prev);
        isSaved ? s.add(postId) : s.delete(postId);
        return s;
      });
    }
  };

  const handleCreateShowcasePost = async () => {
    try {
      setIsUploading(true);
      const res = await core.post('/community/showcase', {
        branch_slug: slug,
        title: createForm.title,
        description: createForm.description,
        media_type: createForm.mediaType,
        media_urls: createForm.imageUrls,
        video_url: createForm.videoUrl,
        audio_url: createForm.audioFile,
        skill_tags: createForm.skillTags,
      });
      const newPost = res.data?.data || res.data;
      if (newPost) setPosts(prev => [newPost, ...prev]);
      setIsModalOpen(false);
      setCreateForm({ mediaType: 'images', title: '', description: '', videoUrl: '', audioFile: '', imageUrls: [], skillTags: [] });
      showToast('Posted to showcase!', 'success');
    } catch {
      showToast('Failed to post. Try again.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const skillOptions = BRANCH_SKILLS[slug] || BRANCH_SKILLS.general;

  const filteredPosts = useMemo(() => {
    const candidate = posts
      .filter((post) => (mediaFilter === 'All' ? true : getMediaLabel(post.mediaType) === mediaFilter))
      .filter((post) => (verifiedOnly ? post.author.verified : true))
      .filter((post) => inRange(post.createdAt, timeRange))
      .filter((post) => (selectedSkills.length ? selectedSkills.every((tag) => post.skillTags.includes(tag)) : true));

    const sorted = [...candidate];
    if (sortBy === 'Latest') {
      sorted.sort((a, b) => toEpoch(b.createdAt) - toEpoch(a.createdAt));
    } else if (sortBy === 'Most saved') {
      sorted.sort((a, b) => b.saves - a.saves);
    } else {
      sorted.sort((a, b) => b.likes * 1.2 + b.comments * 1.8 + b.saves * 2 - (a.likes * 1.2 + a.comments * 1.8 + a.saves * 2));
    }
    return sorted;
  }, [posts, mediaFilter, verifiedOnly, timeRange, selectedSkills, sortBy]);

  const visiblePosts = filteredPosts.slice(0, visibleCount);

  const toggleSkill = (skill) => {
    setSelectedSkills((current) => (current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill]));
  };

  const toggleExpand = (id) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };


  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-white">Showcase Feed</h1>
            <button onClick={() => setIsModalOpen(true)} className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white">
              Share your work +
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <FiFilter className="text-slate-400" />
            {SORT_OPTIONS.map((opt) => (
              <button key={opt} onClick={() => setSortBy(opt)} className={`rounded-full px-3 py-1 ${sortBy === opt ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'}`}>
                {opt}
              </button>
            ))}
            {MEDIA_OPTIONS.map((opt) => (
              <button key={opt} onClick={() => setMediaFilter(opt)} className={`rounded-full px-3 py-1 ${mediaFilter === opt ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'}`}>
                {opt}
              </button>
            ))}
            {TIME_OPTIONS.map((opt) => (
              <button key={opt} onClick={() => setTimeRange(opt)} className={`rounded-full px-3 py-1 ${timeRange === opt ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'}`}>
                <FiClock className="mr-1 inline" />
                {opt}
              </button>
            ))}
            <button onClick={() => setVerifiedOnly((current) => !current)} className={`rounded-full px-3 py-1 ${verifiedOnly ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300'}`}>
              Verified creators only
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {skillOptions.map((skill) => (
              <button key={skill} onClick={() => toggleSkill(skill)} className={`rounded-full border px-3 py-1 text-xs ${selectedSkills.includes(skill) ? 'border-indigo-400 bg-indigo-500/20 text-indigo-200' : 'border-slate-700 text-slate-400'}`}>
                {skill}
              </button>
            ))}
          </div>
        </section>

        <section className="columns-1 gap-5 space-y-5 md:columns-2">
          {visiblePosts.map((post) => {
            const showLong = post.description.length > 200;
            const isExpanded = expanded.has(post.id);
            const body = showLong && !isExpanded ? `${post.description.slice(0, 200)}...` : post.description;
            return (
              <article
                key={post.id}
                className="mb-5 break-inside-avoid rounded-2xl bg-slate-900 p-4"
                style={{ border: (post.featured || post.is_featured) ? '2px solid #F59E0B' : '1px solid rgb(30 41 59)' }}
              >
                <div className="relative">
                  {post.featured ? (
                    <span className="absolute right-2 top-2 z-10 rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-slate-900">
                      <FiStar className="mr-1 inline" />
                      Community Pick
                    </span>
                  ) : null}

                  {post.mediaType === 'images' ? (
                    <div className="relative group overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                      <img 
                        src={post.media[0]} 
                        alt={post.title} 
                        className="w-full object-cover min-h-[300px] max-h-[600px] transition-transform duration-1000 group-hover:scale-105" 
                      />
                      {post.media.length > 1 && (
                        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black text-white border border-white/10">
                          +{post.media.length - 1} MORE
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                         <button 
                           onClick={() => setLightbox({ open: true, images: post.media, index: 0 })}
                           className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all"
                         >
                            Expand Gallery
                         </button>
                      </div>
                    </div>
                  ) : null}
                  {post.mediaType === 'video' ? <VideoCard post={post} /> : null}
                  {post.mediaType === 'audio' ? <AudioCard /> : null}
                </div>

                <h2 className="mt-3 text-lg font-bold text-white">{post.title.slice(0, 80)}</h2>
                <p className="mt-2 text-sm text-slate-300">{body}</p>
                {showLong ? (
                  <button onClick={() => toggleExpand(post.id)} className="mt-1 text-xs text-indigo-300 underline">
                    {isExpanded ? 'Read less' : 'Read more'}
                  </button>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  {post.skillTags.map((skill) => (
                    <Link key={`${post.id}-${skill}`} to={`/profile/${post.author.username}?skill=${encodeURIComponent(skill)}`} className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                      {skill}
                    </Link>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <img src={post.author.avatar} alt={post.author.username} className="h-10 w-10 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">@{post.author.username}</p>
                    <p className="text-xs text-slate-400">
                      {post.author.domain}
                      {post.author.verified ? <FiCheckCircle className="ml-1 inline text-emerald-400" /> : null}
                    </p>
                    <p className="truncate text-xs text-slate-500">{post.author.topSkills.slice(0, 2).join(' · ')}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                    <button
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-1.5 transition-colors"
                      style={{ color: likedPosts.has(post.id) ? '#F43F5E' : undefined }}
                    >
                      <FiHeart size={16} /> {post.likes + (likedPosts.has(post.id) ? 1 : 0)}
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors">
                      <FiMessageCircle size={16} /> {post.comments}
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-white transition-colors">
                      <FiShare2 size={16} />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => {
                      if (post.isOwn) { showToast('Project synced to public showcase.', 'success'); return; }
                      handleSave(post.id);
                    }}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      post.isOwn
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20'
                        : savedPosts.has(post.id)
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {post.isOwn ? 'Sync to Portfolio' : savedPosts.has(post.id) ? 'Saved ✓' : 'Save Portfolio'}
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        {visibleCount < filteredPosts.length ? (
          <div className="flex justify-center">
            <button onClick={() => setVisibleCount((value) => value + PAGE_SIZE)} className="rounded-full border border-slate-700 bg-slate-900 px-5 py-2 text-sm text-slate-200">
              Load more
            </button>
          </div>
        ) : null}
      </div>

      {lightbox.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <button onClick={() => setLightbox({ open: false, images: [], index: 0 })} className="absolute right-4 top-4 rounded-full bg-slate-900 p-2 text-white">
            <FiX />
          </button>
          <img src={lightbox.images[lightbox.index]} alt="Gallery" className="max-h-[85vh] max-w-[90vw] rounded-xl" />
        </div>
      ) : null}

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Create Showcase Post</h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full bg-slate-800 p-2 text-slate-200">
                <FiX />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateShowcasePost(); }} className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {['images', 'video', 'audio', 'text'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setCreateForm((current) => ({ ...current, mediaType: type }))}
                    className={`rounded-full px-3 py-1 text-xs ${createForm.mediaType === type ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'}`}
                  >
                    {getMediaLabel(type)}
                  </button>
                ))}
              </div>

              {createForm.mediaType === 'images' ? (
                <input
                  type="text"
                  placeholder="Paste image URLs separated by comma (max 5)"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, imageUrls: event.target.value.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 5) }))
                  }
                />
              ) : null}
              {createForm.mediaType === 'video' ? (
                <input
                  type="url"
                  placeholder="Video link (YouTube/Vimeo)"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  value={createForm.videoUrl}
                  onChange={(event) => setCreateForm((current) => ({ ...current, videoUrl: event.target.value }))}
                />
              ) : null}
              {createForm.mediaType === 'audio' ? (
                <input
                  type="text"
                  placeholder="Audio file name/url (mock)"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  value={createForm.audioFile}
                  onChange={(event) => setCreateForm((current) => ({ ...current, audioFile: event.target.value }))}
                />
              ) : null}

              <input
                required
                maxLength={80}
                placeholder="Title (max 80 chars)"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                value={createForm.title}
                onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value.slice(0, 80) }))}
              />
              <textarea
                required
                maxLength={500}
                rows={4}
                placeholder="Description (max 500 chars)"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                value={createForm.description}
                onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value.slice(0, 500) }))}
              />
              <div className="flex flex-wrap gap-2">
                {skillOptions.map((skill) => (
                  <button
                    key={`create-${skill}`}
                    type="button"
                    onClick={() =>
                      setCreateForm((current) => ({
                        ...current,
                        skillTags: current.skillTags.includes(skill) ? current.skillTags.filter((item) => item !== skill) : [...current.skillTags, skill],
                      }))
                    }
                    className={`rounded-full border px-2.5 py-1 text-xs ${createForm.skillTags.includes(skill) ? 'border-indigo-400 bg-indigo-500/20 text-indigo-200' : 'border-slate-700 text-slate-400'}`}
                  >
                    {skill}
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-400">
                Preview: {createForm.title || 'Untitled'} · {getMediaLabel(createForm.mediaType)} · {createForm.skillTags.join(', ') || 'No skills selected'}
              </div>

              <button 
                type="submit" 
                disabled={isUploading}
                className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest italic transition-all relative overflow-hidden ${
                  isUploading ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-indigo-500 text-white hover:bg-indigo-400 active:scale-95'
                }`}
              >
                {isUploading ? (
                  <>
                    <div className="absolute inset-0 bg-slate-700/30" />
                    <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    <span className="relative z-10">Uploading {uploadProgress}%</span>
                  </>
                ) : 'Publish to Showcase'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}









