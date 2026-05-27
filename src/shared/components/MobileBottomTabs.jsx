import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiHome, FiGrid, FiCompass, FiUsers, FiUser } from 'react-icons/fi';

const TABS = [
  { id: 'home',      label: 'Home',      path: '/',           icon: FiHome },
  { id: 'games',     label: 'Games',     path: '/games',      icon: FiGrid },
  { id: 'explore',   label: 'Explore',   path: '/discovery',  icon: FiCompass },
  { id: 'community', label: 'Community', path: '/community',  icon: FiUsers },
  { id: 'profile',   label: 'Profile',   path: '/profile',    icon: FiUser },
];

const SHOW_ON_PAGES = ['/', '/games', '/blog', '/tournaments', '/community', '/profile'];

export default function MobileBottomTabs() {
  const { pathname } = useLocation();

  // Simple check for visibility
  const shouldShow = SHOW_ON_PAGES.some(page => 
    pathname === page || pathname.startsWith(`${page}/`)
  );

  if (!shouldShow) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] border-t border-[var(--theme-border)] bg-[var(--theme-bg)] pb-[safe-area-inset-bottom] lg:hidden">
      <div className="flex h-16 items-center justify-around">
        {TABS.map(({ id, label, path, icon: Icon }) => (
          <NavLink
            key={id}
            to={path}
            className={({ isActive }) => `
              flex flex-col items-center justify-center gap-1 transition-all
              ${isActive ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-text-muted)]'}
            `}
          >
            <Icon size={20} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
