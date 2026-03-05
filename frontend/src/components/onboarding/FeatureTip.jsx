import { useEffect } from 'react';
import introJs from 'intro.js';
import 'intro.js/introjs.css';

import useAuthStore from '../../stores/authStore';
import { useOnboardingStore } from '../../stores/onboardingStore';

export default function FeatureTip({
  tipId,
  element,
  title,
  intro,
  position = 'bottom',
  delayMs = 600,
}) {
  const profile = useAuthStore((s) => s.profile);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const featureTipsSeen = useOnboardingStore((s) => s.featureTipsSeen);
  const markTipSeen = useOnboardingStore((s) => s.markTipSeen);

  useEffect(() => {
    if (!tipId || !profile) return undefined;
    if (featureTipsSeen?.[tipId]) return undefined;
    if (!element) return undefined;

    const timer = setTimeout(() => {
      const el = document.querySelector(element);
      if (!el) return;

      const introInstance = introJs();
      introInstance.setOptions({
        steps: [
          {
            element,
            title: title || 'Tip',
            intro: intro || '',
            position,
          },
        ],
        showProgress: false,
        showBullets: false,
        showStepNumbers: false,
        doneLabel: 'Got it',
        nextLabel: 'Next →',
        prevLabel: '← Back',
        exitOnOverlayClick: true,
        overlayOpacity: 0.45,
        scrollToElement: true,
        scrollPadding: 60,
      });

      const done = async () => {
        markTipSeen(tipId);
        try {
          const existing = profile?.quiz_data || profile?.quizData || {};
          const existingTips = existing?.feature_tips_seen || {};
          await updateProfile({
            quiz_data: {
              ...(existing || {}),
              feature_tips_seen: { ...(existingTips || {}), [tipId]: true },
            },
          });
        } catch {
          // best-effort
        }
      };

      introInstance.oncomplete(done);
      introInstance.onexit(done);
      introInstance.start();
    }, delayMs);

    return () => clearTimeout(timer);
  }, [
    tipId,
    element,
    title,
    intro,
    position,
    delayMs,
    profile,
    updateProfile,
    featureTipsSeen,
    markTipSeen,
  ]);

  return null;
}

