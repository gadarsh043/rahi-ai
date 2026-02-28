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
      className="hidden md:flex w-[60px] flex-col items-center py-4 bg-[var(--surface)] border-r border-[var(--border)] shrink-0"
      style={{ width: 'var(--sidebar-collapsed)' }}
    >
      {navItems.map((item, i) => {
        const isActive = item.to === '/' ? location.pathname === '/' : item.to && location.pathname.startsWith(item.to);
        const content = (
          <span
            className={`
              w-10 h-10 rounded-xl flex items-center justify-center text-xl border transition-colors duration-150
              ${isActive
                ? 'bg-[var(--surface-hover)] border-brand-500/40'
                : 'border-transparent hover:bg-[var(--surface-hover)] hover:border-[var(--border)]'
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
    </aside>
  );
}
