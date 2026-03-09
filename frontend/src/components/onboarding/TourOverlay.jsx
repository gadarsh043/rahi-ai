import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useTourStore from '../../stores/tourStore';
import useAuthStore from '../../stores/authStore';
import { getPageFeatures, getPageSteps, FINAL_STEP, FULL_FLOW_PAGES, PAGE_ROUTES } from './tourRegistry';
import { trackEvent } from '../../services/posthog';

/* ── Element elevation (z-index boost + ancestor stacking context fix) ── */

function elevateElement(el) {
  const saved = [];

  const cs = window.getComputedStyle(el);
  saved.push({
    el,
    position: el.style.position,
    zIndex: el.style.zIndex,
    overflow: el.style.overflow,
  });
  // Keep fixed/absolute elements as-is — changing to relative breaks their layout
  if (cs.position !== 'fixed' && cs.position !== 'absolute') {
    el.style.position = 'relative';
  }
  el.style.zIndex = '10001';
  el.style.overflow = 'visible';

  let current = el.parentElement;
  while (current && current !== document.body && current !== document.documentElement) {
    const cs = window.getComputedStyle(current);
    const traps = cs.zIndex !== 'auto' || cs.transform !== 'none' || cs.isolation === 'isolate';
    if (traps) {
      saved.push({ el: current, zIndex: current.style.zIndex });
      current.style.zIndex = '10001';
    }
    current = current.parentElement;
  }

  return saved;
}

function restoreElement(saved) {
  for (const entry of saved) {
    if ('position' in entry) entry.el.style.position = entry.position;
    if ('zIndex' in entry) entry.el.style.zIndex = entry.zIndex;
    if ('overflow' in entry) entry.el.style.overflow = entry.overflow;
  }
}

/* ── Main Overlay ── */

