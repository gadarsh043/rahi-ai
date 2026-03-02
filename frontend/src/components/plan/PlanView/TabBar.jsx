import { PLAN_SECTIONS } from '../../../utils/mockTripData';

export default function TabBar({ activeId, onTabClick }) {

  return (
    <nav className="mt-2">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {PLAN_SECTIONS.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabClick(tab.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
                isActive
                  ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white border-brand-500 shadow-brand'
                  : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-brand-500/60 hover:text-brand-500'
              }`}
            >
              <span aria-hidden>{tab.icon}</span>
              <span>{tab.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

