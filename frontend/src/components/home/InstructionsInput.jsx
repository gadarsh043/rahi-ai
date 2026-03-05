import { useCallback } from 'react';
import { motion } from 'framer-motion';

const MAX_CHARS = 500;
const QUICK_CHIPS = [
  { emoji: '🍯', label: 'Honeymoon' },
  { emoji: '🥬', label: 'Vegetarian' },
  { emoji: '♿', label: 'Accessibility' },
  { emoji: '👶', label: 'With kids' },
  { emoji: '📸', label: 'Photography focus' },
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

  const appendChip = useCallback(
    (label) => {
      const trimmed = text.trim();
      const addition = trimmed ? `, ${label}` : label;
      const next = (text + addition).slice(0, MAX_CHARS);
      onChange(next);
    },
    [text, onChange]
  );

  return (
    <div className="mt-6 max-w-md">
      <div className="glass dark:glass-dark rounded-2xl p-4">
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
        {QUICK_CHIPS.map((chip) => (
          <motion.button
            key={chip.label}
            type="button"
            onClick={() => appendChip(chip.label)}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            aria-label={`Add ${chip.label}`}
            className="border border-[var(--border)] rounded-full px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:border-brand-400 hover:text-brand-400 cursor-pointer transition-colors duration-150"
          >
            {chip.emoji} {chip.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
