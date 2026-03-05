import { useEffect } from 'react';
import introJs from 'intro.js';
import 'intro.js/introjs.css';

import useAuthStore from '../../stores/authStore';
import { useOnboardingStore } from '../../stores/onboardingStore';

export default function WelcomeTour() {
  const profile = useAuthStore((s) => s.profile);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const welcomeTourDone = useOnboardingStore((s) => s.welcomeTourDone);
  const completeWelcomeTour = useOnboardingStore((s) => s.completeWelcomeTour);
  const setActiveTour = useOnboardingStore((s) => s.setActiveTour);

  useEffect(() => {
    if (!profile) return undefined;
    if (welcomeTourDone) return undefined;

    const timer = setTimeout(() => {
      setActiveTour('welcome');

      const intro = introJs();
      intro.setOptions({
        steps: [
          {
            title: 'Welcome to Rahify',
            intro:
              "Your AI travel planner. Real places, zero hallucination. Here's the 10-second tour.",
          },
          {
            element: '[data-tour="destination"]',
            title: 'Where do you want to go?',
            intro:
              "Start by typing a destination. We'll ask a few quick questions about your travel style.",
            position: 'bottom',
          },
          {
            element: '[data-tour="prompt-box"]',
            title: 'Your trip builds here',
            intro:
              'Each answer fills this request automatically. Hit Send when you’re ready to generate.',
            position: 'top',
          },
        ],
        showProgress: true,
        showBullets: false,
        showStepNumbers: false,
        doneLabel: 'Done',
        nextLabel: 'Next →',
        prevLabel: '← Back',
        exitOnOverlayClick: false,
        overlayOpacity: 0.6,
      });

      const done = async () => {
        completeWelcomeTour();
        setActiveTour(null);
        try {
          await updateProfile({ onboarding_completed: true });
        } catch {
          // best-effort
        }
      };

      intro.oncomplete(done);
      intro.onexit(done);
      intro.start();
    }, 800);

    return () => clearTimeout(timer);
  }, [
    profile,
    welcomeTourDone,
    completeWelcomeTour,
    setActiveTour,
    updateProfile,
  ]);

  return null;
}

