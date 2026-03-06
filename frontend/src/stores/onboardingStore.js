import { create } from 'zustand';

const STORAGE_KEY = 'rahify-onboarding';

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function writeLocal(patch) {
  try {
    const current = readLocal();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...patch }));
  } catch {
    // best-effort
  }
}

const saved = readLocal();

export const useOnboardingStore = create((set) => ({
  // Tour completion status — seed from localStorage
  welcomeTourDone: Boolean(saved.welcomeTourDone),
  planTourDone: Boolean(saved.planTourDone),

  // One-off feature tips (first-use tooltips)
  featureTipsSeen: saved.featureTipsSeen || {},

  // Current tour state
  activeTour: null, // 'welcome' | 'plan' | null
  setActiveTour: (tour) => set({ activeTour: tour }),

  // Init from profile (merge — mark done if EITHER localStorage or profile says so)
  initFromProfile: (profile) => {
    const local = readLocal();
    const quizData = profile?.quiz_data || profile?.quizData || {};
    const welcomeDone = Boolean(
      local.welcomeTourDone ||
      profile?.onboarding_completed ||
      profile?.onboardingCompleted,
    );
    const planDone = Boolean(
      local.planTourDone ||
      profile?.plan_tour_completed ||
      quizData?.plan_tour_completed,
    );
    const tips = { ...(quizData?.feature_tips_seen || {}), ...(local.featureTipsSeen || {}) };

    set({
      welcomeTourDone: welcomeDone,
      planTourDone: planDone,
      featureTipsSeen: tips,
    });
    writeLocal({ welcomeTourDone: welcomeDone, planTourDone: planDone, featureTipsSeen: tips });
  },

  // Mark tours complete — persist to localStorage immediately
  completeWelcomeTour: () => {
    set({ welcomeTourDone: true, activeTour: null });
    writeLocal({ welcomeTourDone: true });
  },
  completePlanTour: () => {
    set({ planTourDone: true, activeTour: null });
    writeLocal({ planTourDone: true });
  },

  // Replay — clear localStorage flag so the tour can run again
  replayTour: (tour) => {
    if (tour === 'welcome') {
      set({ welcomeTourDone: false });
      writeLocal({ welcomeTourDone: false });
    }
    if (tour === 'plan') {
      set({ planTourDone: false });
      writeLocal({ planTourDone: false });
    }
  },

  markTipSeen: (tipId) =>
    set((s) => {
      const tips = { ...(s.featureTipsSeen || {}), [tipId]: true };
      writeLocal({ featureTipsSeen: tips });
      return { featureTipsSeen: tips };
    }),
}));

