import { motion } from 'framer-motion';

const PACE_OPTIONS = [
  { id: 'relaxed', emoji: '😎', label: 'Relaxed' },
  { id: 'moderate', emoji: '🌿', label: 'Moderate' },
  { id: 'active', emoji: '🤸', label: 'Active' },
  { id: 'intense', emoji: '🔥', label: 'Intense' },
];

export default function PaceSelector({ value, onChange }) {
  return (
    <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
      {PACE_OPTIONS.map((option) => {
        const isSelected = value === option.id;
        return (
          <motion.button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            whileTap={{ scale: 0.97 }}
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`
              relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 text-center border-2 cursor-pointer transition-all duration-150
              ${isSelected
                ? 'border-brand-500 bg-brand-500/8 dark:bg-brand-500/12'
                : 'border-transparent hover:border-brand-500/30'
              }
            `}
          >
            {isSelected && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-brand-500 rounded-full" aria-hidden />
            )}
            <span className="text-2xl block mb-1.5">{option.emoji}</span>
            <span className="text-sm font-semibold text-[var(--text-primary)] block">{option.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
