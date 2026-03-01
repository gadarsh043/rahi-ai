import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/', icon: '🏠', label: 'Home' },
  { to: '/new', icon: '➕', label: 'New trip' },
  { icon: '💬', label: 'Chat' },
  { icon: '📋', label: 'Plans' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside
      className="hidden md:flex flex-col items-center py-4 border-r border-[var(--border)] shrink-0 bg-white dark:bg-[var(--surface)]"
      style={{ width: 'var(--sidebar-collapsed)' }}
    >
      {navItems.map((item, i) => {
        const isActive = item.to === '/' ? location.pathname === '/' : item.to && location.pathname.startsWith(item.to);
        const content = (
          <span
            className={`
              w-10 h-10 rounded-full flex items-center justify-center text-xl transition-colors duration-150
              ${isActive
                ? 'bg-brand-500 text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }
            `}
            title={item.label}
          >
            {item.icon}
          </span>
        );
        return (
          <div key={i} className="mb-2">
            {item.to ? (
              <Link to={item.to}>{content}</Link>
            ) : (
              <button type="button">{content}</button>
            )}
          </div>
        );
      })}
      <div className="mt-4">
        <a
          href="/plan/mock"
          className="text-xs text-[var(--text-muted)] hover:text-brand-500"
        >
          [Dev: Open Mock Trip]
        </a>
      </div>
    </aside>
  );
}
