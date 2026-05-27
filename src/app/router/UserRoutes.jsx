import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/shared/components/ProtectedRoute';
import CompanyRoute from '@/shared/components/CompanyRoute';
import Layout from '@/shared/components/Layout';

// ── Feed ──────────────────────────────────────────────────────
const Feed = lazy(() => import('@/features/home/pages/Feed'));

// ── Auth (no layout / no navbar) ──────────────────────────────
const Login                    = lazy(() => import('@/features/profile/auth/Login'));
const Signup                   = lazy(() => import('@/features/profile/auth/Signup'));
const VerifyEmail               = lazy(() => import('@/features/profile/auth/VerifyEmail'));
const ProfileSetup              = lazy(() => import('@/features/profile/auth/ProfileSetup'));
const MasterIdentitySetup       = lazy(() => import('@/features/profile/auth/MasterIdentitySetup'));
const OrganizationIdentitySetup = lazy(() => import('@/features/profile/auth/OrganizationIdentitySetup'));

// ── Onboarding (protected, post-signup) ──────────────────────
const IntentQuiz           = lazy(() => import('@/features/profile/pages/onboarding/IntentQuiz'));
const ProfileTypeSelection = lazy(() => import('@/features/profile/pages/onboarding/ProfileTypeSelection'));

// ── Profile pages ─────────────────────────────────────────────
const MyProfile            = lazy(() => import('@/features/profile/pages/MyProfile'));
const ProfileHowItWorks    = lazy(() => import('@/features/profile/pages/ProfileHowItWorks'));
const CreateSubProfile     = lazy(() => import('@/features/profile/pages/subprofiles/CreateSubProfile'));
const UnifiedProfileFacade = lazy(() => import('@/features/profile/pages/subprofiles/UnifiedProfileFacade'));
const EditSubProfile       = lazy(() => import('@/features/profile/pages/subprofiles/EditSubProfile'));

// ── Company pages ─────────────────────────────────────────────
const CompanyDashboard    = lazy(() => import('@/features/profile/company/pages/CompanyDashboard'));
const CompanyProfile      = lazy(() => import('@/features/profile/company/pages/CompanyProfile'));
const ChallengeBuilder    = lazy(() => import('@/features/profile/company/pages/ChallengeBuilder'));
const ChallengeDashboard  = lazy(() => import('@/features/profile/company/pages/ChallengeDashboard'));
const TeamBuilder         = lazy(() => import('@/features/profile/company/pages/TeamBuilder'));
const HireHistory         = lazy(() => import('@/features/profile/company/pages/HireHistory'));

// Re-check ChallengeDashboard import specifically as I might have mis-remembered the path during rewrite
// Based on previous view_file:
// const ChallengeDashboard  = lazy(() => import('@/features/profile/company/pages/ChallengeDashboard'));

const UserRoutes = () => (
  <>
    {/* ── Step 1–3: Auth flow (no navbar) ── */}
    <Route path="/login"                element={<Login />} />
    <Route path="/signup"               element={<Signup />} />
    <Route path="/verify-email"         element={<VerifyEmail />} />
    <Route path="/profile-setup"        element={<ProfileSetup />} />
    <Route path="/profile/master-setup" element={<MasterIdentitySetup />} />
    <Route path="/profile/org-setup"    element={<OrganizationIdentitySetup />} />

    <Route element={<Layout />}>
      <Route element={<ProtectedRoute />}>

        {/* ── Feed ── */}
        <Route path="/feed" element={<Feed />} />

        {/* ── Step 4–5: Onboarding (after account created) ── */}
        <Route path="/onboarding/quiz"           element={<IntentQuiz />} />
        <Route path="/onboarding/profile-select" element={<ProfileTypeSelection />} />

        {/* Legacy redirect support */}
        <Route path="/profile/choose-subprofile" element={<Navigate to="/onboarding/profile-select" replace />} />
        <Route path="/profile/intent-quiz"       element={<Navigate to="/onboarding/quiz" replace />} />

        {/* ── Profile pages — static routes MUST come before /:type ── */}
        <Route path="/profile"              element={<MyProfile />} />
        <Route path="/profile/create-sub"   element={<CreateSubProfile />} />
        <Route path="/profile/how-it-works" element={<ProfileHowItWorks />} />
        <Route path="/profile/master"       element={<Navigate to="/profile" replace />} />

        {/* ── Sub-profile routes (dynamic) ── */}
        {/* :type = dev | esports | content | business | art | writing | audio */}
        <Route path="/profile/:type"        element={<UnifiedProfileFacade />} />
        <Route path="/profile/:type/edit"   element={<EditSubProfile />} />

        {/* ── Company routes ── */}
        <Route element={<CompanyRoute />}>
          <Route path="/company"                         element={<CompanyDashboard />} />
          <Route path="/company/profile"                 element={<CompanyProfile />} />
          <Route path="/company/challenges/new"          element={<ChallengeBuilder />} />
          <Route path="/company/challenges/:challengeId" element={<ChallengeDashboard />} />
          <Route path="/company/team-builder"            element={<TeamBuilder />} />
          <Route path="/company/history"                 element={<HireHistory />} />
        </Route>

      </Route>
    </Route>
  </>
);

export default UserRoutes;
