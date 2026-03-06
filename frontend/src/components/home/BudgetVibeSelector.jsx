import { motion } from 'framer-motion';

const BUDGET_OPTIONS = [
  { id: '$', symbols: '$', label: 'Budget', desc: 'Keep it cheap & local', weight: 'default' },
  { id: '$$', symbols: '$$', label: 'Comfortable', desc: 'Good value, no compromises', weight: 'default' },
  { id: '$$$', symbols: '$$$', label: 'Premium', desc: 'Treat yourself a little', weight: 'default' },
  { id: '$$$$', symbols: '$$$$', label: 'Luxury', desc: 'Go all out, no limits', weight: 'emphasis' },
];

export default function BudgetVibeSelector({ value, onChange }) {
  return (
    <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
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
              bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-4 py-4 text-center border-2 cursor-pointer transition-all duration-150
              ${isSelected
                ? 'border-brand-500 bg-brand-500/8 dark:bg-brand-500/12'
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
