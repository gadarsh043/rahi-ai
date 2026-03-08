import { useLocation, useNavigate } from 'react-router-dom';
import useUIStore from '../../../stores/uiStore';
import { trackEvent } from '../../../services/posthog';

const NAV_ITEMS = [
  { key: 'home', icon: '🏠', activeIcon: '🏠', label: 'Home', path: '/' },
  { key: 'rightnow', icon: '🔍', activeIcon: '🔍', label: 'Right Now', action: 'rightnow' },
  { key: 'new', icon: '📍', activeIcon: '📍', label: 'New Trip', path: '/new' },
  { key: 'plans', icon: '📋', activeIcon: '📋', label: 'My Plans', action: 'plans' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const setShowNearby = useUIStore((s) => s.setShowNearby);

  // Don't show on auth pages
  if (location.pathname.startsWith('/login') || location.pathname.startsWith('/auth')) {
    return null;
  }

  const handleTap = (item) => {
    if (item.action === 'rightnow') {
      setShowNearby(true);
      trackEvent('right_now_opened', {});
    } else if (item.action === 'plans') {
      // For now, navigate home where sidebar / plans live
      navigate('/');
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const isActive = (item) => {
    if (item.path === '/' && location.pathname === '/') return true;
    if (item.path === '/new' && location.pathname === '/new') return true;
    return false;
  };

  return (
    <nav
      data-tour="nav"
      className="fixed bottom-0 left-0 right-0 z-[var(--z-sticky)] flex items-center justify-around
                 bg-white dark:bg-[var(--bg)] border-t border-[var(--border)]
                 h-14 pb-[env(safe-area-inset-bottom)]
                 lg:hidden"
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(item);
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => handleTap(item)}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full
                       min-w-[44px] min-h-[44px] transition-colors
                       ${active
                         ? 'text-brand-500'
                         : 'text-[var(--text-muted)] active:text-[var(--text-primary)]'
                       }`}
          >
            <span className="text-lg leading-none">
              {active ? item.activeIcon : item.icon}
            </span>
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

