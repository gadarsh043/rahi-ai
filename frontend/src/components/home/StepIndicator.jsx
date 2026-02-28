const TOTAL_STEPS = 10;

export default function StepIndicator({ currentStep, onStepClick }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const isActive = i === currentStep;
        const isCompleted = i < currentStep;
        const isClickable = isCompleted && typeof onStepClick === 'function';
        return (
          <button
            key={i}
            type="button"
            onClick={isClickable ? () => onStepClick(i) : undefined}
            disabled={!isClickable}
            className={`
              h-2 rounded-full flex-shrink-0 transition-all duration-300 ease-out
              ${isActive ? 'w-6 bg-brand-500' : 'w-2'}
              ${isCompleted && !isActive ? 'bg-brand-500' : ''}
              ${!isActive && !isCompleted ? 'bg-[var(--border)]' : ''}
              ${isClickable ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}
            `}
            aria-label={isActive ? `Step ${i + 1} of ${TOTAL_STEPS}, current` : isCompleted ? `Step ${i + 1}, go back` : `Step ${i + 1}`}
            aria-current={isActive ? 'step' : undefined}
          />
        );
      })}
    </div>
  );
}
