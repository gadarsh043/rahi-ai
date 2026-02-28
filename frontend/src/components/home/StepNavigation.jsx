import { motion } from 'framer-motion';

export default function StepNavigation({ currentStep, canProceed, onBack, onNext }) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === 9;

  return (
    <div className="flex flex-row justify-center items-center gap-3">
      {!isFirstStep && (
        <motion.button
          type="button"
          onClick={onBack}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="border border-[var(--border)] text-[var(--text-secondary)] rounded-xl px-5 py-2.5 font-medium hover:bg-[var(--surface-hover)] transition-colors duration-150 ease-out"
        >
          ← Back
        </motion.button>
      )}
      <motion.button
        type="submit"
        disabled={!canProceed}
        whileTap={canProceed ? { scale: 0.97 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`
          bg-gradient-to-r from-brand-400 to-brand-600 text-white rounded-xl px-8 py-3 font-semibold shadow-brand
          hover:from-brand-500 hover:to-brand-700 active:scale-[0.97] transition-all duration-150 ease-out
          ${!canProceed ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isLastStep ? 'Generate Trip ✨' : 'Next →'}
      </motion.button>
    </div>
  );
}
