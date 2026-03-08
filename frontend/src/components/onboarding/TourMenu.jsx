import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useTourStore from '../../stores/tourStore';
import useAuthStore from '../../stores/authStore';
import { getPageSteps, getPageFeatures, PAGE_ROUTES } from './tourRegistry';

export default function TourMenu() {
  const showMenu = useTourStore((s) => s.showMenu);
  const hideTourMenu = useTourStore((s) => s.hideTourMenu);
  const startTour = useTourStore((s) => s.startTour);
  const toursSeen = useTourStore((s) => s.toursSeen);
  const markPageSeen = useTourStore((s) => s.markPageSeen);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const navigate = useNavigate();
  const location = useLocation();

  const page = showMenu;
  const features = page ? getPageFeatures(page) : [];
  const unseenFeatures = features.filter((f) => !toursSeen[f.id]);

  const startFullFlow = useTourStore((s) => s.startFullFlow);

  const isOnPageFor = useCallback((tourPage) => {
    const path = location.pathname;
    if (tourPage === 'home') return path === '/';
    if (tourPage === 'form') return path === '/new';
    if (tourPage === 'plan') return path.startsWith('/plan') || path.startsWith('/trip');
    return false;
  }, [location.pathname]);

  const handleFullTour = useCallback(() => {
    if (!page) return;
    startFullFlow();
    if (!isOnPageFor('home')) {
      navigate(PAGE_ROUTES.home);
      setTimeout(() => {
        const steps = getPageSteps('home');
        startTour('home', steps);
      }, 800);
    } else {
      const steps = getPageSteps('home');
      startTour('home', steps);
    }
  }, [page, startTour, startFullFlow, navigate, isOnPageFor]);

  const handleFeatureTour = useCallback(
    (featureId) => {
      if (!page) return;
      const allSteps = getPageSteps(page);
      const featureSteps = allSteps.filter((s) => s.featureId === featureId);
      if (featureSteps.length === 0) return;
      if (!isOnPageFor(page)) {
        navigate(PAGE_ROUTES[page]);
        setTimeout(() => {
          startTour(page, featureSteps);
        }, 800);
      } else {
        startTour(page, featureSteps);
      }
    },
    [page, startTour, navigate, isOnPageFor],
  );

  const handleSkipAll = useCallback(() => {
    if (page) {
      markPageSeen(features, (toursSeen) =>
        updateProfile({ tours_seen: toursSeen }),
      );
    }
    hideTourMenu();
  }, [page, features, markPageSeen, hideTourMenu, updateProfile]);

  if (!page) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9998]">
        {/* Scrim */}
        <motion.div
          className="absolute inset-0 bg-black/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={hideTourMenu}
        />

        {/* Menu card */}
        <motion.div
          className="absolute bottom-20 lg:bottom-auto lg:top-1/2 left-1/2 -translate-x-1/2 lg:-translate-y-1/2 w-[calc(100%-32px)] max-w-sm z-[9999]"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <div className="bg-white dark:bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-xl overflow-hidden">
            {/* Brand accent top bar */}
            <div className="h-1 bg-gradient-to-r from-brand-400 to-brand-500" />

            <div className="p-5">
              <p
                className="text-[var(--text-primary)] mb-4"
                style={{ fontFamily: 'var(--font-handwritten)', fontSize: '22px', fontWeight: 600 }}
              >
                What would you like to explore?
              </p>

              {/* Feature grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {/* Full tour — highlighted */}
                <button
                  type="button"
                  onClick={handleFullTour}
                  className="col-span-2 bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 rounded-xl px-4 py-3 text-left hover:bg-brand-100 dark:hover:bg-brand-500/15 transition-colors cursor-pointer"
                >
                  <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">Full Tour</p>
                  <p className="text-xs text-brand-500/70 mt-0.5">See everything</p>
                </button>

                {/* Individual features */}
                {features.map((f) => {
                  const isUnseen = !toursSeen[f.id];
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleFeatureTour(f.id)}
                      className={`relative border rounded-xl px-3 py-2.5 text-left transition-colors cursor-pointer ${
                        isUnseen
                          ? 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]'
                          : 'border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--surface-hover)] opacity-60'
                      }`}
                    >
                      <p className="text-sm font-medium text-[var(--text-primary)]">{f.label}</p>
                      {isUnseen && (
                        <span className="absolute top-1.5 right-1.5 bg-brand-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                          NEW
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleSkipAll}
                className="w-full text-center text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] font-medium transition-colors cursor-pointer py-1.5"
              >
                Skip all
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
