import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiArrowLeft, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useToast } from '@/shared/components/Toast';
import { mockApiService } from '@services/mockApiService';
import { AdminPageHero, AdminPanel, AdminMetrics, AdminEmptyState } from './AdminContentShell';
import AIFeaturePlaceholder from '@/shared/components/AIFeaturePlaceholder';
import { ensureArray, normalizeStatus, safeString, slugify, toIsoDate } from './adminFormUtils';

const PLATFORM_OPTIONS = ['PC', 'PlayStation', 'Xbox', 'Mobile', 'Cross-platform'];
const GENRE_OPTIONS = [
  'Action', 'Arcade', 'Shooter', 'FPS', 'Battle Royale', 'RPG', 'MMORPG',
  'Strategy', 'Simulation', 'Racing', 'Sports', 'Fighting', 'Platformer',
  'Puzzle', 'Horror', 'Adventure', 'Open World', 'Sandbox', 'Mobile', 'VR/AR',
  'Indie', 'Educational',
];
const STATUS_OPTIONS = ['Draft', 'Published', 'Archived'];
const SCORE_DESCRIPTORS = ['Outstanding', 'Excellent', 'Great', 'Good', 'Mixed', 'Poor'];
const BRANCH_OPTIONS = ['Esports', 'Dev', 'General', 'Writing', 'Art', 'Content'];
const SOCIAL_PLATFORMS = ['Discord', 'Twitter', 'Instagram', 'TikTok', 'YouTube', 'Twitch', 'Other'];

const STEPS = [
  { id: 'basic',        label: 'Basic Information',  subtitle: 'Hero, platforms, genres, slug, and publish state' },
  { id: 'story',        label: 'Story & Content',    subtitle: 'Overview, gameplay description, and key mechanics' },
  { id: 'media',        label: 'Media',              subtitle: 'Hero art, cover art, gallery media, and video' },
  { id: 'overview',     label: 'Quick Overview',     subtitle: 'Controls, DLC toggle, and game modes' },
  { id: 'requirements', label: 'System Requirements', subtitle: 'Minimum and recommended specifications' },
  { id: 'store',        label: 'Store & Extras',     subtitle: 'Store links, DLC, awards, and achievements' },
  { id: 'reviews',      label: 'Reviews & Community', subtitle: 'Expert reviews, GZS score, and community settings' },
  { id: 'related',      label: 'More Games',         subtitle: 'Related titles' },
  { id: 'social',       label: 'Social & Community', subtitle: 'Theme color, socials, community publishing, SEO meta' },
];

const emptyMechanic = () => ({ label: '', description: '' });
const emptyAsset = () => ({ url: '', alt: '' });
const emptyControlCard = () => ({ icon: '', label: '', description: '' });
const emptyMode = () => ({ icon: '', name: '', description: '' });
const emptyRequirement = (component = '') => ({ component, minimum: '', recommended: '' });
const emptyStoreLink = () => ({ platform: '', url: '', price: '' });
const emptyDlc = () => ({ title: '', type: 'DLC', releaseDate: '', description: '', price: '', url: '' });
const emptyAward = () => ({ award: '', organisation: '', year: '' });
const emptyAchievement = () => ({ name: '', description: '', completionRate: '' });
const emptyReview = () => ({ reviewer: '', outlet: '', score: '', quote: '', url: '' });
const emptySocial = () => ({ platform: '', url: '' });

const defaultForm = {
  title: '',
  tagline: '',
  heroBackgroundImage: '',
  heroForegroundImage: '',
  franchise: '',
  platforms: [],
  genres: [],
  gameModesOverview: '',
  slug: '',
  status: 'Draft',
  storyline: '',
  gameplayDescription: '',
  keyGameplayMechanics: [emptyMechanic(), emptyMechanic(), emptyMechanic()],
  storyCommunityLabel: '',
  moreGamesText: '',
  carouselImages: [emptyAsset(), emptyAsset(), emptyAsset()],
  youtubeVideoUrl: '',
  coverImage: '',
  coverHeroImage: '',
  screenshotGallery: [],
  mediaAltText: '',
  occDescription: '',
  controlCards: [emptyControlCard(), emptyControlCard()],
  hasDlc: false,
  gameModes: [emptyMode()],
  showSystemRequirements: true,
  systemRequirements: [
    emptyRequirement('Operating System'),
    emptyRequirement('Processor'),
    emptyRequirement('Memory'),
    emptyRequirement('Graphics'),
    emptyRequirement('Storage'),
    emptyRequirement('DirectX'),
  ],
  getGameLinks: [emptyStoreLink()],
  storeLabel: '',
  dlcEntries: [],
  awards: [],
  achievements: [],
  expertReviews: [],
  gzsScoreOverride: '',
  scoreDescriptor: 'Good',
  communityHubEnabled: true,
  userRatingEnabled: true,
  communityBranchLink: 'Esports',
  relatedGames: [],
  overrideAiSuggestions: false,
  gameThemeColor: '#ff4655',
  socialLinks: [emptySocial()],
  joinCommunityHeading: '',
  instagramUrl: '',
  youtubeUrl: '',
  publishToCommunity: true,
  communityBranchSlug: '',
  showTournamentWidget: true,
  metaTitle: '',
  metaDescription: '',
  ogImage: '',
  canonicalUrl: '',
  publishImmediately: true,
  scheduledPublishDate: '',
};

