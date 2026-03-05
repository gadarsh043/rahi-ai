import { create } from 'zustand';

function getInitialSidebarExpanded() {
  if (typeof window === 'undefined') return false;
  try {
    const stored = window.localStorage.getItem('sidebarExpanded');
    if (stored === 'true') return true;
    if (stored === 'false') return false;
  } catch {
    // ignore
  }
  // Desktop starts collapsed in this MVP.
  return false;
}

const useUIStore = create((set) => ({
  sidebarExpanded: getInitialSidebarExpanded(),
  showCreditsExhausted: false,
  showNearby: false,

  toggleSidebar: () =>
    set((state) => {
      const next = !state.sidebarExpanded;
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('sidebarExpanded', String(next));
        } catch {
          // ignore
        }
      }
      return { sidebarExpanded: next };
    }),

  setSidebarExpanded: (value) =>
    set(() => {
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('sidebarExpanded', String(value));
        } catch {
          // ignore
        }
      }
      return { sidebarExpanded: value };
    }),

  setShowCreditsExhausted: (value) => set({ showCreditsExhausted: value }),
  setShowNearby: (value) => set({ showNearby: value }),
}));

export default useUIStore;

