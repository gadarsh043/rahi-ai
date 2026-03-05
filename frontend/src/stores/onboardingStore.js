import { create } from 'zustand';

export const useOnboardingStore = create((set) => ({
  // Tour completion status
  welcomeTourDone: false,
  planTourDone: false,

  // One-off feature tips (first-use tooltips)
  featureTipsSeen: {}, // { [tipId: string]: true }

  // Current tour state
  activeTour: null, // 'welcome' | 'plan' | null
  setActiveTour: (tour) => set({ activeTour: tour }),

  // Init from profile (Supabase profiles row)
  initFromProfile: (profile) => {
    const quizData = profile?.quiz_data || profile?.quizData || {};
    set({
      welcomeTourDone: Boolean(profile?.onboarding_completed || profile?.onboardingCompleted),
      planTourDone: Boolean(profile?.plan_tour_completed || quizData?.plan_tour_completed),
      featureTipsSeen: quizData?.feature_tips_seen || {},
    });
  },

  // Mark tours complete (store-only; components persist to profile)
  completeWelcomeTour: () => set({ welcomeTourDone: true, activeTour: null }),
  completePlanTour: () => set({ planTourDone: true, activeTour: null }),

  // Replay
  replayTour: (tour) => {
    if (tour === 'welcome') set({ welcomeTourDone: false });
    if (tour === 'plan') set({ planTourDone: false });
  },

  markTipSeen: (tipId) =>
    set((s) => ({
      featureTipsSeen: { ...(s.featureTipsSeen || {}), [tipId]: true },
    })),
}));

