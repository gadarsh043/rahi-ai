import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiPost } from '../../services/apiClient';

const PROGRESS_MESSAGES = [
  'Discovering places...',
  'Finding restaurants...',
  'Checking hotels nearby...',
  'Searching for attractions...',
  'Mapping out routes...',
  'Building your itinerary...',
  'Optimizing your schedule...',
  'Adding local favorites...',
];

const FALLBACK_FACTS = {
  default: [
    'The world has over 10,000 cities with populations over 100,000',
    'Tourism accounts for about 10% of global GDP',
    'The most visited city in the world is Bangkok with over 22 million visitors annually',
    'There are 195 countries in the world today',
    'The longest flight in the world is from Singapore to New York — 18 hours',
    'Japan has over 6,800 islands but most people live on just four of them',
    'Iceland has no mosquitoes despite being surrounded by water',
    'Venice is built on 118 small islands connected by over 400 bridges',
    'The Great Wall of China is over 13,000 miles long',
    'Australia is wider than the moon — 2,500 miles vs 2,159 miles',
  ],
};

export default function GeneratingScreen({
  destinationCity,
  isGenerating,
  statusMessage,
  plannedDays = 0,
  totalDays = 0,
}) {
  const [facts, setFacts] = useState([]);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const progressTimer = useRef(null);
  const factTimer = useRef(null);
  const messageTimer = useRef(null);
  // Fetch fun facts about the destination
  useEffect(() => {
    if (!destinationCity) return;

    // Use fallback immediately so something shows while API loads
    setFacts(FALLBACK_FACTS.default);

    (async () => {
      try {
        const res = await apiPost(
          '/destination-facts',
          { city: destinationCity },
          { context: 'facts', silent: true }
        );
        if (res?.facts?.length) {
          setFacts(res.facts);
        }
      } catch {
        // silent fail — fallback facts already set
      }
    })();
  }, [destinationCity]);

  // Rotate facts every 4.5 seconds
  useEffect(() => {
    if (facts.length === 0) return;
    factTimer.current = setInterval(() => {
      setCurrentFactIndex((i) => (i + 1) % facts.length);
    }, 4500);
    return () => clearInterval(factTimer.current);
  }, [facts]);

  // Rotate progress messages every 3 seconds
  useEffect(() => {
    messageTimer.current = setInterval(() => {
      setMessageIndex((i) => (i + 1) % PROGRESS_MESSAGES.length);
    }, 3000);
    return () => clearInterval(messageTimer.current);
  }, []);

  // Progress bar — random increments, slows near 95%
  const tick = useCallback(() => {
    setProgress((prev) => {
      if (prev >= 94) {
        // Crawl near the top
        const tiny = Math.random() * 0.5 + 0.1;
        return Math.min(prev + tiny, 96);
      }
      if (prev >= 75) {
        return prev + Math.random() * 2 + 0.5;
      }
      if (prev >= 50) {
        return prev + Math.random() * 3 + 1;
      }
      return prev + Math.random() * 5 + 2;
    });
  }, []);

  const progressRef = useRef(0);
  useEffect(() => { progressRef.current = progress; }, [progress]);

  useEffect(() => {
    if (!isGenerating) {
      setProgress(100);
      clearTimeout(progressTimer.current);
      return;
    }

    const scheduleNext = () => {
      const cur = progressRef.current;
      const delay = cur >= 80
        ? 2000 + Math.random() * 1500
        : 800 + Math.random() * 1200;
      progressTimer.current = setTimeout(() => {
        tick();
        scheduleNext();
      }, delay);
    };

    scheduleNext();
    return () => clearTimeout(progressTimer.current);
  }, [isGenerating, tick]);

  const currentFact = facts[currentFactIndex] || '';
  const displayProgress = Math.min(Math.round(progress), 100);
  const effectiveStatus = statusMessage || PROGRESS_MESSAGES[messageIndex];
  const showDayProgress =
    totalDays > 0 && plannedDays > 0 && plannedDays <= totalDays;

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-md text-center">
        {/* Destination heading */}
        <h2 className="text-2xl font-extrabold text-[var(--text-primary)] mb-8">
          {destinationCity || 'Your trip'}
        </h2>

        {/* Fun fact */}
        <div className="h-20 flex items-center justify-center mb-10">
          <AnimatePresence mode="wait">
            {currentFact && (
              <motion.p
                key={currentFactIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-sm mx-auto font-medium"
              >
                "{currentFact}"
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div className="w-full mb-3">
          <div className="h-2 bg-brand-100 dark:bg-[var(--border)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-400 to-brand-500 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${displayProgress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Progress info */}
        <div className="flex items-center justify-between">
          <AnimatePresence mode="wait">
            <motion.p
              key={statusMessage ? `status-${effectiveStatus}` : messageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-xs text-[var(--text-muted)]"
            >
              {displayProgress >= 100
                ? '100+ places found!'
                : effectiveStatus}
            </motion.p>
          </AnimatePresence>
          <span className="text-xs font-semibold text-brand-500">
            {displayProgress}%
          </span>
        </div>
      </div>
    </div>
  );
}
