import { lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { usePageTheme } from '@/app/providers/ThemeProvider';

const HeroSection           = lazy(() => import('@/features/home/components/HeroSection'));
const ProblemSection        = lazy(() => import('@/features/home/components/ProblemSection'));
const SolutionSection       = lazy(() => import('@/features/home/components/SolutionSection'));
const AudienceSection       = lazy(() => import('@/features/home/components/AudienceSection'));
const PlatformSections      = lazy(() => import('@/features/home/components/PlatformSections'));
const ProfileSystemSection  = lazy(() => import('@/features/home/components/ProfileSystemSection'));
const LiveActivitySection   = lazy(() => import('@/features/home/components/LiveActivitySection'));
const DifferentiatorSection = lazy(() => import('@/features/home/components/DifferentiatorSection'));
const ContentPreviewSection = lazy(() => import('@/features/home/components/ContentPreviewSection'));
const FinalCTASection       = lazy(() => import('@/features/home/components/FinalCTASection'));

export default function Home() {
  usePageTheme('home');
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
    <div className="theme-home min-h-screen bg-[var(--theme-bg)] font-body overflow-x-hidden">
      <Helmet>
        <title>GzoneSphere | The Future of Gaming, Unified</title>
        <meta name="description" content="GzoneSphere is where gamers, creators, and companies meet — to compete, build, and grow together." />
        <meta property="og:title" content="GzoneSphere | The Future of Gaming, Unified" />
        <meta property="og:description" content="One Master Identity. Seven domain sub-profiles. The gaming platform gaming has always deserved." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://gzonesphere.com/" />
      </Helmet>
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <AudienceSection />
      <PlatformSections />
      <ProfileSystemSection />
      <LiveActivitySection />
      <DifferentiatorSection />
      <ContentPreviewSection />
      <FinalCTASection />
    </div>
    </Suspense>
  );
}





