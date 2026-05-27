import { lazy } from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '@/shared/components/ProtectedRoute';

const SettingsHome = lazy(() => import('@/features/settings/pages/SettingsHome'));
const AccountSettings = lazy(() => import('@/features/settings/pages/AccountSettings'));
const ProfileSettings = lazy(() => import('@/features/settings/pages/ProfileSettings'));
const SecurityPassword = lazy(() => import('@/features/settings/pages/SecurityPassword'));
const PrivacyDefaults = lazy(() => import('@/features/settings/pages/PrivacyDefaults'));
const LinkedAccounts = lazy(() => import('@/features/settings/pages/LinkedAccounts'));
const NotificationSettings = lazy(() => import('@/features/settings/pages/NotificationSettings'));
const NotificationInbox = lazy(() => import('@/features/settings/pages/NotificationInbox'));
const TrustHistory = lazy(() => import('@/features/settings/pages/TrustHistory'));

const SettingsRoutes = () => (
  <>
    <Route element={<ProtectedRoute />}>
      <Route path="/settings"                    element={<SettingsHome />} />
      <Route path="/settings/account"            element={<AccountSettings />} />
      <Route path="/settings/security"           element={<SecurityPassword />} />
      <Route path="/settings/notifications"      element={<NotificationSettings />} />
      <Route path="/settings/privacy"            element={<PrivacyDefaults />} />
      <Route path="/settings/linked"             element={<LinkedAccounts />} />
      <Route path="/settings/trust-history"      element={<TrustHistory />} />
      <Route path="/notifications"               element={<NotificationInbox />} />
    </Route>
  </>
);

export default SettingsRoutes;





