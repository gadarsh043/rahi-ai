import { useEffect, useMemo, useState } from 'react';
import useTripStore from '../../../stores/tripStore';
import { PLAN_SECTIONS } from '../../../utils/mockTripData';
import useScrollSpy from '../../../hooks/useScrollSpy';
import PlanHeader from './PlanHeader';
import TabBar from './TabBar';
import LazySection from '../LazySection/LazySection';
import MapPanel from '../MapPanel/MapPanel';
import ActionBar from './ActionBar';
import LetsPickPopup from '../LetsPickPopup/LetsPickPopup';
import ChatDrawer from '../ChatDrawer/ChatDrawer';
import RebuildBanner from '../RebuildBanner/RebuildBanner';
import SharedBanner from '../SharedBanner/SharedBanner';
import EatTab from '../tabs/EatTab';
import StayTab from '../tabs/StayTab';
import PlacesTab from '../tabs/PlacesTab';
import FlightTab from '../tabs/FlightTab';
import CostsTab from '../tabs/CostsTab';
import TripTab from '../tabs/TripTab';
import NextTab from '../tabs/NextTab';

const sectionComponents = {
  eat: EatTab,
  stay: StayTab,
  go: PlacesTab,
  trip: TripTab,
  flight: FlightTab,
  costs: CostsTab,
  next: NextTab,
};

export default function PlanView() {
  const showMap = useTripStore((s) => s.showMap);
  const toggleMap = useTripStore((s) => s.toggleMap);
  const letsPickOpen = useTripStore((s) => s.letsPickOpen);
  const chatOpen = useTripStore((s) => s.chatOpen);
  const setActiveSectionId = useTripStore((s) => s.setActiveSectionId);
  const mode = useTripStore((s) => s.mode);
  const trip = useTripStore((s) => s.trip);
  const isRebuilding = useTripStore((s) => s.isRebuilding);
  const rebuildStatus = useTripStore((s) => s.rebuildStatus);

  const sectionIds = PLAN_SECTIONS.map((s) => s.id);
  const { activeId, scrollToSection, scrollContainerRef } = useScrollSpy(
    sectionIds
  );

  const [forcedVisible, setForcedVisible] = useState(() => new Set());

  const forcedVisibleLookup = useMemo(() => forcedVisible, [forcedVisible]);

  const handleTabClick = (id) => {
    const targetIndex = PLAN_SECTIONS.findIndex((s) => s.id === id);
    if (targetIndex >= 0) {
      setForcedVisible((prev) => {
        const next = new Set(prev);
        for (let i = 0; i <= targetIndex; i += 1) {
          next.add(PLAN_SECTIONS[i].id);
        }
        return next;
      });
    }

    // Scroll on next paint so any forced sections can mount first.
    requestAnimationFrame(() => scrollToSection(id));
    // One more nudge after layout settles (lazy sections can expand heights).
    setTimeout(() => scrollToSection(id), 150);
  };

  useEffect(() => {
    setActiveSectionId(activeId);
  }, [activeId, setActiveSectionId]);

  return (
    <>
      <div
        className={`flex flex-col lg:flex-row h-[calc(100dvh-var(--topbar-height))] ${
          chatOpen ? 'lg:mr-[400px]' : ''
        }`}
      >
        {/* Content Panel — full width on mobile, left column on desktop */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden relative lg:w-[55%]">
          <div className="px-3 pt-3 pb-2 lg:px-6 lg:pt-6">
            {mode === 'shared' && (
              <SharedBanner ownerName={trip?.owner_name} />
            )}
            <PlanHeader />
          </div>
          <TabBar activeId={activeId} onTabClick={handleTabClick} />
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto scroll-smooth overscroll-contain momentum-scroll pb-32 lg:pb-4"
          >
            {mode !== 'shared' && isRebuilding && (
              <div className="sticky top-0 z-20 bg-[var(--surface)]/90 backdrop-blur-sm border-b border-brand-500/20 px-4 py-3 flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-[var(--text-primary)]">
                  {rebuildStatus || 'Rebuilding your itinerary...'}
                </span>
              </div>
            )}
            {mode !== 'shared' && <RebuildBanner />}
            {PLAN_SECTIONS.map((section) => {
              const SectionComponent = sectionComponents[section.id];
              return (
                <LazySection
                  key={section.id}
                  id={section.id}
                  title={section.label}
                  icon={section.icon}
                  forceVisible={forcedVisibleLookup.has(section.id)}
                >
                  <SectionComponent />
                </LazySection>
              );
            })}
            <div className="h-[50vh]" />
          </div>
          {mode !== 'shared' && <ActionBar />}
        </div>

        {/* Map Panel — hidden on mobile, side panel on desktop */}
        {!letsPickOpen && !chatOpen && (
          <div className="hidden lg:block lg:w-[45%] lg:h-full lg:sticky lg:top-0 bg-[var(--surface)] border-l border-[var(--border)]">
            <MapPanel trip={trip} places={trip?.places} activeTab={activeId} />
          </div>
        )}
      </div>

      {/* Mobile map toggle button (floating above action bar + bottom nav) */}
      {!letsPickOpen && !chatOpen && (
        <button
          type="button"
          onClick={toggleMap}
          className="fixed bottom-32 right-4 lg:hidden z-50 w-14 h-14 rounded-full bg-brand-500 text-white shadow-lg flex items-center justify-center hover:bg-brand-600 active:scale-95 transition-transform"
        >
          🗺️
        </button>
      )}

      {/* Mobile full-screen map overlay */}
      {showMap && !letsPickOpen && !chatOpen && (
        <div className="fixed inset-0 z-[200] lg:hidden bg-[var(--bg)] flex flex-col">
          <div className="absolute top-3 right-3 z-[1001]">
            <button
              type="button"
              onClick={toggleMap}
              className="px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-secondary)] shadow-sm"
              >
              Close map
            </button>
          </div>
          <div className="flex-1">
            <MapPanel trip={trip} places={trip?.places} activeTab={activeId} />
          </div>
        </div>
      )}

      {mode !== 'shared' && <ChatDrawer />}
      {mode !== 'shared' && <LetsPickPopup />}
    </>
  );
}

