import { Outlet } from 'react-router-dom';
import Navbar from '@/shared/components/Navbar';
import Footer from '@/shared/components/Footer';
import MobileBottomTabs from '@/shared/components/MobileBottomTabs';

/**
 * PublicLayout — wraps all public-facing pages.
 * Renders Navbar + page content (Outlet) + Footer.
 * Page themes applied via usePageTheme() inside each page component.
 */
const PublicLayout = () => (
    <div className="app-shell pb-16 lg:pb-0">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[999] focus:px-4 focus:py-2 focus:bg-[var(--theme-primary)] focus:text-white focus:rounded-lg">
            Skip to main content
        </a>
        <Navbar />
        <main id="main-content" className="app-main has-fixed-nav" role="main">
            <Outlet />
        </main>
        <Footer />
        <MobileBottomTabs />
    </div>
);

export default PublicLayout;





