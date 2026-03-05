import { useEffect } from 'react';
import introJs from 'intro.js';
import 'intro.js/introjs.css';

import useAuthStore from '../../stores/authStore';
import { useOnboardingStore } from '../../stores/onboardingStore';
import useTripStore from '../../stores/tripStore';

function stepIfExists(step) {
  if (!step.element) return step;
  const el = document.querySelector(step.element);
  return el ? step : null;
}

export default function PlanTour({ isDemo = false }) {
  const profile = useAuthStore((s) => s.profile);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const planTourDone = useOnboardingStore((s) => s.planTourDone);
  const completePlanTour = useOnboardingStore((s) => s.completePlanTour);
  const setActiveTour = useOnboardingStore((s) => s.setActiveTour);
  const closeChat = useTripStore((s) => s.closeChat);

  useEffect(() => {
    if (!profile) return undefined;
    if (planTourDone && !isDemo) return undefined;

    const timer = setTimeout(() => {
      setActiveTour('plan');

      const baseSteps = [
        {
          title: 'Your Trip Plan',
          intro:
            "This is where your itinerary lives. Here's how to use the plan view.",
        },
        {
          element: '[data-tour="tab-bar"]',
          title: 'Browse by category',
          intro:
            'Use these tabs to explore food, stays, places, flights, costs, and the day-by-day itinerary.',
          position: 'bottom',
        },
        {
          element: '[data-tour="map-panel"]',
          title: 'Interactive map',
          intro:
            'Places are pinned with color-coded markers. Click a marker for details and quick links.',
          position: 'left',
        },
        {
          element: '[data-tour="chat-input"]',
          title: 'Chat to modify',
          intro:
            'Ask for changes in plain English. Example: “Replace dinner with something vegetarian.”',
          position: 'top',
        },
        {
          element: '[data-tour="lets-pick"]',
          title: 'Pick your favorites',
          intro:
            'Open “Let’s Pick” to see all places we found. Check what you want and rebuild around your choices.',
          position: 'top',
        },
        {
          element: '[data-tour="share-button"]',
          title: 'Share your plan',
          intro:
            'Create a share code so friends can view and suggest changes.',
          position: 'bottom',
        },
        {
          element: '[data-tour="save-button"]',
          title: 'Save as “My Trip”',
          intro:
            'When you’re happy, save it for a downloadable PDF and a trip-ready checklist.',
          position: 'bottom',
        },
        {
          title: 'You’re ready',
          intro:
            'You can replay this tour anytime from your profile menu.',
        },
      ];

      const steps = baseSteps
        .map(stepIfExists)
        .filter(Boolean);

      const intro = introJs();
      intro.setOptions({
        steps,
        showProgress: true,
        showBullets: false,
        showStepNumbers: false,
        doneLabel: 'Done',
        nextLabel: 'Next →',
        prevLabel: '← Back',
        exitOnOverlayClick: false,
        overlayOpacity: 0.5,
        scrollToElement: true,
        scrollPadding: 60,
      });

      const done = async () => {
        // Ensure any open chat drawer is closed when the tour finishes.
        closeChat?.();
        completePlanTour();
        setActiveTour(null);
        try {
          const existing = profile?.quiz_data || profile?.quizData || {};
          await updateProfile({
            quiz_data: { ...(existing || {}), plan_tour_completed: true },
          });
        } catch {
          // best-effort
        }
      };

      intro.oncomplete(done);
      intro.onexit(done);
      intro.start();
    }, isDemo ? 900 : 1100);

    return () => clearTimeout(timer);
  }, [
    profile,
    planTourDone,
    isDemo,
    completePlanTour,
    setActiveTour,
    updateProfile,
    closeChat,
  ]);

  return null;
}

