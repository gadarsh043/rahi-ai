import { useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import { AnimatePresence, motion } from 'framer-motion';
import 'react-day-picker/style.css';

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function todayStart() {
  return startOfDay(new Date());
}

export default function TripDatePicker({ startDate, endDate, isFlexible, numDays, onChange }) {
  const selected = useMemo(
    () => ({
      from: startDate ? startOfDay(startDate) : undefined,
      to: endDate ? startOfDay(endDate) : undefined,
    }),
    [startDate, endDate],
  );

  const handleSelect = (range) => {
    if (!range || !range.from) {
      onChange({ startDate: null, endDate: null, isFlexible, numDays });
      return;
    }

    const today = todayStart();
    let from = startOfDay(range.from);
    if (from < today) from = today;

    let to = range.to ? startOfDay(range.to) : null;
    if (to && to <= from) {
      to = new Date(from);
      to.setDate(to.getDate() + 1);
    }

    onChange({ startDate: from, endDate: to, isFlexible, numDays });
  };

  const summary = useMemo(() => {
    if (!startDate || !endDate) return 'Select your dates';
    const start = startOfDay(startDate);
    const end = startOfDay(endDate);
    if (end <= start) return 'Select your dates';

    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const startStr = start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const endStr = end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${diffDays} day${diffDays === 1 ? '' : 's'} · ${startStr} – ${endStr}`;
  }, [startDate, endDate]);

  const handleToggleFlexible = () => {
    onChange({
      startDate,
      endDate,
      isFlexible: !isFlexible,
      numDays,
    });
  };

  return (
    <div className="mt-6 max-w-md">
      <div className="glass dark:glass-dark rounded-2xl p-6">
        <AnimatePresence initial={false} mode="wait">
          {!isFlexible ? (
            <motion.div
              key="fixed"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="rdp-trip-calendar"
            >
              <DayPicker
                mode="range"
                selected={selected}
                onSelect={handleSelect}
                disabled={{ before: todayStart() }}
                resetOnSelect
                classNames={{
                  root: 'rdp-root text-[var(--text-primary)]',
                  caption: 'mb-2 text-sm font-medium',
                  head_row: 'text-[11px] text-[var(--text-muted)]',
                  head_cell: 'pb-1',
                  nav: 'space-x-1',
                  nav_button: 'text-xs text-[var(--text-secondary)] hover:text-brand-500',
                  table: 'w-full border-collapse',
                  row: '',
                  cell: 'p-0.5',
                  day: 'w-9 h-9 rounded-lg text-sm hover:bg-[var(--surface-hover)] focus-visible:outline-none',
                  day_selected:
                    'bg-brand-500 text-white rounded-lg hover:bg-brand-500 focus-visible:outline-none',
                  day_today: 'font-bold text-brand-500',
                  day_outside: 'text-[var(--text-muted)] opacity-60',
                  day_disabled: 'opacity-40 cursor-not-allowed pointer-events-none text-[var(--text-muted)] hover:bg-transparent',
                  range_middle: 'bg-brand-500/15',
                }}
              />
              <p className="mt-3 text-sm font-semibold text-brand-500">{summary}</p>
            </motion.div>
          ) : (
            <motion.div
              key="flexible"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="space-y-2"
            >
              <p className="text-sm text-[var(--text-secondary)]">
                No worries! We&apos;ll find the best time.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 flex w-full justify-center">
          <motion.button
            type="button"
            onClick={handleToggleFlexible}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
              isFlexible
                ? 'bg-brand-500 text-white border-brand-500'
                : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-brand-400 hover:text-brand-400'
            }`}
          >
            {isFlexible ? '✓ Flexible' : "I'm flexible"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

