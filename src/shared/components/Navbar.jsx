import { useEffect, useState, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FiBell,
  FiChevronDown,
  FiLogOut,
  FiMenu,
  FiMessageSquare,
  FiSettings,
  FiShield,
  FiUser,
  FiX,
  FiCompass,
  FiUsers,
  FiLayers,
  FiSearch,
  FiGrid,
  FiMessageCircle,
  FiMap,
  FiImage,
  FiCheckCircle,
} from "react-icons/fi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useAuthActions as useAuth, useCurrentUser } from "@/services/mutators/useAuthActions";
import authService from "@/services/features/authService";
import { DARK_HERO_THEMES, useTheme } from "@/app/providers/ThemeProvider";
import profileService from "@/services/features/profileService";
import GzsLogo from "./GzsLogo";

const NOTIF_ICONS = {
  friend_request: FiUser,
  comment: FiMessageCircle,
  like: FiBell,
  tournament_update: FiBell,
  achievement: FiCheckCircle,
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const NAV_ITEMS = [
  { path: "/", label: "Home" },
  {
    path: "/games",
    label: "Games",
    dropdown: [
      { path: "/games", label: "Games Hub", icon: FiGrid },
      { path: "/games/browse", label: "Browse All", icon: FiLayers },
      { path: "/discovery", label: "Discover", icon: FiCompass },
    ],
  },
  { path: "/blog", label: "Blogs" },
  { path: "/tournaments", label: "Tournaments" },
  {
    path: "/community",
    label: "Community",
    dropdown: [
      { path: "/community", label: "Community Home", icon: FiUsers },
      { path: "/messages", label: "Messages", icon: FiMessageCircle },
      { path: "/community/lfg", label: "LFG Board", icon: FiSearch },
      { path: "/community/showcase", label: "Showcase", icon: FiImage },
    ],
  },
  { path: "/profile", label: "Profile", authOnly: true },
  { path: "/about", label: "About" },
  { path: "/contact", label: "Contact" },
  { path: "/admin", label: "Admin", icon: FiShield, authOnly: true, adminOnly: true },
];

const Navbar = () => {
  const { logout } = useAuth();
  const { data: currentUser } = useCurrentUser();
  const isAuthenticated = authService.isAuthenticated();
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownTimeout = useRef(null);
  const notifRef = useRef(null);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: profileService.getNotifications,
    refetchInterval: 30000,
    enabled: isAuthenticated
  });
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = async () => {
    await profileService.markAllNotificationsRead();
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const [prevPath, setPrevPath] = useState(location.pathname);

  if (location.pathname !== prevPath) {
    setPrevPath(location.pathname);
    setMenuOpen(false);
    setProfileOpen(false);
    setActiveDropdown(null);
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setProfileOpen(false);
        setActiveDropdown(null);
        setNotifOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isDarkHero = DARK_HERO_THEMES.includes(currentTheme);
  const navbarState = scrolled
    ? "is-scrolled"
    : isAuthenticated
      ? "is-auth"
      : isDarkHero
        ? "is-transparent-dark"
        : "is-transparent-light";

  const logoVariant = isDarkHero && !scrolled && !isAuthenticated ? "light" : "primary";

  const go = (path) => {
    navigate(path);
    setMenuOpen(false);
    setProfileOpen(false);
    setActiveDropdown(null);
    setNotifOpen(false);
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setProfileOpen(false);
  };

  const handleMouseEnter = (label) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setActiveDropdown(label);
  };

  const handleMouseLeave = () => {
    dropdownTimeout.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  // Logic for reordering and filtering mobile links
  const mobileExplore = NAV_ITEMS.filter((i) => !i.authOnly && !["About", "Contact"].includes(i.label));
  const mobileMore = NAV_ITEMS.filter((i) => ["About", "Contact"].includes(i.label));

  // Logic for desktop overflow (limit to 7 main items)
  const visibleNavItems = NAV_ITEMS.filter(item => {
    if (item.authOnly && !isAuthenticated) return false;
    if (item.adminOnly && currentUser?.role !== 'admin' && !currentUser?.is_staff) return false;
    return true;
  });

  const mainNavItems = visibleNavItems.slice(0, 7);
  const moreNavItems = visibleNavItems.slice(7);

  const renderNavLink = (item, isDropdown = false) => {
    const hasDropdown = item.dropdown && !isDropdown;
    const isActive = location.pathname === item.path || (item.dropdown?.some(d => location.pathname === d.path));

    return (
      <div
        key={item.path}
        className="relative flex items-center"
        onMouseEnter={() => hasDropdown && handleMouseEnter(item.label)}
        onMouseLeave={() => hasDropdown && handleMouseLeave()}
      >
        <NavLink
          to={item.path}
          end={item.path === "/"}
          className={({ isActive: linkActive }) => 
            `gzs-nav-link ${linkActive || (hasDropdown && isActive) ? "active" : ""} focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]`
          }
          aria-haspopup={hasDropdown ? "true" : undefined}
          aria-expanded={hasDropdown ? activeDropdown === item.label : undefined}
        >
          {item.icon && <item.icon size={14} />}
          <span>{item.label}</span>
          {hasDropdown && <FiChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === item.label ? "rotate-180" : ""}`} />}
          {isActive && <motion.div layoutId="nav-active" className="gzs-nav-active-dot" />}
        </NavLink>

        <AnimatePresence>
          {hasDropdown && activeDropdown === item.label && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="gzs-nav-dropdown w-64"
              role="menu"
            >
              <div className="p-2 space-y-1">
                {item.dropdown.map((child, idx) => (
                  <motion.div
                    key={child.path}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    role="none"
                  >
                    <NavLink to={child.path} className="gzs-nav-dropdown-item" role="menuitem">
                      {child.icon && <child.icon size={16} />}
                      <span>{child.label}</span>
                    </NavLink>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <>
      <nav className={`gzs-navbar ${navbarState}`} role="navigation" aria-label="Main Navigation">
        <div className="gzs-navbar__inner">
          <button
            type="button"
            onClick={() => go(isAuthenticated ? "/community" : "/")}
            className="gzs-navbar__brand focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
            aria-label="GzoneSphere Home"
          >
            <GzsLogo variant={logoVariant} size={32} showText />
          </button>

          <div className="gzs-navbar__links hidden lg:flex">
            {mainNavItems.map(item => renderNavLink(item))}
            
            {moreNavItems.length > 0 && (
              <div 
                className="relative flex items-center"
                onMouseEnter={() => handleMouseEnter("More")}
                onMouseLeave={() => handleMouseLeave()}
              >
                <button 
                  className={`gzs-nav-link ${activeDropdown === "More" ? "active" : ""} focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]`}
                  aria-expanded={activeDropdown === "More"}
                  aria-haspopup="true"
                >
                  <span>More</span>
                  <FiChevronDown size={14} />
                </button>
                <AnimatePresence>
                  {activeDropdown === "More" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="gzs-nav-dropdown w-48"
                      role="menu"
                    >
                      <div className="p-2 space-y-1">
                        {moreNavItems.map((item, idx) => (
                          <motion.div
                            key={item.path}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            role="none"
                          >
                            <NavLink to={item.path} className="gzs-nav-dropdown-item" role="menuitem">
                              <span>{item.label}</span>
                            </NavLink>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="gzs-navbar__actions">
            {!isAuthenticated ? (
              <div className="hidden lg:flex items-center gap-3">
                <button 
                  type="button" 
                  onClick={() => go("/signup")} 
                  className="gzs-nav-signup focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
                  aria-label="Create an account"
                >
                  Sign Up
                </button>
                <button 
                  type="button" 
                  onClick={() => go("/login")} 
                  className="gzs-nav-login focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
                  aria-label="Log in to your account"
                >
                  Login
                </button>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => go("/messages")} 
                  className="gzs-nav-icon focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]" 
                  aria-label="Open Messages"
                >
                  <FiMessageSquare size={16} />
                </button>
                <div className="relative" ref={notifRef}>
                  <button
                    type="button"
                    onClick={() => setNotifOpen(o => !o)}
                    className="gzs-nav-icon focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
                    aria-label="Open Notifications"
                    aria-expanded={notifOpen}
                  >
                    <FiBell size={16} />
                    {unreadCount > 0 && (
                      <span className="gzs-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="gzs-notif-dropdown">
                      <div className="gzs-notif-dropdown__header">
                        <span className="gzs-notif-dropdown__title">Notifications</span>
                        {unreadCount > 0 && (
                          <button className="gzs-notif-dropdown__mark-read" onClick={handleMarkAllRead}>
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="gzs-notif-dropdown__list">
                        {notifications.slice(0, 5).length > 0 ? (
                          notifications.slice(0, 5).map(n => {
                            const Icon = NOTIF_ICONS[n.type] || FiBell;
                            return (
                              <div
                                key={n.id}
                                className={`gzs-notif-item${!n.is_read ? ' gzs-notif-item--unread' : ''}`}
                              >
                                <span className="gzs-notif-item__icon"><Icon size={14} /></span>
                                <div className="gzs-notif-item__content">
                                  <p className="gzs-notif-item__title">{n.title}</p>
                                  <p className="gzs-notif-item__body">{n.body}</p>
                                  <p className="gzs-notif-item__time">{timeAgo(n.created_at)}</p>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="gzs-notif-dropdown__empty">No notifications yet</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileOpen((open) => !open)}
                    className="gzs-nav-profile-toggle focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
                    aria-label="User account menu"
                    aria-expanded={profileOpen}
                    aria-haspopup="true"
                  >
                    <span className="gzs-nav-avatar">
                      {currentUser?.avatar_url ? (
                        <img src={currentUser.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        currentUser?.username?.[0]?.toUpperCase() ?? "U"
                      )}
                    </span>
                    <span className="hidden xl:block max-w-[9rem] truncate text-sm font-semibold">
                      {currentUser?.username ?? "User"}
                    </span>
                    <FiChevronDown size={14} className="opacity-50" />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="gzs-nav-dropdown right-0 w-64"
                        role="menu"
                      >
                        <div className="p-4 border-b border-[var(--theme-border)]">
                          <p className="text-sm font-bold text-[var(--theme-text)] truncate">{currentUser?.username}</p>
                          <p className="text-xs text-[var(--theme-text-muted)] truncate">{currentUser?.email}</p>
                        </div>
                        <div className="p-2 space-y-1">
                          <button type="button" onClick={() => go("/profile")} className="gzs-nav-dropdown-item w-full" role="menuitem">
                            <FiUser size={14} /> My Profile
                          </button>
                          <button type="button" onClick={() => go("/settings")} className="gzs-nav-dropdown-item w-full" role="menuitem">
                            <FiSettings size={14} /> Settings
                          </button>
                          {(currentUser?.role === 'admin' || currentUser?.is_staff) && (
                            <button type="button" onClick={() => go("/admin")} className="gzs-nav-dropdown-item w-full text-[var(--theme-warning)]" role="menuitem">
                              <FiShield size={14} /> Admin Panel
                            </button>
                          )}
                          <div className="h-px bg-[var(--theme-border)] my-1" />
                          <button type="button" onClick={handleLogout} className="gzs-nav-dropdown-item w-full text-[var(--theme-danger)]" role="menuitem">
                            <FiLogOut size={14} /> Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="gzs-nav-mobile-toggle lg:hidden focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
              aria-label="Open mobile navigation menu"
              aria-expanded={menuOpen}
            >
              <FiMenu size={20} />
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[var(--theme-bg-overlay)] backdrop-blur-sm lg:hidden"
            onClick={() => setMenuOpen(false)}
          >
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-[var(--theme-bg)] shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Mobile Navigation Menu"
            >
              <div className="flex items-center justify-between p-6 border-b border-[var(--theme-border)]">
                <GzsLogo variant="primary" size={28} showText />
                <button 
                  onClick={() => setMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-[var(--theme-bg-hover)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
                  aria-label="Close mobile navigation"
                >
                  <FiX size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <section>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--theme-text-muted)] mb-4 block">Explore</label>
                  <div className="space-y-1">
                    {mobileExplore.map(item => (
                      <div key={item.path}>
                        <button
                          onClick={() => !item.dropdown && go(item.path)}
                          className="flex w-full items-center justify-between p-3 rounded-xl hover:bg-[var(--theme-bg-hover)] transition-colors text-[var(--theme-text)] font-medium focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
                          aria-expanded={item.dropdown ? activeDropdown === item.label : undefined}
                        >
                          <span className="flex items-center gap-3">
                            {item.icon && <item.icon size={18} />}
                            {item.label}
                          </span>
                          {item.dropdown && <FiChevronDown size={16} />}
                        </button>
                        {item.dropdown && (
                          <div className="pl-11 pr-4 py-1 space-y-1">
                            {item.dropdown.map(child => (
                              <button
                                key={child.path}
                                onClick={() => go(child.path)}
                                className="flex w-full items-center gap-3 p-2 rounded-lg text-sm text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
                              >
                                {child.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--theme-text-muted)] mb-4 block">Account</label>
                  <div className="space-y-1">
                    {isAuthenticated ? (
                      <>
                        <button onClick={() => go("/profile")} className="flex w-full items-center gap-3 p-3 rounded-xl hover:bg-[var(--theme-bg-hover)] transition-colors text-[var(--theme-text)] font-medium focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]">
                          <FiUser size={18} /> My Profile
                        </button>
                        <button onClick={() => go("/messages")} className="flex w-full items-center gap-3 p-3 rounded-xl hover:bg-[var(--theme-bg-hover)] transition-colors text-[var(--theme-text)] font-medium focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]">
                          <FiMessageSquare size={18} /> Messages
                        </button>
                        <button onClick={() => go("/settings")} className="flex w-full items-center gap-3 p-3 rounded-xl hover:bg-[var(--theme-bg-hover)] transition-colors text-[var(--theme-text)] font-medium focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]">
                          <FiSettings size={18} /> Settings
                        </button>
                      </>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 p-1">
                        <button onClick={() => go("/login")} className="gzs-nav-login justify-center focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]" aria-label="Log in">Login</button>
                        <button onClick={() => go("/signup")} className="gzs-nav-signup justify-center focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]" aria-label="Sign up">Sign Up</button>
                      </div>
                    )}
                  </div>
                </section>

                <section>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--theme-text-muted)] mb-4 block">More</label>
                  <div className="space-y-1">
                    {mobileMore.map(item => (
                      <button
                        key={item.path}
                        onClick={() => go(item.path)}
                        className="flex w-full items-center gap-3 p-3 rounded-xl hover:bg-[var(--theme-bg-hover)] transition-colors text-[var(--theme-text)] font-medium focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
                      >
                        {item.label}
                      </button>
                    ))}
                    {isAuthenticated && (
                      <button onClick={handleLogout} className="flex w-full items-center gap-3 p-3 rounded-xl hover:bg-[var(--theme-danger-muted)] text-[var(--theme-danger)] transition-colors font-medium focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]" aria-label="Sign out">
                        <FiLogOut size={18} /> Sign Out
                      </button>
                    )}
                  </div>
                </section>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
