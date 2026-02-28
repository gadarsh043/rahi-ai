import { Link } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';

export default function TopBar() {
  const { isDark, toggle } = useTheme();

  return (
    <header
      className="h-[var(--topbar-height)] shrink-0 sticky top-0 z-10 flex items-center justify-between px-4 bg-[var(--bg)] border-b border-[var(--border)]"
    >
      <Link
        to="/"
        className="text-xl font-bold bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent"
      >
        Rahi AI
      </Link>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-lg hover:bg-[var(--surface-hover)] transition-colors duration-150 ease-out"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
        <div
          className="w-9 h-9 rounded-full bg-gradient-to-r from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold text-sm"
          aria-hidden
        >
          R
        </div>
      </div>
    </header>
  );
}
