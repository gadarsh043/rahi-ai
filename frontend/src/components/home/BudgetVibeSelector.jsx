import { motion } from 'framer-motion';

const BUDGET_OPTIONS = [
  { id: '$', symbols: '$', label: 'Budget', desc: 'Hostels & street food', weight: 'default' },
  { id: '$$', symbols: '$$', label: 'Comfortable', desc: 'Mid-range stays', weight: 'default' },
  { id: '$$$', symbols: '$$$', label: 'Premium', desc: 'Upscale experiences', weight: 'default' },
  { id: '$$$$', symbols: '$$$$', label: 'Luxury', desc: 'The finest of everything', weight: 'emphasis' },
];

export default function BudgetVibeSelector({ value, onChange }) {
  return (
    <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg">
      {BUDGET_OPTIONS.map((option) => {
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
              glass dark:glass-dark rounded-2xl px-4 py-4 text-center border-2 cursor-pointer transition-all duration-150
              ${isSelected
                ? 'border-brand-500 bg-brand-500/8 dark:bg-brand-500/12 shadow-brand'
                : 'border-transparent hover:border-brand-500/30'
              }
              ${isEmphasis ? 'py-5' : ''}
            `}
          >
            <span className={`block font-bold text-[var(--text-primary)] ${isEmphasis ? 'text-3xl' : 'text-2xl'}`}>
              {option.symbols}
            </span>
            <span className="text-sm font-semibold text-[var(--text-primary)] block mt-1.5">{option.label}</span>
            <span className="text-xs text-[var(--text-muted)] mt-0.5 block">{option.desc}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
