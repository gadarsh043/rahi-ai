import { useEffect } from 'react';
import useTourStore from '../stores/tourStore';
import { getPageFeatures } from '../components/onboarding/tourRegistry';

/**
 * Hook that checks if a page has unseen tour features.
 * If so, shows the floating TourPrompt card after a delay.
 *
 * @param {string} page — page key from tourRegistry ('home' | 'form' | 'plan')
 * @param {boolean} ready — whether the page is ready to show tours (e.g., data loaded)
 * @param {number} delayMs — delay before showing prompt
 */
export default function useTourCheck(page, ready = true, delayMs = 1200) {
  const activeTour = useTourStore((s) => s.activeTour);
  const fullFlow = useTourStore((s) => s.fullFlow);
  const toursSeen = useTourStore((s) => s.toursSeen);
  const showTourPrompt = useTourStore((s) => s.showTourPrompt);

  useEffect(() => {
    if (!ready || activeTour || fullFlow) return;

    const features = getPageFeatures(page);
    if (features.length === 0) return;

    const unseen = features.filter((f) => !toursSeen[f.id]);
    if (unseen.length === 0) return;

    // Determine if this is "new features" vs "first time"
    const seen = features.filter((f) => toursSeen[f.id]);
    const isNew = seen.length > 0 && unseen.length > 0;

    const timer = setTimeout(() => {
      showTourPrompt(page, isNew);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [page, ready, delayMs, activeTour, fullFlow, toursSeen, showTourPrompt]);
}
