import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import PublicLayout from '@/app/layouts/PublicLayout';
import ErrorBoundary from '@/shared/components/ErrorBoundary';
import ServiceUnavailable from '@/shared/components/ServiceUnavailable';

const Home             = lazy(() => import('@/features/home/pages/Home'));
const GamePostPage     = lazy(() => import('@/features/games/pages/GamePostPage'));
const GamePostCollection = lazy(() => import('@/features/games/pages/GamePostCollection'));
const Discovery        = lazy(() => import('@/features/games/pages/Discovery'));
const Blog             = lazy(() => import('@/features/blogs/pages/Blog'));
const BlogPost         = lazy(() => import('@/features/blogs/pages/BlogPost'));
const BlogWriteGate    = lazy(() => import('@/features/blogs/pages/BlogWriteGate'));
const Career           = lazy(() => import('@/features/career/pages/Career'));
const AboutHub         = lazy(() => import('@/features/about/pages/AboutHub'));
const About            = lazy(() => import('@/features/about/pages/About'));
const AboutStory       = lazy(() => import('@/features/about/pages/AboutStory'));
const Contact          = lazy(() => import('@/features/contact/pages/Contact'));
const NotFound         = lazy(() => import('@/features/games/pages/NotFound'));
const GamesBrowse      = lazy(() => import('@/features/games/pages/GamesBrowse'));
const PublicProfile    = lazy(() => import('@/features/profile/pages/public/PublicProfile'));
const CompanyPublicProfile = lazy(() => import('@/features/profile/company/pages/CompanyProfile'));

function eb(element, service) {
  return (
    <ErrorBoundary fallback={<div className="py-24 px-6 container-global"><ServiceUnavailable service={service} /></div>}>
      {element}
    </ErrorBoundary>
  );
}

const PublicRoutes = () => (
  <>
    <Route element={<PublicLayout />}>
      <Route path="/"                  element={eb(<Home />, 'Home')} />
      <Route path="/games"             element={eb(<GamePostCollection />, 'Games')} />
      <Route path="/games/browse"      element={eb(<GamesBrowse />, 'Games')} />
      <Route path="/games/:slug"       element={eb(<GamePostPage />, 'Game')} />
      <Route path="/game-collection"   element={<Navigate to="/games" replace />} />
      <Route path="/blog"              element={eb(<Blog />, 'Blog')} />
      <Route path="/blog/:slug"        element={eb(<BlogPost />, 'Blog')} />
      <Route path="/write-blog"        element={eb(<BlogWriteGate />, 'Blog')} />
      <Route path="/discovery"         element={eb(<Discovery />, 'Discovery')} />
      <Route path="/career"            element={eb(<Career />, 'Career')} />
      <Route path="/about"             element={<AboutHub />} />
      <Route path="/about/details"     element={<About />} />
      <Route path="/about/origin"      element={<AboutStory />} />
      <Route path="/contact"           element={<Contact />} />
      <Route path="/u/:username"       element={eb(<PublicProfile />, 'Profile')} />
      <Route path="/company/:slug"     element={eb(<CompanyPublicProfile />, 'Company Profile')} />
    </Route>
  </>
);

export default PublicRoutes;