function hydrateGame(game) {
  if (!game) return defaultForm;
  return {
    ...defaultForm,
    ...game,
    title: safeString(game.title),
    tagline: safeString(game.tagline || game.short_description || game.description),
    heroBackgroundImage: safeString(game.heroBackgroundImage || game.banner_url),
    heroForegroundImage: safeString(game.heroForegroundImage),
    franchise: safeString(game.franchise),
    platforms: ensureArray(game.platforms),
    genres: ensureArray(game.genres?.length ? game.genres : game.genre ? [game.genre] : []),
    gameModesOverview: safeString(game.gameModesOverview || ensureArray(game.tags).join(', ')),
    slug: safeString(game.slug),
    status: normalizeStatus(game.status),
    storyline: safeString(game.storyline),
    gameplayDescription: safeString(game.gameplayDescription),
    keyGameplayMechanics: ensureArray(game.keyGameplayMechanics).length ? ensureArray(game.keyGameplayMechanics) : defaultForm.keyGameplayMechanics,
    storyCommunityLabel: safeString(game.storyCommunityLabel),
    moreGamesText: safeString(game.moreGamesText),
    carouselImages: ensureArray(game.carouselImages).length ? ensureArray(game.carouselImages) : defaultForm.carouselImages,
    youtubeVideoUrl: safeString(game.youtubeVideoUrl),
    coverImage: safeString(game.coverImage || game.logo_url),
    coverHeroImage: safeString(game.coverHeroImage),
    screenshotGallery: ensureArray(game.screenshotGallery),
    mediaAltText: safeString(game.mediaAltText),
    occDescription: safeString(game.occDescription),
    controlCards: ensureArray(game.controlCards).length ? ensureArray(game.controlCards) : defaultForm.controlCards,
    hasDlc: Boolean(game.hasDlc || ensureArray(game.dlcEntries).length),
    gameModes: ensureArray(game.gameModes).length ? ensureArray(game.gameModes) : defaultForm.gameModes,
    showSystemRequirements: game.showSystemRequirements !== false,
    systemRequirements: ensureArray(game.systemRequirements).length ? ensureArray(game.systemRequirements) : defaultForm.systemRequirements,
    getGameLinks: ensureArray(game.getGameLinks).length ? ensureArray(game.getGameLinks) : defaultForm.getGameLinks,
    storeLabel: safeString(game.storeLabel),
    dlcEntries: ensureArray(game.dlcEntries),
    awards: ensureArray(game.awards),
    achievements: ensureArray(game.achievements),
    expertReviews: ensureArray(game.expertReviews),
    gzsScoreOverride: safeString(game.gzsScoreOverride),
    scoreDescriptor: safeString(game.scoreDescriptor || defaultForm.scoreDescriptor),
    communityHubEnabled: game.communityHubEnabled !== false,
    userRatingEnabled: game.userRatingEnabled !== false,
    communityBranchLink: safeString(game.communityBranchLink || defaultForm.communityBranchLink),
    relatedGames: ensureArray(game.relatedGames),
    overrideAiSuggestions: Boolean(game.overrideAiSuggestions),
    gameThemeColor: safeString(game.gameThemeColor || defaultForm.gameThemeColor),
    socialLinks: ensureArray(game.socialLinks).length ? ensureArray(game.socialLinks) : defaultForm.socialLinks,
    joinCommunityHeading: safeString(game.joinCommunityHeading || (game.title ? `Join the ${game.title} Community` : '')),
    instagramUrl: safeString(game.instagramUrl),
    youtubeUrl: safeString(game.youtubeUrl),
    publishToCommunity: game.publishToCommunity !== false,
    communityBranchSlug: safeString(game.communityBranchSlug || game.community_branch_slug || ''),
    showTournamentWidget: game.showTournamentWidget !== false,
    metaTitle: safeString(game.metaTitle || game.meta_title || ''),
    metaDescription: safeString(game.metaDescription || game.meta_description || ''),
    ogImage: safeString(game.ogImage || game.og_image || ''),
    canonicalUrl: safeString(game.canonicalUrl || game.canonical_url || ''),
    publishImmediately: game.publishImmediately !== false,
    scheduledPublishDate: safeString(game.scheduledPublishDate || ''),
  };
}

function countWords(text) {
  return safeString(text).trim().split(/\s+/).filter(Boolean).length;
}

function getStepStatus(stepId, form) {
  switch (stepId) {
    case 'basic':
      return form.title && form.heroBackgroundImage && form.platforms.length && form.genres.length ? 'complete' : (form.title || form.platforms.length ? 'progress' : 'empty');
    case 'story':
      return countWords(form.storyline) >= 200 && form.gameplayDescription ? 'complete' : (form.storyline || form.gameplayDescription ? 'progress' : 'empty');
    case 'media':
      return form.coverImage && form.carouselImages.filter((item) => item.url).length >= 3 ? 'complete' : (form.coverImage || form.heroBackgroundImage ? 'progress' : 'empty');
    case 'overview':
      return form.occDescription && form.gameModes.filter((item) => item.name).length >= 1 ? 'complete' : (form.occDescription || form.gameModes.some((item) => item.name) ? 'progress' : 'empty');
    case 'requirements':
      return form.showSystemRequirements && form.systemRequirements.some((row) => row.minimum || row.recommended) ? 'progress' : 'empty';
    case 'store':
      return form.getGameLinks.some((item) => item.url) || form.dlcEntries.length || form.awards.length ? 'progress' : 'empty';
    case 'reviews':
      return form.expertReviews.length || form.communityHubEnabled ? 'progress' : 'empty';
    case 'related':
      return form.relatedGames.length ? 'progress' : 'empty';
    case 'social':
      return form.socialLinks.some((item) => item.platform && item.url) || form.metaDescription ? 'progress' : 'empty';
    default:
      return 'empty';
  }
}

function getAverageScore(reviews) {
  const values = reviews
    .map((review) => Number.parseFloat(review.score))
    .filter((value) => Number.isFinite(value));
  if (!values.length) return '';
  return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
}

function Input({ label, hint, value, onChange, type = 'text', placeholder, maxLength }) {
  return (
    <label>
      <span>{label}</span>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength} />
      {hint ? <small className="admin-field-hint">{hint}</small> : null}
    </label>
  );
}

function Area({ label, hint, value, onChange, rows = 4, placeholder, maxLength }) {
  return (
    <label>
      <span>{label}</span>
      <textarea value={value} onChange={onChange} rows={rows} placeholder={placeholder} maxLength={maxLength} />
      {hint ? <small className="admin-field-hint">{hint}</small> : null}
    </label>
  );
}

