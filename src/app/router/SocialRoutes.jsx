import React, { lazy } from 'react';
import { Route, Navigate, useParams } from 'react-router-dom';
import ProtectedRoute from '@/shared/components/ProtectedRoute';
import { validateCommunitySlug } from '@/shared/utils/routeValidation';
import ErrorBoundary from '@/shared/components/ErrorBoundary';
import ServiceUnavailable from '@/shared/components/ServiceUnavailable';

// Community hub & layout
const CommunityLayout = lazy(() => import('@/features/community/pages/CommunityLayout'));
const CommunitySelector = lazy(() => import('@/features/community/pages/CommunitySelector'));

const BranchHub = lazy(() => import('@/features/community/pages/BranchHub'));

// Community sub-pages (modules)
const CommunityRoom = lazy(() => import('@/features/community/pages/modules/CommunityRoom'));
const GroupsList = lazy(() => import('@/features/community/pages/modules/GroupsList'));
const GroupView = lazy(() => import('@/features/community/pages/modules/GroupView'));
const ShowcaseFeed = lazy(() => import('@/features/community/pages/modules/ShowcaseFeed'));
const LFGBoard = lazy(() => import('@/features/community/pages/modules/LFGBoard'));
const CommunityEvents = lazy(() => import('@/features/community/pages/modules/CommunityEvents'));
const ComingSoon = lazy(() => import('@/features/community/pages/ComingSoon'));

// Messages
const MessagingHub = lazy(() => import('@/features/community/messages/pages/MessagingHub'));
const ConversationView = lazy(() => import('@/features/community/messages/pages/ConversationView'));

const SocialRoutes = () => (
  <>
    <Route element={<ProtectedRoute />}>
      {/* /community selector page */}
      <Route key="community-index" path="/community" element={<CommunitySelector />} />

      {/* Backward-compat redirects BEFORE dynamic routes (must come first!) */}
      <Route path="/community/game-dev"          element={<Navigate to="/community/dev"      replace />} />
      <Route path="/community/art-visual"        element={<Navigate to="/community/art"      replace />} />
      <Route path="/community/content-media"     element={<Navigate to="/community/content"  replace />} />
      <Route path="/community/business-strategy" element={<Navigate to="/community/business" replace />} />
      <Route path="/community/writing-narrative" element={<Navigate to="/community/writing"  replace />} />
      <Route path="/community/music-audio"       element={<Navigate to="/community/audio"    replace />} />

      {/* Each community with nested sub-routes (more specific goes after redirects) */}
      <Route path="/community/:slug" element={<CommunityLayout />}>
        <Route index element={<CommunityHomeRouter />} />
        <Route path="channels" element={<DefaultChannelRedirect />} />
        <Route key="community-room"       path="channels/:channelId"    element={<CommunityRoom />} />
        <Route key="community-lfg"        path="lfg"               element={<LFGBoard />} />
        <Route key="community-events"     path="events"            element={<CommunityEvents />} />
        <Route key="community-clips"      path="clips"             element={<ComingSoon title="Community Clips" description="Share and watch community highlight clips." />} />
        <Route key="community-hiring"     path="hiring-room/:roomId" element={<ComingSoon title="Hiring Room" description="Company hiring rooms coming soon." />} />
        <Route key="community-incubator"  path="incubator"         element={<ComingSoon title="Collab Incubator" description="Build and pitch collaborative projects." />} />
        <Route key="community-groups"     path="groups"            element={<GroupsList />} />
        <Route key="community-group-view" path="groups/:groupId"   element={<GroupView />} />
        <Route key="community-showcase"   path="showcase"          element={<ShowcaseFeed />} />
        {/* Legacy global sub-routes */}
        <Route key="community-bridge" path="bridge" element={<ComingSoon title="Community Network" description="Cross-community connections coming soon." />} />
        <Route key="community-pro"    path="pro"    element={<ComingSoon title="Community Pro" description="Upgrade your community presence." />} />
      </Route>

      {/* ── Messages ── */}
      <Route
        path="/messages"
        element={
          <ErrorBoundary fallback={<ServiceUnavailable service="Messaging" />}>
            <MessagingHub />
          </ErrorBoundary>
        }
      >
        <Route index element={
          <div className="hidden md:flex flex-1 flex-col items-center justify-center min-h-full text-center p-8 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--theme-bg-section)] border border-[var(--theme-border)] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--theme-text-muted)]">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-[var(--theme-text-muted)]">Select a conversation to start messaging</p>
          </div>
        } />
        <Route
          path=":conversationId"
          element={
            <ErrorBoundary fallback={<ServiceUnavailable service="Messaging" />}>
              <ConversationView />
            </ErrorBoundary>
          }
        />
      </Route>
    </Route>
  </>
);

function CommunityHomeRouter() {
  const { slug } = useParams();

  if (!validateCommunitySlug(slug)) return <Navigate to="/" replace />;

  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh] text-[var(--theme-text-muted)]">
        Loading community...
      </div>
    }>
      <BranchHub slug={slug} />
    </React.Suspense>
  );
}

function DefaultChannelRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/community/${slug}/channels/general`} replace />;
}

export default SocialRoutes;
