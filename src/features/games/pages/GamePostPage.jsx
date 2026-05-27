import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import { usePageTheme } from '@/app/providers/ThemeProvider';
import PageLoader from '@/shared/components/PageLoader';
import { GameThemeProvider } from '@/features/games/providers/GameThemeProvider';
import { GAMES } from '@/shared/data/gameData';
import { adaptGameRecord } from '@/shared/adapters/contentAdapters';
import { useGame } from '@/services/mutators/useGames';

import {
  HeroSection,
  StorylineSection,
  GameplaySection,
  QuickControlSection,
  SystemRequirementSection,
  ModesSection,
  ReviewsSection,
  CommunitySection,
  CriticRatingSection,
  JoinCommunitySection,
  MediaGallerySection,
  GetGameSection,
  StoreExtrasSection,
  AwardsSection,
  MoreLikeThisSection,
} from './sections';

const SECTION_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'gameplay', label: 'Gameplay' },
  { id: 'controls', label: 'Controls' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'get-game', label: 'Get Game' },
  { id: 'community', label: 'Community' },
];

function SectionNav({ activeTab, onTabClick }) {
  return (
    <nav className="gp-section-nav" aria-label="Game page sections">
      <div className="gp-section-nav__inner">
        {SECTION_TABS.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabClick(tab.id)}
              className={`gp-section-nav__button ${isActive ? 'is-active' : ''}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default function GamePostPage({ previewData }) {
  const { slug } = useParams();
  usePageTheme('gamepost');

  const { data: gameData, isLoading } = useGame(slug);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveTab(entry.target.id);
          }
        });
      },
      { threshold: 0.2, rootMargin: '-120px 0px -60% 0px' }
    );

    const sections = ['overview', 'story', 'gameplay', 'media', 'reviews', 'community'];
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const rawData = previewData || gameData || GAMES[slug] || GAMES.valorant;
  const loading = !previewData && isLoading;

  if (loading) return <PageLoader />;

  if (!rawData) {
    return <div className="gp-empty-state">Game not found</div>;
  }

  const data = adaptGameRecord(rawData);

  const theme = data.theme || {
    primary: 'var(--gp-red, #e53935)',
    primaryDark: 'var(--gp-red-dark, #c62828)',
    primaryLight: 'var(--gp-red-light, #ef5350)',
    bgPage: '#FFFFFF',
    bgSection: '#F1F5F9',
    border: '#E2E8F0',
    textHeading: '#0F172A',
  };

  const handleTabClick = (id) => {
    setActiveTab(id);

    const el = document.getElementById(`gp-section-${id}`);
    if (!el) return;

    const topOffset = 140;
    const top = el.getBoundingClientRect().top + window.scrollY - topOffset;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const platforms = Array.isArray(data.game_info?.platforms)
    ? data.game_info.platforms
    : (data.game_info?.platforms || '').split(/\s*·\s*/).filter(Boolean);

  const genres = Array.isArray(data.game_info?.genres)
    ? data.game_info.genres
    : (data.game_info?.genres || '').split(/\s*·\s*/).filter(Boolean);

  return (
    <GameThemeProvider theme={theme}>
      <Helmet>
        <title>{`${data.hero?.game_title || data.title || 'Game'} | GzoneSphere`}</title>
        <meta
          name="description"
          content={data.storyline?.summary || data.description || 'Game details.'}
        />
        <meta
          property="og:title"
          content={`${data.hero?.game_title || data.title} on GzoneSphere`}
        />
        <meta
          property="og:image"
          content={data.hero?.background_img || data.banner_url || ''}
        />
        <link rel="canonical" href={`https://gzonesphere.com/games/${slug}`} />
      </Helmet>

      <div className="gp-page-bg gp-page-shell">
        <SectionNav activeTab={activeTab} onTabClick={handleTabClick} />

        <div className="gp-page-content">
          <div id="gp-section-overview">
            <HeroSection hero={data.hero} genres={genres} platforms={platforms} />
            <StorylineSection storyline={data.storyline} info={data.game_info} />
            <MediaGallerySection carousel={data.carousel} />
          </div>

          <div id="gp-section-gameplay">
            <GameplaySection gameplay={data.gameplay} screenshots={data.carousel} />
          </div>

          <div id="gp-section-controls">
            <QuickControlSection
              controls={Array.isArray(data.quick_control_overview)
                ? data.quick_control_overview
                : data.quick_control_overview
                  ? [data.quick_control_overview]
                  : []}
            />
            <ModesSection modes={data.modes} />
          </div>

          <div id="gp-section-requirements">
            <SystemRequirementSection sys={data.system_requirement} />
          </div>

          <div id="gp-section-reviews">
            <ReviewsSection expert={data.expert_reviews} user={data.user_reviews} />
          </div>

          <div id="gp-section-get-game">
            <GetGameSection getGame={data.get_game} />
            <StoreExtrasSection
              extras={data.store_extras}
              purchaseLinks={data.get_game?.purchaseLinks}
            />
            <AwardsSection awards={data.awards_and_achievements} />
          </div>

          <div id="gp-section-community">
            <MoreLikeThisSection games={data.related_games} />
            <CriticRatingSection
              score={data.gzs_score}
              descriptor={data.score_descriptor}
              expertReviews={data.expert_reviews}
              gameSlug={slug}
            />
            <CommunitySection community={data.community_hub} gameSlug={slug} />
            <JoinCommunitySection
              community={data.join_our_community}
              criticRating={data.critic_rating}
            />
          </div>
        </div>
      </div>
    </GameThemeProvider>
  );
}
