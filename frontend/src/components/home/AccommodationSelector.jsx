import { motion } from 'framer-motion';

const ACCOMMODATION_OPTIONS = [
  { id: 'Hotel', emoji: '🏨', label: 'Hotel', desc: 'Comfort & room service' },
  { id: 'Hostel', emoji: '🛏', label: 'Hostel', desc: 'Social & budget-friendly' },
  { id: 'Apartment', emoji: '🏠', label: 'Apartment', desc: 'Home away from home' },
];

export default function AccommodationSelector({ value, onChange }) {
  return (
    <div className="mt-6 grid grid-cols-3 gap-3 max-w-lg mx-auto">
      {ACCOMMODATION_OPTIONS.map((option) => {
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
              bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 text-center border-2 cursor-pointer transition-all duration-150
              ${isSelected
                ? 'border-brand-500 bg-brand-500/8 dark:bg-brand-500/12'
                : 'border-transparent hover:border-brand-500/30'
              }
            `}
          >
            <span className="text-3xl block mb-2">{option.emoji}</span>
            <span className="text-sm font-semibold text-[var(--text-primary)] block">{option.label}</span>
            <span className="text-xs text-[var(--text-muted)] mt-1 block">{option.desc}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
