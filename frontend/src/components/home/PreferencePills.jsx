import { motion } from 'framer-motion';

const PREFERENCE_OPTIONS = [
  { id: 'food_drinks', emoji: '🍽', label: 'Food & Drinks' },
  { id: 'nature', emoji: '🌿', label: 'Nature' },
  { id: 'history', emoji: '🏛', label: 'History' },
  { id: 'museums', emoji: '🖼', label: 'Museums' },
  { id: 'nightlife', emoji: '🌙', label: 'Nightlife' },
  { id: 'shopping', emoji: '🛍', label: 'Shopping' },
  { id: 'hiking', emoji: '🥾', label: 'Hiking' },
  { id: 'beaches', emoji: '🏖', label: 'Beaches' },
  { id: 'art', emoji: '🎨', label: 'Art' },
  { id: 'live_music', emoji: '🎵', label: 'Live Music' },
  { id: 'parks', emoji: '🌳', label: 'Parks' },
  { id: 'sightseeing', emoji: '📸', label: 'Sightseeing' },
  { id: 'adventure', emoji: '⛰', label: 'Adventure' },
  { id: 'photography', emoji: '📷', label: 'Photography' },
  { id: 'local_markets', emoji: '🏪', label: 'Local Markets' },
];

export default function PreferencePills({ value = [], onChange }) {
  const selected = Array.isArray(value) ? value : [];
  const count = selected.length;

  const toggle = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="mt-6 max-w-lg mx-auto">
      <div className="flex flex-wrap justify-center gap-2">
        {PREFERENCE_OPTIONS.map((option) => {
          const isActive = selected.includes(option.id);
          return (
            <motion.button
              key={option.id}
              type="button"
              onClick={() => toggle(option.id)}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`
                rounded-full px-4 py-2 text-sm font-medium border transition-all duration-150
                ${isActive
                  ? 'bg-brand-500 text-white border-brand-500 font-semibold'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-brand-500/50 hover:text-[var(--text-primary)]'
                }
              `}
            >
              <span className="mr-1.5">{option.emoji}</span>
              {option.label}
            </motion.button>
          );
        })}
      </div>
      <p
        className={`mt-3 text-xs text-center ${
          count < 2 ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]'
        }`}
      >
        {count < 2 ? 'Select at least 2' : `✓ ${count} selected`}
      </p>
    </div>
  );
}
