import { useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import { AnimatePresence, motion } from 'framer-motion';
import DurationSlider from './DurationSlider';
import 'react-day-picker/style.css';

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function todayStart() {
  return startOfDay(new Date());
}

function formatDate(date) {
  if (!date) return null;
  return startOfDay(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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

    const calculatedDays = to
      ? Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1
      : numDays;
    onChange({ startDate: from, endDate: to, isFlexible, numDays: calculatedDays });
  };

  const handleToggleFlexible = () => {
    onChange({ startDate, endDate, isFlexible: !isFlexible, numDays });
  };

  const handleQuickPick = (type) => {
    const today = todayStart();
    let from, to;

    if (type === 'weekend') {
      // Next Friday–Sunday
      const dayOfWeek = today.getDay();
      const daysToFriday = (5 - dayOfWeek + 7) % 7 || 7;
      from = new Date(today);
      from.setDate(today.getDate() + daysToFriday);
      to = new Date(from);
      to.setDate(from.getDate() + 2);
    } else if (type === 'nextMonth') {
      from = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      to = new Date(today.getFullYear(), today.getMonth() + 1, 7);
    }

    const calculatedDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
    onChange({ startDate: from, endDate: to, isFlexible, numDays: calculatedDays });
  };

  return (
    <div className="mt-4 w-full max-w-2xl mx-auto">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Left panel — date display + flexible + quick picks */}
        <div className="md:w-[220px] shrink-0 space-y-4">
          {/* Start date */}
          <div className="border border-[var(--border)] rounded-xl p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">
              Start date
            </p>
            <p className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
              <span className="text-[var(--text-muted)]">📅</span>
              {formatDate(startDate) || 'Select date'}
            </p>
          </div>

          {/* End date */}
          <div className="border border-[var(--border)] rounded-xl p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">
              End date
            </p>
            <p className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
              <span className="text-[var(--text-muted)]">📅</span>
              {formatDate(endDate) || 'Select date'}
            </p>
          </div>

          {/* Flexible toggle */}
          <button
            type="button"
            onClick={handleToggleFlexible}
            className={`w-full flex items-center justify-between rounded-xl p-3 border transition-colors cursor-pointer ${
              isFlexible
                ? 'border-brand-500 bg-brand-500/8'
                : 'border-[var(--border)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-brand-500 text-sm">↻</span>
              <div className="text-left">
                <p className="text-sm font-medium text-[var(--text-primary)]">I'm flexible</p>
                <p className="text-[11px] text-[var(--text-muted)]">&plusmn; 3 days</p>
              </div>
            </div>
            <div className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${
              isFlexible ? 'bg-brand-500' : 'bg-[var(--border)]'
            }`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                isFlexible ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </div>
          </button>

          {/* Quick picks */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleQuickPick('weekend')}
              className="border border-[var(--border)] rounded-lg px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:border-brand-400 hover:text-brand-500 transition-colors cursor-pointer"
            >
              This Weekend
            </button>
            <button
              type="button"
              onClick={() => handleQuickPick('nextMonth')}
              className="border border-[var(--border)] rounded-lg px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:border-brand-400 hover:text-brand-500 transition-colors cursor-pointer"
            >
              Next Month
            </button>
          </div>
        </div>

        {/* Right panel — calendar */}
        <div className="flex-1 border border-[var(--border)] rounded-xl p-3 min-w-0">
          <AnimatePresence initial={false} mode="wait">
            {!isFlexible ? (
              <motion.div
                key="fixed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
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
                    caption: 'mb-2 text-sm font-medium text-[var(--text-primary)]',
                    head_row: 'text-[11px] text-[var(--text-muted)]',
                    head_cell: 'pb-1',
                    nav: 'space-x-1',
                    nav_button: 'text-xs text-[var(--text-secondary)] hover:text-brand-500',
                    table: 'w-full border-collapse',
                    row: '',
                    cell: 'p-0.5',
                    day: 'w-9 h-9 rounded-lg text-sm text-[var(--text-primary)] hover:bg-[var(--surface-hover)] focus-visible:outline-none',
                    day_selected:
                      'bg-brand-500 text-white rounded-lg hover:bg-brand-500 focus-visible:outline-none',
                    day_today: 'font-bold text-brand-500',
                    day_outside: 'text-[var(--text-secondary)] opacity-60',
                    day_disabled: 'opacity-40 cursor-not-allowed pointer-events-none text-[var(--text-muted)] hover:bg-transparent',
                    range_middle: 'bg-brand-500/15',
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="flexible"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-center justify-center py-6 px-4"
              >
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  How many days roughly?
                </p>
                <DurationSlider
                  value={numDays ?? 7}
                  onChange={(days) => onChange({ startDate, endDate, isFlexible, numDays: days })}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
