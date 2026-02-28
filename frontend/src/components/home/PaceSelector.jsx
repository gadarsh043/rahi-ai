import { motion } from 'framer-motion';

const PACE_OPTIONS = [
  { id: 'relaxed', emoji: '😎', label: 'Relaxed', desc: 'Take it slow, savor every moment', weight: 'default' },
  { id: 'moderate', emoji: '🌿', label: 'Moderate', desc: 'Balance of rest and exploration', weight: 'emphasis' },
  { id: 'active', emoji: '🤸', label: 'Active', desc: 'See as much as you can', weight: 'default' },
  { id: 'intense', emoji: '🔥', label: 'Intense', desc: 'Non-stop, packed schedule', weight: 'default' },
];

export default function PaceSelector({ value, onChange }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 max-w-md">
      {PACE_OPTIONS.map((option) => {
        const isSelected = value === option.id;
        const isEmphasis = option.weight === 'emphasis';
        return (
          <motion.button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            whileTap={{ scale: 0.97 }}
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`
              glass dark:glass-dark rounded-2xl p-5 text-center border-2 cursor-pointer transition-all duration-150
              ${isSelected
                ? 'border-brand-500 bg-brand-500/8 dark:bg-brand-500/12 shadow-brand'
                : 'border-transparent hover:border-brand-500/30'
              }
              ${isEmphasis ? 'py-6' : ''}
            `}
          >
            <span className={`block mb-2 ${isEmphasis ? 'text-[2rem]' : 'text-3xl'}`}>{option.emoji}</span>
            <span className="text-base font-bold text-[var(--text-primary)] block">{option.label}</span>
            <span className="text-xs text-[var(--text-muted)] mt-1 block">{option.desc}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