export default function TourOverlay() {
  const activeTour = useTourStore((s) => s.activeTour);
  const fullFlow = useTourStore((s) => s.fullFlow);
  const nextStep = useTourStore((s) => s.nextStep);
  const prevStep = useTourStore((s) => s.prevStep);
  const endTour = useTourStore((s) => s.endTour);
  const startTour = useTourStore((s) => s.startTour);
  const endFullFlow = useTourStore((s) => s.endFullFlow);
  const markSeen = useTourStore((s) => s.markSeen);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const navigate = useNavigate();

  const [targetEl, setTargetEl] = useState(null);
  const [visible, setVisible] = useState(false);
  const savedStylesRef = useRef([]);
  const seenFeaturesRef = useRef(new Set());
  const openedElRef = useRef(null);
  const cleanupSelectorRef = useRef(null);

  const step = activeTour
    ? activeTour.steps[activeTour.currentIndex]
    : null;

  const isLast = activeTour
    ? activeTour.currentIndex === activeTour.steps.length - 1
    : false;

  const isFirst = activeTour
    ? activeTour.currentIndex === 0
    : false;

  const stepLabel = activeTour
    ? `${activeTour.currentIndex + 1} of ${activeTour.steps.length}`
    : '';

  // Elevate element + scroll into view
  useEffect(() => {
    // Close any previously opened element (drawer, dropdown, etc.)
    if (cleanupSelectorRef.current) {
      const closeEl = document.querySelector(cleanupSelectorRef.current);
      if (closeEl) closeEl.click();
      cleanupSelectorRef.current = null;
      openedElRef.current = null;
    } else if (openedElRef.current) {
      openedElRef.current.click();
      openedElRef.current = null;
    }

    // Restore previous element
    if (savedStylesRef.current.length > 0) {
      restoreElement(savedStylesRef.current);
      savedStylesRef.current = [];
    }

    if (!step) {
      setTargetEl(null);
      setVisible(true);
      return;
    }

    if (!step.element) {
      setTargetEl(null);
      setVisible(true);
      return;
    }

    setVisible(false);
    setTargetEl(null);

    const timer = setTimeout(() => {
      // Click prerequisite element if needed (e.g., open chat, profile dropdown)
      if (step.clickBefore) {
        const clickEl = document.querySelector(step.clickBefore);
        if (clickEl) {
          clickEl.click();
          if (step.cleanupClick) {
            cleanupSelectorRef.current = step.cleanupClick;
          } else {
            openedElRef.current = clickEl;
          }
        }
      }

      const findElement = (attempt = 0) => {
        const raw = document.querySelectorAll(step.element);
        // Filter to visible elements (handles mobile/desktop duplicates)
        const allMatches = [...raw].filter((e) => {
          const r = e.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        });
        const el = step.elementIndex != null
          ? allMatches[step.elementIndex] || null
          : allMatches[0] || null;
        if (el) {
          // Skip scroll if clickBefore already handled it (e.g., tab switch)
          if (!step.clickBefore) {
            el.scrollIntoView({ block: 'center', behavior: 'instant' });
            let sp = el.parentElement;
            while (sp && sp !== document.documentElement) {
              const ov = window.getComputedStyle(sp).overflowY;
              if (ov === 'auto' || ov === 'scroll') break;
              sp = sp.parentElement;
            }
            if (!sp || sp === document.documentElement) sp = document.scrollingElement || document.documentElement;
            sp.scrollTop += window.innerHeight * 0.25;
          }
          setTimeout(() => {
            savedStylesRef.current = elevateElement(el);
            setTargetEl(el);
            setVisible(true);
          }, 150);
        } else if (attempt < 3) {
          setTimeout(() => findElement(attempt + 1), 500);
        } else {
          setVisible(true);
        }
      };

      const findDelay = step.clickBefore ? 800 : 0;
      setTimeout(() => findElement(), findDelay);
    }, 100);

    return () => clearTimeout(timer);
  }, [step]);

  // Restore on unmount
  useEffect(() => {
    return () => {
      if (savedStylesRef.current.length > 0) {
        restoreElement(savedStylesRef.current);
        savedStylesRef.current = [];
      }
      if (cleanupSelectorRef.current) {
        const closeEl = document.querySelector(cleanupSelectorRef.current);
        if (closeEl) closeEl.click();
        cleanupSelectorRef.current = null;
      } else if (openedElRef.current) {
        openedElRef.current.click();
        openedElRef.current = null;
      }
    };
  }, []);

  // Track which features were shown
  useEffect(() => {
    if (step?.featureId) {
      seenFeaturesRef.current.add(step.featureId);
    }
  }, [step]);

  const handleNext = useCallback(() => {
    if (isLast) {
      // Mark features as seen
      const features = Array.from(seenFeaturesRef.current);
      if (features.length > 0) {
        markSeen(features, (toursSeen) =>
          updateProfile({ tours_seen: toursSeen }),
        );
      }
      seenFeaturesRef.current.clear();

      if (fullFlow && activeTour?.page !== '__final') {
        // Full flow — advance to next page or show final step
        const currentIdx = FULL_FLOW_PAGES.indexOf(activeTour.page);

        if (currentIdx < FULL_FLOW_PAGES.length - 1) {
          const nextPage = FULL_FLOW_PAGES[currentIdx + 1];
          // Do not navigate to protected routes when user is not logged in
          const user = useAuthStore.getState().user;
          if ((nextPage === 'form' || nextPage === 'plan') && !user) {
            if (fullFlow) endFullFlow();
            trackEvent('tour_completed', {});
            endTour();
            return;
          }
          const route = PAGE_ROUTES[nextPage];
          endTour();
          navigate(route);
          // Start next page's tour after it renders
          setTimeout(() => {
            const steps = getPageSteps(nextPage);
            startTour(nextPage, steps);
          }, 1500);
        } else {
          // Last page done — show final step (profile menu)
          endTour();
          setTimeout(() => {
            startTour('__final', [{ ...FINAL_STEP, featureId: '__final' }]);
          }, 500);
        }
      } else {
        // Normal end or final step done
        if (fullFlow) endFullFlow();
        trackEvent('tour_completed', {});
        endTour();
      }
    } else {
      nextStep();
    }
  }, [isLast, fullFlow, activeTour, endTour, nextStep, markSeen, updateProfile, navigate, startTour, endFullFlow]);

  const handleSkip = useCallback(() => {
    if (activeTour) {
      trackEvent('tour_dismissed', { step: activeTour.currentIndex });
      const pageFeatures = getPageFeatures(activeTour.page);
      const allIds = pageFeatures.map((f) => f.id);
      markSeen(allIds, (toursSeen) =>
        updateProfile({ tours_seen: toursSeen }),
      );
    }
    seenFeaturesRef.current.clear();
    if (fullFlow) endFullFlow();
    endTour();
  }, [activeTour, endTour, markSeen, updateProfile, fullFlow, endFullFlow]);

  // ESC key
  useEffect(() => {
    if (!activeTour) return;
    const handler = (e) => {
      if (e.key === 'Escape') handleSkip();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTour, handleSkip]);

  if (!activeTour || !step) return null;

  // Default: bottom-right. Only bottom-left when element is on the right side.
  // Center only for steps that have no element at all (text-only intro steps).
  const cardSide = (() => {
    if (!step.element) return 'center';
    if (!targetEl) return 'right';
    const rect = targetEl.getBoundingClientRect();
    const elCenterX = rect.left + rect.width / 2;
    return elCenterX > window.innerWidth * 0.65 ? 'left' : 'right';
  })();

  const cardPositionClass = cardSide === 'center'
    ? 'top-1/3 left-1/2 -translate-x-1/2'
    : cardSide === 'left'
      ? 'bottom-6 left-4 lg:bottom-8 lg:left-6'
      : 'bottom-6 right-4 lg:bottom-8 lg:right-6';

  return (
    <>
      {/* Scrim */}
      <AnimatePresence>
        {visible && (
          <motion.div
            key="tour-scrim"
            className="fixed inset-0 z-[10000] bg-black/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
          />
        )}
      </AnimatePresence>

      {/* Info card */}
      <AnimatePresence>
        {visible && (
          <motion.div
            key="tour-card"
            className={`fixed z-[10003] w-[calc(100%-32px)] max-w-xs ${cardPositionClass}`}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.25, delay: 0.12, ease: 'easeOut' }}
          >
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden">
              {/* Brand accent */}
              <div className="h-1 bg-gradient-to-r from-brand-400 to-brand-500" />

              <div className="p-4">
                <p
                  className="text-[var(--text-primary)] leading-relaxed"
                  style={{
                    fontFamily: 'var(--font-handwritten)',
                    fontSize: '20px',
                    fontWeight: 600,
                  }}
                >
                  {step.text}
                </p>

                <div className="flex items-center justify-between mt-4">
                  <span className="text-[var(--text-muted)] text-xs font-medium">
                    {stepLabel}
                  </span>

                  <div className="flex items-center gap-2">
                    {!isFirst && (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium transition-colors cursor-pointer px-2 py-1.5"
                      >
                        Back
                      </button>
                    )}

                    {!isLast && (
                      <button
                        type="button"
                        onClick={handleSkip}
                        className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-xs font-medium transition-colors cursor-pointer px-2 py-1.5"
                      >
                        Skip
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleNext}
                      className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-1.5 rounded-full transition-colors cursor-pointer"
                    >
                      {isLast ? 'Done' : 'Next'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
