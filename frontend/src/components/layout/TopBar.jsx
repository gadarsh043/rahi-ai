import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import useAuthStore from '../../stores/authStore';

export default function TopBar() {
  const { isDark, toggle } = useTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const name =
    profile?.display_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Traveler';
  const avatar =
    profile?.avatar_url || user?.user_metadata?.avatar_url || null;

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

  return (
    <header
      className="h-[var(--topbar-height)] shrink-0 sticky top-0 z-40 flex items-center justify-between px-4 border-b border-[var(--border)] bg-white/80 dark:bg-[var(--bg)]/80 backdrop-blur-md"
    >
      <Link
        to="/"
        className="text-xl font-bold bg-gradient-to-r from-brand-500 to-brand-600 bg-clip-text text-transparent"
      >
        Rahi AI
      </Link>
      <div className="flex items-center gap-3" ref={menuRef}>
        <button
          type="button"
          onClick={toggle}
          className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-lg hover:bg-[var(--surface-hover)] transition-colors duration-150 ease-out cursor-pointer"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
        {user && (
          <div className="relative">
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
              <div className="absolute right-0 mt-2 w-44 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg py-2 z-50">
                <div className="px-3 pb-2 border-b border-[var(--border)]">
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                    {name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={signOut}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] cursor-pointer"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
