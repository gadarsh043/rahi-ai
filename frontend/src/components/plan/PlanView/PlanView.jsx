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
      <div className="flex h-[calc(100vh-56px)]">
        {/* Content Panel */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden relative">
          <div className="px-6 pt-6 pb-2">
            <PlanHeader />
            <TabBar activeId={activeId} onTabClick={handleTabClick} />
          </div>
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto scroll-smooth"
          >
            <RebuildBanner />
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
          <ActionBar />
        </div>

        {/* Map Panel */}
        {!letsPickOpen && !chatOpen && (
          <div className="hidden lg:block w-[45%] bg-[var(--surface)] border-l border-[var(--border)]">
            <MapPanel />
          </div>
        )}
      </div>

      {/* Mobile map toggle button */}
      {!letsPickOpen && !chatOpen && (
        <button
          type="button"
          onClick={toggleMap}
          className="fixed bottom-24 right-4 lg:hidden z-50 w-14 h-14 rounded-full bg-brand-500 text-white shadow-lg flex items-center justify-center hover:bg-brand-600 active:scale-95 transition-transform"
        >
          🗺️
        </button>
      )}

      {/* Mobile full-screen map overlay */}
      {showMap && !letsPickOpen && !chatOpen && (
        <div className="fixed inset-0 z-40 lg:hidden bg-[var(--bg)]">
          <div className="absolute top-3 right-3 z-[1001]">
            <button
              type="button"
              onClick={toggleMap}
              className="px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-secondary)] shadow-sm"
            >
              Close map
            </button>
          </div>
          <MapPanel />
        </div>
      )}

      <ChatDrawer />
      <LetsPickPopup />
    </>
  );
}

