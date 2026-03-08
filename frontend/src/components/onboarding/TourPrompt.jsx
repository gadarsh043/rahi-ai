import { motion, AnimatePresence } from 'framer-motion';
import useTourStore from '../../stores/tourStore';

export default function TourPrompt() {
  const showPrompt = useTourStore((s) => s.showPrompt);
  const hideTourPrompt = useTourStore((s) => s.hideTourPrompt);
  const showTourMenu = useTourStore((s) => s.showTourMenu);

  if (!showPrompt) return null;

  const { page, isNew } = showPrompt;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-[9999] max-w-xs"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <div className="bg-white dark:bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-lg overflow-hidden">
          {/* Brand accent top bar */}
          <div className="h-1 bg-gradient-to-r from-brand-400 to-brand-500" />

          <div className="p-4">
            <p
              className="text-[var(--text-primary)] font-semibold text-sm mb-1"
              style={{ fontFamily: 'var(--font-handwritten)', fontSize: '20px' }}
            >
              {isNew ? 'We added something new!' : 'First time here?'}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              {isNew
                ? 'Quick 10-second tour of the new stuff?'
                : 'Want a quick walkthrough of this page?'}
            </p>
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={hideTourPrompt}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] font-medium transition-colors cursor-pointer px-3 py-1.5"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={() => showTourMenu(page)}
                className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Show me
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
