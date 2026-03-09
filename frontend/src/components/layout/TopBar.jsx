import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import useAuthStore from '../../stores/authStore';
import useUIStore from '../../stores/uiStore';
import useTourStore from '../../stores/tourStore';
import { getPageFeatures, getPageSteps } from '../onboarding/tourRegistry';

export default function TopBar() {
  const { isDark, toggle } = useTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const showTourMenu = useTourStore((s) => s.showTourMenu);
  const clearPageSeen = useTourStore((s) => s.clearPageSeen);
  const startFullFlow = useTourStore((s) => s.startFullFlow);
  const startTour = useTourStore((s) => s.startTour);
  const sidebarExpanded = useUIStore((s) => s.sidebarExpanded);
  const setSidebarExpanded = useUIStore((s) => s.setSidebarExpanded);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isPlanPage = location.pathname.startsWith('/plan') || location.pathname.startsWith('/trip');

  const name =
    profile?.display_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Traveler';
  const avatar =
    profile?.avatar_url || user?.user_metadata?.avatar_url || null;
  const email = user?.email || '';

  const credits = profile?.trips_remaining ?? profile?.tripsRemaining ?? 0;
  const quizCompleted = Boolean(profile?.quiz_completed ?? profile?.quizCompleted);

  const menuItems = useMemo(
    () => [
      { icon: '🎓', label: 'Replay Tour', dataTour: 'replay-tour', action: () => {
        // Start full tour from home (home → form → plan)
        navigate('/');
        setTimeout(() => {
          startFullFlow();
          startTour('home', getPageSteps('home'));
        }, 800);
      } },
      { icon: '⚙️', label: 'Settings', action: () => navigate('/settings') },
      {
        icon: '🎯',
        label: 'Travel Quiz',
        action: () => navigate('/settings#quiz'),
        badge: quizCompleted ? '✓' : null,
      },
      {
        icon: '📝',
        label: 'Give Feedback',
        action: () => {
          window.open(
            'mailto:adarsh@rahify.com?subject=Rahify%20Feedback',
            '_blank',
          );
        },
      },
      {
        icon: '📄',
        label: 'Privacy & Terms',
        action: () => navigate('/privacy'),
      },
    ],
    [navigate, quizCompleted, startFullFlow, startTour, location.pathname],
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    // Close dropdown on navigation
    setMenuOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, location.hash]);

  const avatarButton = user ? (
    <div className="relative" ref={menuRef} data-tour="profile-menu">
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
      >
        {avatar ? (
          <img
            src={avatar}
            alt=""
            className="w-8 h-8 rounded-full object-cover border border-[var(--border)]"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold text-sm">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="hidden sm:inline text-xs text-[var(--text-secondary)]">
          {name}
        </span>
      </button>
      {menuOpen && (
        <div className="absolute right-0 mt-2 w-[min(92vw,320px)] bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl py-2 z-[var(--z-topbar)] overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
              👤 {name}
            </p>
            {email && (
              <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                {email}
              </p>
            )}
          </div>

          {/* Credits */}
          <div className="px-4 py-2 border-b border-[var(--border)]">
            <span className="text-xs text-[var(--text-muted)]">
              {credits > 0
                ? `${credits} trip${credits !== 1 ? 's' : ''} remaining`
                : 'No trips remaining'}
            </span>
            {credits <= 0 && (
              <a
                href="mailto:adarsh@rahify.com?subject=Rahify — Request More Credits&body=Hi! I've used my free trips on Rahify and would love more credits."
                className="block text-xs text-brand-500 hover:text-brand-600 mt-1 font-medium"
                onClick={() => setMenuOpen(false)}
              >
                Request more credits
              </a>
            )}
          </div>

          {/* Menu items */}
          <div className="py-1">
            {menuItems.map((item) => (
              <button
                key={item.label}
                type="button"
                data-tour={item.dataTour || undefined}
                onClick={() => {
                  setMenuOpen(false);
                  item.action();
                }}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[var(--surface-hover)] transition-colors cursor-pointer min-h-11"
              >
                <span className="flex items-center gap-3">
                  <span className="w-5 text-base">{item.icon}</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {item.label}
                  </span>
                </span>
                {item.badge && (
                  <span className="text-xs font-semibold text-emerald-500">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="border-t border-[var(--border)] pt-1">
            <button
              type="button"
              onClick={async () => {
                setMenuOpen(false);
                await signOut();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--surface-hover)] transition-colors cursor-pointer min-h-11"
            >
              <span className="w-5 text-base">🚪</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                Log Out
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  ) : (
    <Link
      to="/login"
      className="text-sm font-semibold text-brand-500 hover:text-brand-600 px-3 py-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors"
    >
      Sign In
    </Link>
  );

  return (
    <header className="shrink-0 sticky top-0 z-[var(--z-topbar)] border-b border-[var(--border)] bg-white dark:bg-[var(--bg)] dark:bg-opacity-80 dark:backdrop-blur-md">
      {/* Mobile: slim topbar */}
      <div className="flex lg:hidden items-center justify-between w-full px-3 h-11">
        <div className="flex items-center gap-2">
          {isPlanPage && user && (
            <button
              type="button"
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-sm text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              aria-label={sidebarExpanded ? 'Close sidebar' : 'Open sidebar'}
            >
              ☰
            </button>
          )}
          <Link
            to="/"
            className="text-lg font-bold bg-gradient-to-r from-brand-500 to-brand-600 bg-clip-text text-transparent"
          >
            Rahify
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {avatarButton}
        </div>
      </div>

      {/* Desktop: full topbar */}
      <div className="hidden lg:flex items-center justify-between w-full px-4 h-[var(--topbar-height)]">
        <div className="flex items-center gap-2.5">
          {isPlanPage && user && (
            <button
              type="button"
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-sm text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              aria-label={sidebarExpanded ? 'Close sidebar' : 'Open sidebar'}
            >
              ☰
            </button>
          )}
          <Link
            to="/"
            className="text-xl font-bold bg-gradient-to-r from-brand-500 to-brand-600 bg-clip-text text-transparent"
          >
            Rahify
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggle}
            className="hidden lg:flex w-9 h-9 rounded-full border border-[var(--border)] items-center justify-center text-lg hover:bg-[var(--surface-hover)] transition-colors duration-150 ease-out cursor-pointer"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          {avatarButton}
        </div>
      </div>
    </header>
  );
}
