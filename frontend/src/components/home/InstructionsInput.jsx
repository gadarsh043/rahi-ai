import { useCallback } from 'react';
import { motion } from 'framer-motion';

const MAX_CHARS = 500;
const QUICK_CHIPS = [
  { emoji: '🥬', label: 'Vegetarian' },
  { emoji: '♿', label: 'Accessibility' },
  { emoji: '🐾', label: 'Pet-friendly' },
  { emoji: '🤫', label: 'Avoid crowds' },
  { emoji: '🕌', label: 'Halal food' },
  { emoji: '🌙', label: 'Early mornings' },
  { emoji: '🏋️', label: 'Gym access' },
];

export default function InstructionsInput({ value = '', onChange }) {
  const text = typeof value === 'string' ? value : '';
  const len = text.length;

  const handleChange = useCallback(
    (e) => {
      const next = e.target.value;
      if (next.length <= MAX_CHARS) onChange(next);
    },
    [onChange]
  );

  const isChipActive = useCallback(
    (label) => {
      return text.split(/,\s*/).some((part) => part.trim().toLowerCase() === label.toLowerCase());
    },
    [text]
  );

  const toggleChip = useCallback(
    (label) => {
      if (isChipActive(label)) {
        // Remove the chip from text
        const parts = text.split(/,\s*/).filter((part) => part.trim().toLowerCase() !== label.toLowerCase());
        onChange(parts.join(', ').trim());
      } else {
        // Add the chip
        const trimmed = text.trim();
        const addition = trimmed ? `, ${label}` : label;
        const next = (text + addition).slice(0, MAX_CHARS);
        onChange(next);
      }
    },
    [text, onChange, isChipActive]
  );

  return (
    <div className="mt-6 max-w-md mx-auto">
      <div className="bg-white dark:bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
        <textarea
          placeholder="E.g., honeymoon trip, vegetarian food only, wheelchair accessible, avoid crowded places..."
          value={text}
          onChange={handleChange}
          rows={4}
          maxLength={MAX_CHARS}
          className="bg-transparent w-full resize-y text-[var(--text-primary)] text-sm outline-none placeholder:text-[var(--text-muted)] min-h-[88px]"
        />
        <div className="flex justify-end">
          <span className="text-xs text-[var(--text-muted)]">
            {len} / {MAX_CHARS}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {QUICK_CHIPS.map((chip) => {
          const active = isChipActive(chip.label);
          return (
            <motion.button
              key={chip.label}
              type="button"
              onClick={() => toggleChip(chip.label)}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              aria-label={active ? `Remove ${chip.label}` : `Add ${chip.label}`}
              className={`rounded-full px-3 py-1.5 text-sm cursor-pointer transition-colors duration-150 border ${
                active
                  ? 'bg-brand-500 text-white border-brand-500 font-semibold'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-brand-400 hover:text-brand-400'
              }`}
            >
              {chip.emoji} {chip.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
