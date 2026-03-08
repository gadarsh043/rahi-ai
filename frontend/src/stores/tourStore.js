import { create } from 'zustand';

const COOKIE_KEY = 'rahify-tours';
const STORAGE_KEY = 'rahify-tours';

/* -- Cookie helpers -- */

function readCookie() {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]*)`));
    return match ? JSON.parse(decodeURIComponent(match[1])) : {};
  } catch {
    return {};
  }
}

function writeCookie(data) {
  try {
    const json = encodeURIComponent(JSON.stringify(data));
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${COOKIE_KEY}=${json}; path=/; expires=${expires}; SameSite=Lax`;
  } catch {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* best-effort */ }
  }
}

function readLocal() {
  try {
    const cookieData = readCookie();
    if (Object.keys(cookieData).length > 0) return cookieData;
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

/* -- Store -- */

const saved = readLocal();

const useTourStore = create((set, get) => ({
  toursSeen: saved,
  activeTour: null,
  showPrompt: null,
  showMenu: null,
  fullFlow: false,

  initFromProfile: (profile) => {
    const local = readLocal();
    const supabaseTours = profile?.tours_seen || {};
    const merged = { ...local, ...supabaseTours };
    set({ toursSeen: merged });
    writeCookie(merged);
  },

  hasSeenFeature: (featureId) => {
    return Boolean(get().toursSeen[featureId]);
  },

  getUnseenFeatures: (pageFeatures) => {
    const seen = get().toursSeen;
    return pageFeatures.filter((f) => !seen[f.id]);
  },

  markSeen: (featureIds, supabaseUpdate) => {
    const now = new Date().toISOString().slice(0, 10);
    set((s) => {
      const next = { ...s.toursSeen };
      for (const id of featureIds) {
        if (!next[id]) next[id] = now;
      }
      writeCookie(next);
      if (supabaseUpdate) {
        supabaseUpdate(next).catch(() => {});
      }
      return { toursSeen: next };
    });
  },

  markPageSeen: (pageFeatures, supabaseUpdate) => {
    get().markSeen(
      pageFeatures.map((f) => f.id),
      supabaseUpdate,
    );
  },

  clearPageSeen: (pageFeatures) => {
    set((s) => {
      const next = { ...s.toursSeen };
      for (const f of pageFeatures) {
        delete next[f.id];
      }
      writeCookie(next);
      return { toursSeen: next };
    });
  },

  startTour: (page, steps) => {
    set({
      activeTour: { page, steps, currentIndex: 0 },
      showPrompt: null,
      showMenu: null,
    });
  },

  startFullFlow: () => {
    set({ fullFlow: true });
  },

  endFullFlow: () => {
    set({ fullFlow: false });
  },

  nextStep: () => {
    set((s) => {
      if (!s.activeTour) return s;
      const next = s.activeTour.currentIndex + 1;
      if (next >= s.activeTour.steps.length) {
        return { activeTour: null };
      }
      return {
        activeTour: { ...s.activeTour, currentIndex: next },
      };
    });
  },

  prevStep: () => {
    set((s) => {
      if (!s.activeTour) return s;
      const prev = s.activeTour.currentIndex - 1;
      if (prev < 0) return s;
      return {
        activeTour: { ...s.activeTour, currentIndex: prev },
      };
    });
  },

  endTour: () => {
    set({ activeTour: null });
  },

  showTourPrompt: (page, isNew = false) => {
    set({ showPrompt: { page, isNew } });
  },
  hideTourPrompt: () => {
    set({ showPrompt: null });
  },

  showTourMenu: (page) => {
    set({ showMenu: page, showPrompt: null });
  },
  hideTourMenu: () => {
    set({ showMenu: null });
  },
}));

export default useTourStore;