function Select({ label, hint, value, onChange, options }) {
  return (
    <label>
      <span>{label}</span>
      <select value={value} onChange={onChange}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      {hint ? <small className="admin-field-hint">{hint}</small> : null}
    </label>
  );
}

export default function GamePostWizard({ mode = 'create' }) {
  const navigate = useNavigate();
  const params = useParams();
  const { showToast } = useToast();
  const [form, setForm] = useState(defaultForm);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [libraryGames, setLibraryGames] = useState([]);
  const [gameSearchQuery, setGameSearchQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      const games = await mockApiService.getAllGames();
      if (!mounted) return;
      setLibraryGames(games);
      if (mode === 'edit') {
        const current = games.find((item) => String(item.id) === String(params.id));
        if (!current) {
          showToast('Game post not found.', 'error');
          navigate('/admin/games');
          return;
        }
        setForm(hydrateGame(current));
      }
      setLoading(false);
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [mode, navigate, params.id, showToast]);

  useEffect(() => {
    if (STEPS[activeStep]?.id !== 'social') return;
    setForm(prev => ({
      ...prev,
      metaDescription: prev.metaDescription || prev.tagline,
      ogImage: prev.ogImage || prev.heroBackgroundImage,
      canonicalUrl: prev.canonicalUrl || (prev.slug ? `/games/${prev.slug}` : ''),
    }));
  }, [activeStep]);

  const filteredLibraryGames = useMemo(() => {
    const q = gameSearchQuery.toLowerCase();
    return libraryGames
      .filter(g => String(g.id) !== String(params.id))
      .filter(g => !gameSearchQuery || g.title.toLowerCase().includes(q));
  }, [libraryGames, gameSearchQuery, params.id]);

  const selectedRelatedGames = useMemo(() =>
    form.relatedGames
      .map(slug => libraryGames.find(g => (g.slug || g.title) === slug))
      .filter(Boolean),
    [form.relatedGames, libraryGames],
  );

  const score = useMemo(
    () => form.gzsScoreOverride || getAverageScore(form.expertReviews),
    [form.expertReviews, form.gzsScoreOverride],
  );

  const stepStatuses = useMemo(
    () => STEPS.map((step) => getStepStatus(step.id, form)),
    [form],
  );

  const publishReady = stepStatuses.slice(0, 4).every((status) => status === 'complete');

  const metrics = [
    { label: 'Current Step', value: `${activeStep + 1} / ${STEPS.length}` },
    { label: 'Completed Steps', value: `${stepStatuses.filter((status) => status === 'complete').length}` },
    { label: 'GZS Score', value: score || 'Pending' },
    { label: 'Related Games', value: `${form.relatedGames.length}` },
  ];

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateTitle(value) {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: slugify(value),
      joinCommunityHeading: prev.joinCommunityHeading || (value ? `Join the ${value} Community` : ''),
    }));
  }

  function toggleArrayValue(key, value) {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((item) => item !== value)
        : [...prev[key], value],
    }));
  }

  function updateListItem(key, index, patch) {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
    }));
  }

  function addListItem(key, factory) {
    setForm((prev) => ({ ...prev, [key]: [...prev[key], factory()] }));
  }

  function removeListItem(key, index) {
    setForm((prev) => ({ ...prev, [key]: prev[key].filter((_, itemIndex) => itemIndex !== index) }));
  }

  async function saveGame(nextStatus) {
    if (!form.title.trim()) {
      showToast('Game title is required.', 'error');
      return;
    }
    if (nextStatus === 'Published' && !publishReady) {
      showToast('Steps 1 to 4 must be complete before publishing.', 'error');
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      title: form.title.trim(),
      slug: form.slug || slugify(form.title),
      status: nextStatus,
      short_description: form.tagline,
      banner_url: form.heroBackgroundImage,
      logo_url: form.coverImage,
      date: toIsoDate(new Date()),
      description: form.tagline,
      genre: form.genres[0] || '',
      gameModesOverview: form.gameModesOverview,
      gzsScore: score,
      community: {
        hubEnabled: form.communityHubEnabled,
        branchSlug: form.communityBranchSlug,
        showTournamentWidget: form.showTournamentWidget,
        socialLinks: form.socialLinks,
      },
      seo: {
        metaTitle: form.metaTitle || form.title,
        metaDescription: form.metaDescription || form.tagline,
        ogImage: form.ogImage || form.heroBackgroundImage,
        canonicalUrl: form.canonicalUrl || (form.slug ? `/games/${form.slug}` : ''),
      },
      scheduledPublishAt: form.publishImmediately ? null : form.scheduledPublishDate,
    };

    try {
      if (mode === 'edit') {
        await mockApiService.updateGame(Number(params.id) || params.id, payload);
        showToast(nextStatus === 'Published' ? 'Game post updated and published.' : 'Game post saved.', 'success');
      } else {
        await mockApiService.addGame(payload);
        showToast(nextStatus === 'Published' ? 'Game post created and published.' : 'Game draft saved.', 'success');
      }
      navigate('/admin/games');
    } catch {
      showToast('Unable to save the game post right now.', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="admin-empty-state">Loading game post editor...</div>;
  }

  const currentStep = STEPS[activeStep];

  return (
    <div className="admin-page-shell">
      <Helmet>
        <title>{mode === 'edit' ? `Edit ${form.title}` : 'Create Game Post'} | GzoneSphere Admin</title>
      </Helmet>

      <AdminPageHero
        kicker="Admin / Games"
        title={mode === 'edit' ? 'Edit GamePost' : 'Create GamePost'}
        description="Structured nine-step wizard for the public GamePost page. Steps 1 to 4 are required before publishing; the rest enrich the page and community integrations."
        actions={(
          <>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => navigate('/admin/games')}>
              <FiArrowLeft />
              Back to games
            </button>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => saveGame('Draft')} disabled={saving}>
              Save draft
            </button>
            <button type="button" className="admin-btn" onClick={() => saveGame('Published')} disabled={saving}>
              {mode === 'edit' ? 'Update & publish' : 'Publish GamePost'}
            </button>
          </>
        )}
      />

      <AdminMetrics items={metrics} />

      <div className="admin-form-shell">
        <aside className="admin-form-sidebar">
          <div className="admin-sticky-bar">
            <div className="admin-sticky-bar__meta">
              <strong>{currentStep.label}</strong>
              <span>{currentStep.subtitle}</span>
            </div>
            <div className="admin-sticky-bar__actions">
              <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setActiveStep(Math.max(activeStep - 1, 0))}>
                Previous
              </button>
              <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setActiveStep(Math.min(activeStep + 1, STEPS.length - 1))}>
                Next
              </button>
            </div>
          </div>

          <div className="admin-step-list">
            {STEPS.map((step, index) => (
              <button key={step.id} type="button" className={`admin-step-item ${index === activeStep ? 'is-active' : ''}`} onClick={() => setActiveStep(index)}>
                <span className="admin-step-item__index">{index + 1}</span>
                <div className="admin-step-item__copy">
                  <strong className="admin-step-item__title">{step.label}</strong>
                  <span className="admin-step-item__subtitle">{step.subtitle}</span>
                </div>
                <span className={`admin-step-dot is-${stepStatuses[index]}`} />
              </button>
            ))}
          </div>
        </aside>

        <div className="admin-form-main">
          {activeStep === 0 && (
            <AdminPanel title="Step 1: Basic Information" meta="Core hero data, tagging, and publish state for the GamePost page.">
              <div className="admin-form-card">
                <div className="admin-form-grid cols-2">
                  <Input label="Game Title" value={form.title} onChange={(event) => updateTitle(event.target.value)} maxLength={80} hint={`${form.title.length}/80 characters`} />
                  <Input label="Short Description / Tagline" value={form.tagline} onChange={(event) => updateField('tagline', event.target.value)} maxLength={160} hint={`${form.tagline.length}/160 characters`} />
                  <Input label="Hero Background Image" value={form.heroBackgroundImage} onChange={(event) => updateField('heroBackgroundImage', event.target.value)} placeholder="https://..." hint="Required. Recommended at least 1920x1080." />
                  <Input label="Hero Foreground Image" value={form.heroForegroundImage} onChange={(event) => updateField('heroForegroundImage', event.target.value)} placeholder="https://..." />
                  <Input label="Game Franchise" value={form.franchise} onChange={(event) => updateField('franchise', event.target.value)} />
                  <Input label="URL Slug" value={form.slug} onChange={(event) => updateField('slug', slugify(event.target.value))} />
                  <Input label="Game Modes Overview" value={form.gameModesOverview} onChange={(event) => updateField('gameModesOverview', event.target.value)} placeholder="Tactical, Shooter, Multiplayer" />
                  <Select label="Status" value={form.status} onChange={(event) => updateField('status', event.target.value)} options={STATUS_OPTIONS} />
                </div>
              </div>

              <div className="admin-form-card">
                <div className="admin-form-card__header">
                  <h3 className="admin-form-card__title">Platforms</h3>
                  <p className="admin-form-card__description">Required multi-select. These shape the hero metadata and store links.</p>
                </div>
                <div className="admin-multi-select">
                  {PLATFORM_OPTIONS.map((platform) => (
                    <button key={platform} type="button" className={`admin-chip ${form.platforms.includes(platform) ? 'is-active' : ''}`} onClick={() => toggleArrayValue('platforms', platform)}>
                      {platform}
                    </button>
                  ))}
                </div>
              </div>

              <div className="admin-form-card">
                <div className="admin-form-card__header">
                  <h3 className="admin-form-card__title">Genres</h3>
                  <p className="admin-form-card__description">Primary genre is taken from the first selected tag and reused on game cards.</p>
                </div>
                <div className="admin-multi-select">
                  {GENRE_OPTIONS.map((genre) => (
                    <button key={genre} type="button" className={`admin-chip ${form.genres.includes(genre) ? 'is-active' : ''}`} onClick={() => toggleArrayValue('genres', genre)}>
                      {genre}
                    </button>
                  ))}
                </div>
              </div>
              <AIFeaturePlaceholder
                title="SEO Suggestions"
                description="AI suggests better H2/H3 headings, missing keywords, and meta description improvements based on your content."
                phase="Phase 2"
                inputLabel="Paste your meta description for analysis"
                inputType="textarea"
                actionLabel="Get SEO Suggestions"
              />
            </AdminPanel>
          )}

          {activeStep === 1 && (
            <AdminPanel title="Step 2: Story & Content" meta="Rich narrative blocks and gameplay explanation used across the public page.">
              <div className="admin-form-card">
                <Area label="Storyline / Overview" value={form.storyline} onChange={(event) => updateField('storyline', event.target.value)} rows={10} hint={`Minimum 200 words. Current: ${countWords(form.storyline)} words`} />
              </div>
              <div className="admin-form-card">
                <Area label="Gameplay Description" value={form.gameplayDescription} onChange={(event) => updateField('gameplayDescription', event.target.value)} rows={8} />
              </div>
              <div className="admin-form-card">
                <div className="admin-form-card__header">
                  <h3 className="admin-form-card__title">Key Gameplay Mechanics</h3>
                  <p className="admin-form-card__description">Add between 3 and 8 mechanic summaries. Each needs a bold label and a short explanation.</p>
                </div>
                <div className="admin-repeatable-list">
                  {form.keyGameplayMechanics.map((item, index) => (
                    <div key={`mechanic-${index}`} className="admin-repeatable-item">
                      <div className="admin-repeatable-item__header">
                        <strong className="admin-repeatable-item__title">Mechanic {index + 1}</strong>
                        {form.keyGameplayMechanics.length > 3 ? (
                          <button type="button" className="admin-btn admin-btn--ghost" onClick={() => removeListItem('keyGameplayMechanics', index)}>
                            <FiTrash2 />
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <div className="admin-form-grid cols-2">
                        <Input label="Label" value={item.label} onChange={(event) => updateListItem('keyGameplayMechanics', index, { label: event.target.value })} />
                        <Input label="Description" value={item.description} onChange={(event) => updateListItem('keyGameplayMechanics', index, { description: event.target.value })} />
                      </div>
                    </div>
                  ))}
                </div>
                {form.keyGameplayMechanics.length < 8 ? (
                  <button type="button" className="admin-btn admin-btn--ghost" onClick={() => addListItem('keyGameplayMechanics', emptyMechanic)}>
                    <FiPlus />
                    Add mechanic
                  </button>
                ) : null}
              </div>
              <div className="admin-form-card">
                <div className="admin-form-grid cols-2">
                  <Input label="Story & Community Label" value={form.storyCommunityLabel} onChange={(event) => updateField('storyCommunityLabel', event.target.value)} />
                  <Input label="More Games Section Text" value={form.moreGamesText} onChange={(event) => updateField('moreGamesText', event.target.value)} />
                </div>
              </div>
            </AdminPanel>
          )}

          {activeStep === 2 && (
            <AdminPanel title="Step 3: Media" meta="Gallery assets, trailer embed, cover art, and accessibility text.">
              <div className="admin-form-card">
                <div className="admin-repeatable-list">
                  {form.carouselImages.map((item, index) => (
                    <div key={`carousel-${index}`} className="admin-repeatable-item">
                      <div className="admin-repeatable-item__header">
                        <strong className="admin-repeatable-item__title">Carousel Image {index + 1}</strong>
                        {form.carouselImages.length > 3 ? (
                          <button type="button" className="admin-btn admin-btn--ghost" onClick={() => removeListItem('carouselImages', index)}>
                            <FiTrash2 />
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <div className="admin-form-grid cols-2">
                        <Input label="Image URL" value={item.url} onChange={(event) => updateListItem('carouselImages', index, { url: event.target.value })} />
                        <Input label="Alt Text" value={item.alt} onChange={(event) => updateListItem('carouselImages', index, { alt: event.target.value })} />
                      </div>
                    </div>
                  ))}
                </div>
                {form.carouselImages.length < 8 ? (
                  <button type="button" className="admin-btn admin-btn--ghost" onClick={() => addListItem('carouselImages', emptyAsset)}>
                    <FiPlus />
                    Add carousel image
                  </button>
                ) : null}
              </div>

              <div className="admin-form-card">
                <div className="admin-form-grid cols-2">
                  <Input label="YouTube Video URL" value={form.youtubeVideoUrl} onChange={(event) => updateField('youtubeVideoUrl', event.target.value)} />
                  <Input label="Media Alt Text" value={form.mediaAltText} onChange={(event) => updateField('mediaAltText', event.target.value)} />
                  <Input label="Cover Image" value={form.coverImage} onChange={(event) => updateField('coverImage', event.target.value)} hint="Required for game cards." />
                  <Input label="Cover Hero Image" value={form.coverHeroImage} onChange={(event) => updateField('coverHeroImage', event.target.value)} />
                </div>
              </div>

              <div className="admin-form-card">
                <div className="admin-form-card__header">
                  <h3 className="admin-form-card__title">Screenshot Gallery</h3>
                  <p className="admin-form-card__description">Up to 10 screenshots for the gameplay gallery.</p>
                </div>
                <div className="admin-repeatable-list">
                  {form.screenshotGallery.map((item, index) => (
                    <div key={`screenshot-${index}`} className="admin-repeatable-item">
                      <div className="admin-repeatable-item__header">
                        <strong className="admin-repeatable-item__title">Screenshot {index + 1}</strong>
                        <button type="button" className="admin-btn admin-btn--ghost" onClick={() => removeListItem('screenshotGallery', index)}>
                          <FiTrash2 />
                          Remove
                        </button>
                      </div>
                      <div className="admin-form-grid cols-2">
                        <Input label="Image URL" value={item.url || ''} onChange={(event) => updateListItem('screenshotGallery', index, { url: event.target.value })} />
                        <Input label="Alt Text" value={item.alt || ''} onChange={(event) => updateListItem('screenshotGallery', index, { alt: event.target.value })} />
                      </div>
                    </div>
                  ))}
                </div>
                {form.screenshotGallery.length < 10 ? (
                  <button type="button" className="admin-btn admin-btn--ghost" onClick={() => addListItem('screenshotGallery', emptyAsset)}>
                    <FiPlus />
                    Add screenshot
                  </button>
                ) : null}
              </div>
            </AdminPanel>
          )}

          {activeStep === 3 && (
            <AdminPanel title="Step 4: Quick Overview" meta="Controls, mode cards, and DLC flag used in the quick reference block.">
              <div className="admin-form-card">
                <Area label="OCC Description" value={form.occDescription} onChange={(event) => updateField('occDescription', event.target.value)} rows={4} />
              </div>
              <div className="admin-form-card">
                <div className="admin-form-card__header">
                  <h3 className="admin-form-card__title">Control Cards</h3>
                  <p className="admin-form-card__description">Add up to 4 cards such as Movement, Combat, Abilities, or Interface.</p>
                </div>
                <div className="admin-repeatable-list">
                  {form.controlCards.map((item, index) => (
                    <div key={`control-${index}`} className="admin-repeatable-item">
                      <div className="admin-repeatable-item__header">
                        <strong className="admin-repeatable-item__title">Control Card {index + 1}</strong>
                        {form.controlCards.length > 1 ? (
                          <button type="button" className="admin-btn admin-btn--ghost" onClick={() => removeListItem('controlCards', index)}>
                            <FiTrash2 />
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <div className="admin-form-grid cols-3">
                        <Input label="Icon" value={item.icon} onChange={(event) => updateListItem('controlCards', index, { icon: event.target.value })} placeholder="keyboard" />
                        <Input label="Category" value={item.label} onChange={(event) => updateListItem('controlCards', index, { label: event.target.value })} />
                        <Input label="Description" value={item.description} onChange={(event) => updateListItem('controlCards', index, { description: event.target.value })} />
                      </div>
                    </div>
                  ))}
                </div>
                {form.controlCards.length < 4 ? (
                  <button type="button" className="admin-btn admin-btn--ghost" onClick={() => addListItem('controlCards', emptyControlCard)}>
                    <FiPlus />
                    Add control card
                  </button>
                ) : null}
              </div>
              <div className="admin-form-card">
                <div className="admin-toggle-row">
                  <div>
                    <strong>DLC / Downloadable Content</strong>
                    <p>Turn this on if Step 6 should expose DLC entries.</p>
                  </div>
                  <label className="admin-checkbox-row">
                    <input type="checkbox" checked={form.hasDlc} onChange={(event) => updateField('hasDlc', event.target.checked)} />
                    <span>Game has DLC</span>
                  </label>
                </div>
              </div>
              <div className="admin-form-card">
                <div className="admin-form-card__header">
                  <h3 className="admin-form-card__title">Game Modes</h3>
                  <p className="admin-form-card__description">At least one mode is required for the quick overview block.</p>
                </div>
                <div className="admin-repeatable-list">
                  {form.gameModes.map((item, index) => (
                    <div key={`mode-${index}`} className="admin-repeatable-item">
                      <div className="admin-repeatable-item__header">
                        <strong className="admin-repeatable-item__title">Mode {index + 1}</strong>
                        {form.gameModes.length > 1 ? (
                          <button type="button" className="admin-btn admin-btn--ghost" onClick={() => removeListItem('gameModes', index)}>
                            <FiTrash2 />
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <div className="admin-form-grid cols-3">
                        <Input label="Icon" value={item.icon} onChange={(event) => updateListItem('gameModes', index, { icon: event.target.value })} />
                        <Input label="Mode Name" value={item.name} onChange={(event) => updateListItem('gameModes', index, { name: event.target.value })} />
                        <Input label="Description" value={item.description} onChange={(event) => updateListItem('gameModes', index, { description: event.target.value })} maxLength={100} />
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" className="admin-btn admin-btn--ghost" onClick={() => addListItem('gameModes', emptyMode)}>
                  <FiPlus />
                  Add game mode
                </button>
              </div>
            </AdminPanel>
          )}

          {activeStep === 4 && (
            <AdminPanel title="Step 5: System Requirements" meta="Toggle and configure the minimum and recommended spec table.">
              <div className="admin-form-card">
                <div className="admin-toggle-row">
                  <div>
                    <strong>Show System Requirements</strong>
                    <p>Disable this for console-only or mobile-only releases.</p>
                  </div>
                  <label className="admin-checkbox-row">
                    <input type="checkbox" checked={form.showSystemRequirements} onChange={(event) => updateField('showSystemRequirements', event.target.checked)} />
                    <span>Display on GamePost</span>
                  </label>
                </div>
              </div>
              {form.showSystemRequirements ? (
                <div className="admin-form-card">
                  <div className="admin-repeatable-list">
                    {form.systemRequirements.map((row, index) => (
                      <div key={`requirement-${index}`} className="admin-repeatable-item">
                        <div className="admin-form-grid cols-3">
                          <Input label="Component" value={row.component} onChange={(event) => updateListItem('systemRequirements', index, { component: event.target.value })} />
                          <Input label="Minimum" value={row.minimum} onChange={(event) => updateListItem('systemRequirements', index, { minimum: event.target.value })} />
                          <Input label="Recommended" value={row.recommended} onChange={(event) => updateListItem('systemRequirements', index, { recommended: event.target.value })} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="admin-btn admin-btn--ghost" onClick={() => addListItem('systemRequirements', () => emptyRequirement('Custom Component'))}>
                    <FiPlus />
                    Add custom row
                  </button>
                </div>
              ) : (
                <AdminEmptyState title="System requirements hidden" description="This section will stay off on the public GamePost page." />
              )}
            </AdminPanel>
          )}

          {activeStep === 5 && (
            <AdminPanel title="Step 6: Store & Extras" meta="Store links, DLC records, awards, and surfaced achievements.">
              <div className="admin-form-card">
                <Input label="Store In-Game Label" value={form.storeLabel} onChange={(event) => updateField('storeLabel', event.target.value)} placeholder="Get the Game" />
              </div>
              <div className="admin-form-card">
                <div className="admin-form-card__header">
                  <h3 className="admin-form-card__title">Get Game Links</h3>
                </div>
                <div className="admin-repeatable-list">
                  {form.getGameLinks.map((item, index) => (
                    <div key={`store-link-${index}`} className="admin-repeatable-item">
                      <div className="admin-repeatable-item__header">
                        <strong className="admin-repeatable-item__title">Store Link {index + 1}</strong>
                        {form.getGameLinks.length > 1 ? (
                          <button type="button" className="admin-btn admin-btn--ghost" onClick={() => removeListItem('getGameLinks', index)}>
                            <FiTrash2 />
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <div className="admin-form-grid cols-3">
                        <Input label="Platform" value={item.platform} onChange={(event) => updateListItem('getGameLinks', index, { platform: event.target.value })} />
                        <Input label="Store URL" value={item.url} onChange={(event) => updateListItem('getGameLinks', index, { url: event.target.value })} />
                        <Input label="Price" value={item.price} onChange={(event) => updateListItem('getGameLinks', index, { price: event.target.value })} />
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" className="admin-btn admin-btn--ghost" onClick={() => addListItem('getGameLinks', emptyStoreLink)}>
                  <FiPlus />
                  Add store link
                </button>
              </div>

              <RepeatableSection
                title="DLC Entries"
                description="Only fill this when DLC is enabled in Step 4."
                items={form.dlcEntries}
                onAdd={() => addListItem('dlcEntries', emptyDlc)}
                onRemove={(index) => removeListItem('dlcEntries', index)}
                render={(item, index) => (
                  <div className="admin-form-grid cols-3">
                    <Input label="Title" value={item.title} onChange={(event) => updateListItem('dlcEntries', index, { title: event.target.value })} />
                    <Input label="Type" value={item.type} onChange={(event) => updateListItem('dlcEntries', index, { type: event.target.value })} />
                    <Input label="Release Date" type="date" value={item.releaseDate} onChange={(event) => updateListItem('dlcEntries', index, { releaseDate: event.target.value })} />
                    <Input label="Description" value={item.description} onChange={(event) => updateListItem('dlcEntries', index, { description: event.target.value })} />
                    <Input label="Price" value={item.price} onChange={(event) => updateListItem('dlcEntries', index, { price: event.target.value })} />
                    <Input label="Store URL" value={item.url} onChange={(event) => updateListItem('dlcEntries', index, { url: event.target.value })} />
                  </div>
                )}
              />

              <RepeatableSection
                title="Awards"
                items={form.awards}
                onAdd={() => addListItem('awards', emptyAward)}
                onRemove={(index) => removeListItem('awards', index)}
                render={(item, index) => (
                  <div className="admin-form-grid cols-3">
                    <Input label="Award Name" value={item.award} onChange={(event) => updateListItem('awards', index, { award: event.target.value })} />
                    <Input label="Organisation" value={item.organisation} onChange={(event) => updateListItem('awards', index, { organisation: event.target.value })} />
                    <Input label="Year" value={item.year} onChange={(event) => updateListItem('awards', index, { year: event.target.value })} />
                  </div>
                )}
              />

              <RepeatableSection
                title="Achievements"
                items={form.achievements}
                onAdd={() => addListItem('achievements', emptyAchievement)}
                onRemove={(index) => removeListItem('achievements', index)}
                render={(item, index) => (
                  <div className="admin-form-grid cols-3">
                    <Input label="Achievement Name" value={item.name} onChange={(event) => updateListItem('achievements', index, { name: event.target.value })} />
                    <Input label="Description" value={item.description} onChange={(event) => updateListItem('achievements', index, { description: event.target.value })} />
                    <Input label="Completion %" value={item.completionRate} onChange={(event) => updateListItem('achievements', index, { completionRate: event.target.value })} />
                  </div>
                )}
              />
            </AdminPanel>
          )}

          {activeStep === 6 && (
            <AdminPanel title="Step 7: Reviews & Community" meta="Expert review inputs, GZS score controls, and inline community hub settings.">
              <RepeatableSection
                title="Expert Reviews"
                description="Up to 5 expert review cards feed the public page and GZS score."
                items={form.expertReviews}
                onAdd={() => form.expertReviews.length < 5 && addListItem('expertReviews', emptyReview)}
                onRemove={(index) => removeListItem('expertReviews', index)}
                render={(item, index) => (
                  <div className="admin-form-grid cols-3">
                    <Input label="Reviewer" value={item.reviewer} onChange={(event) => updateListItem('expertReviews', index, { reviewer: event.target.value })} />
                    <Input label="Outlet" value={item.outlet} onChange={(event) => updateListItem('expertReviews', index, { outlet: event.target.value })} />
                    <Input label="Score" value={item.score} onChange={(event) => updateListItem('expertReviews', index, { score: event.target.value })} placeholder="9.2" />
                    <Input label="Quote" value={item.quote} onChange={(event) => updateListItem('expertReviews', index, { quote: event.target.value })} />
                    <Input label="Review URL" value={item.url} onChange={(event) => updateListItem('expertReviews', index, { url: event.target.value })} />
                  </div>
                )}
              />

              <div className="admin-form-card">
                <div className="admin-form-grid cols-3">
                  <Input label="GZS Score Override" value={form.gzsScoreOverride} onChange={(event) => updateField('gzsScoreOverride', event.target.value)} hint={`Calculated from expert reviews: ${getAverageScore(form.expertReviews) || 'No score yet'}`} />
                  <Select label="Score Descriptor" value={form.scoreDescriptor} onChange={(event) => updateField('scoreDescriptor', event.target.value)} options={SCORE_DESCRIPTORS} />
                  <Select label="Community Branch Link" value={form.communityBranchLink} onChange={(event) => updateField('communityBranchLink', event.target.value)} options={BRANCH_OPTIONS} />
                </div>
                <div className="admin-form-grid cols-3">
                  <label className="admin-checkbox-row">
                    <input type="checkbox" checked={form.communityHubEnabled} onChange={(event) => updateField('communityHubEnabled', event.target.checked)} />
                    <span>Community hub enabled</span>
                  </label>
                  <label className="admin-checkbox-row">
                    <input type="checkbox" checked={form.userRatingEnabled} onChange={(event) => updateField('userRatingEnabled', event.target.checked)} />
                    <span>User ratings enabled</span>
                  </label>
                </div>
              </div>
              <AIFeaturePlaceholder
                title="Review Sentiment Analysis"
                description="Automatically classify user reviews as Positive, Mixed, or Negative. Sentiment distribution chart shown in admin view."
                phase="Phase 2"
                inputLabel="Runs automatically on new user reviews"
                inputType="url"
                actionLabel="Analyse Sentiment"
              />
            </AdminPanel>
          )}

          {activeStep === 7 && (
            <AdminPanel title="Step 8: More Games (Related)" meta="Select related titles for the More Like This carousel and Phase 2 AI override.">
              <div className="admin-form-card">
                <div className="admin-form-card__header">
                  <h3 className="admin-form-card__title">Related Games Picker</h3>
                </div>
                <div className="admin-chip-group">
                  {libraryGames
                    .filter((game) => String(game.id) !== String(params.id))
                    .map((game) => {
                      const selected = form.relatedGames.includes(game.slug || game.title);
                      return (
                        <button
                          key={game.id}
                          type="button"
                          className={`admin-chip ${selected ? 'is-active' : ''}`}
                          onClick={() => {
                            const value = game.slug || game.title;
                            updateField(
                              'relatedGames',
                              selected
                                ? form.relatedGames.filter((item) => item !== value)
                                : [...form.relatedGames, value].slice(0, 8),
                            );
                          }}
                        >
                          {game.title}
                        </button>
                      );
                    })}
                </div>
                <small className="admin-field-hint">Choose between 3 and 8 related games.</small>
              </div>
              <div className="admin-form-card">
                <label className="admin-checkbox-row">
                  <input type="checkbox" checked={form.overrideAiSuggestions} onChange={(event) => updateField('overrideAiSuggestions', event.target.checked)} />
                  <span>Override AI suggestions with this manual list</span>
                </label>
              </div>
              <AIFeaturePlaceholder
                title="AI Similarity Suggestions"
                description="Auto-suggest related games based on shared genre, platform, and co-engagement patterns. Admin approves or overrides."
                phase="Phase 2"
                inputLabel="AI scans game metadata automatically"
                inputType="url"
                actionLabel="Generate Suggestions"
              />
            </AdminPanel>
          )}

          {activeStep === 8 && (
            <AdminPanel title="Step 9: Social & Community" meta="Brand color, socials, community publishing settings, and SEO meta.">
              <div className="admin-form-card">
                <div className="admin-form-grid cols-2">
                  <Input label="Game Colour Theme" type="color" value={form.gameThemeColor} onChange={(event) => updateField('gameThemeColor', event.target.value)} />
                  <Input label="Join Community Heading" value={form.joinCommunityHeading} onChange={(event) => updateField('joinCommunityHeading', event.target.value)} placeholder={`Join the ${form.title || 'Game'} Community`} />
                  <Input label="Instagram URL" value={form.instagramUrl} onChange={(event) => updateField('instagramUrl', event.target.value)} />
                  <Input label="YouTube URL" value={form.youtubeUrl} onChange={(event) => updateField('youtubeUrl', event.target.value)} />
                </div>
                <label className="admin-checkbox-row">
                  <input type="checkbox" checked={form.publishToCommunity} onChange={(event) => updateField('publishToCommunity', event.target.checked)} />
                  <span>Auto-post an announcement to the selected community branch on publish</span>
                </label>
              </div>
              <RepeatableSection
                title="Social Links"
                items={form.socialLinks}
                onAdd={() => addListItem('socialLinks', emptySocial)}
                onRemove={(index) => removeListItem('socialLinks', index)}
                render={(item, index) => (
                  <div className="admin-form-grid cols-2">
                    <Input label="Platform" value={item.platform} onChange={(event) => updateListItem('socialLinks', index, { platform: event.target.value })} placeholder="Discord" />
                    <Input label="URL" value={item.url} onChange={(event) => updateListItem('socialLinks', index, { url: event.target.value })} placeholder="https://..." />
                  </div>
                )}
              />
              <div className="admin-form-card">
                <div className="admin-form-card__header">
                  <h3 className="admin-form-card__title">SEO</h3>
                  <p className="admin-form-card__description">Search engine meta fields for this game page.</p>
                </div>
                <div className="admin-form-grid cols-2">
                  <Area
                    label="Meta Description"
                    value={form.metaDescription}
                    onChange={e => updateField('metaDescription', e.target.value.slice(0, 160))}
                    rows={3}
                    placeholder={form.tagline}
                    hint={`${(form.metaDescription || '').length}/160 characters`}
                  />
                  <Input
                    label="Canonical URL"
                    value={form.canonicalUrl}
                    onChange={e => updateField('canonicalUrl', e.target.value)}
                    placeholder={`/games/${form.slug}`}
                    hint="Auto-populated from slug. Editable."
                  />
                </div>
              </div>
              <div className="admin-form-card">
                <div className="admin-toggle-row">
                  <div>
                    <strong>Publish immediately</strong>
                    <p>Turn off to schedule a future publish date and time.</p>
                  </div>
                  <label className="admin-checkbox-row">
                    <input type="checkbox" checked={form.publishImmediately} onChange={e => updateField('publishImmediately', e.target.checked)} />
                    <span>{form.publishImmediately ? 'On' : 'Off'}</span>
                  </label>
                </div>
                {!form.publishImmediately && (
                  <div style={{ marginTop: 12 }}>
                    <Input
                      label="Scheduled Publish Date & Time"
                      type="datetime-local"
                      value={form.scheduledPublishDate}
                      onChange={e => updateField('scheduledPublishDate', e.target.value)}
                      hint="Post will publish automatically at this date and time."
                    />
                  </div>
                )}
              </div>
            </AdminPanel>
          )}

          <div className="admin-form-footer">
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => saveGame('Draft')} disabled={saving}>
              Save as draft
            </button>
            <button type="button" className="admin-btn" onClick={() => saveGame('Published')} disabled={saving}>
              {publishReady ? 'Publish GamePost' : 'Complete steps 1 to 4 first'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RepeatableSection({ title, description, items, onAdd, onRemove, render }) {
  return (
    <div className="admin-form-card">
      <div className="admin-form-card__header">
        <div>
          <h3 className="admin-form-card__title">{title}</h3>
          {description ? <p className="admin-form-card__description">{description}</p> : null}
        </div>
        <button type="button" className="admin-btn admin-btn--ghost" onClick={onAdd}>
          <FiPlus />
          Add item
        </button>
      </div>
      {items.length ? (
        <div className="admin-repeatable-list">
          {items.map((item, index) => (
            <div key={`${title}-${index}`} className="admin-repeatable-item">
              <div className="admin-repeatable-item__header">
                <strong className="admin-repeatable-item__title">{title} {index + 1}</strong>
                <button type="button" className="admin-btn admin-btn--ghost" onClick={() => onRemove(index)}>
                  <FiTrash2 />
                  Remove
                </button>
              </div>
              {render(item, index)}
            </div>
          ))}
        </div>
      ) : (
        <AdminEmptyState title={`No ${title.toLowerCase()} yet`} description="Use Add item to start building this block." />
      )}
    </div>
  );
}

