import { PLAN_SECTIONS } from '../../../utils/mockTripData';
import useTripStore from '../../../stores/tripStore';
import { trackEvent } from '../../../services/posthog';

export default function TabBar({ activeId, onTabClick }) {
  const trip = useTripStore((s) => s.trip);

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--bg)] sticky top-0 z-[var(--z-sticky)]">
      <div
        data-tour="tab-bar"
        className="flex overflow-x-auto scrollbar-hide gap-1.5 px-3 py-2"
      >
        {PLAN_SECTIONS.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                trackEvent('tab_viewed', {
                  tab: tab.id,
                  trip_id: trip?.id,
                });
                onTabClick(tab.id);
              }}
              className={`flex-shrink-0 flex items-center gap-1 px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors touch-target ${
                isActive
                  ? 'bg-brand-500 text-white'
                  : 'bg-[var(--surface)] text-[var(--text-secondary)]'
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

