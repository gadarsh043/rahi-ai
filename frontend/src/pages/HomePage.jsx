import { AnimatePresence, motion } from 'framer-motion';
import { useHomeStepper } from '../hooks/useHomeStepper';
import { STEP_CONFIG } from '../utils/stepConfig';
import StepQuestion from '../components/home/StepQuestion';
import StepNavigation from '../components/home/StepNavigation';
import StepContentPlaceholder from '../components/home/StepContentPlaceholder';
import PromptBox from '../components/home/PromptBox';
import JoinTrip from '../components/home/JoinTrip';

const STEP_HELPERS = [
  { step: 0, prefix: 'Not sure? ', action: 'Use your current location →' },
  { step: 1, prefix: 'Not sure where to go? ', action: 'Browse trending destinations →' },
  { step: 2, prefix: null, action: null },
  { step: 3, prefix: 'Not sure yet? ', action: 'Skip duration for now →', onAction: true },
  { step: 4, prefix: 'Not sure? ', action: 'See what each pace means →' },
  { step: 5, prefix: null, action: null },
  { step: 6, prefix: 'Looking for inspiration? ', action: 'Join a curated trip →' },
  { step: 7, prefix: null, action: null },
  { step: 8, prefix: null, action: null },
  { step: 9, prefix: null, action: null },
];

export default function HomePage() {
  const {
    currentStep,
    formData,
    direction,
    canProceed,
    promptText,
    promptBase,
    isLastStep,
    goNext,
    goBack,
    updateField,
  } = useHomeStepper();

  const config = STEP_CONFIG[currentStep];
  const isForward = direction === 'forward';
  const helper = STEP_HELPERS[currentStep];

  const handleGenerate = (data, promptString) => {
    const base = (promptBase || '').trim();
    const edited = (promptString || '').trim();
    const newInstructions = base && edited.startsWith(base)
      ? edited.slice(base.length).trim()
      : edited;
    updateField('instructions', newInstructions);
    const dataToSend = { ...data, instructions: newInstructions };
    console.log('Generate trip — formData:', dataToSend);
    console.log('Generate trip — prompt (for AI):', promptString);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canProceed) return;
    if (isLastStep) {
      handleGenerate(formData, promptText);
    } else {
      goNext();
    }
  };

  return (
    <div className="flex flex-1 min-h-0 min-w-0 bg-gradient-to-b from-brand-50 via-transparent to-transparent dark:from-brand-950/30">
      <div className="flex flex-1 flex-col items-center justify-center py-8 min-h-[calc(100vh-56px)] min-w-0">
        <form
          className="flex flex-col w-full max-w-2xl flex-1 min-h-0 pb-32"
          onSubmit={handleSubmit}
        >
          {/* Progress bar */}
          <div className="flex items-center gap-3 mb-6 w-full max-w-2xl mx-auto px-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-500 shrink-0">
              Step {currentStep + 1} of 10
            </span>
            <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden min-w-0">
              <div
                className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentStep + 1) / 10) * 100}%` }}
              />
            </div>
          </div>

          {/* Content card */}
          <div className="bg-white dark:bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 md:p-10 w-full max-w-2xl mx-auto shadow-sm dark:shadow-none">
            <StepQuestion
              icon={config?.icon}
              question={config?.question}
              subtitle={config?.subtitle}
            />

            <div className="flex-1 min-h-[200px] mt-6">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentStep}
                  initial={{
                    opacity: 0,
                    x: isForward ? 20 : -20,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: isForward ? -20 : 20,
                  }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <StepContentPlaceholder
                    step={currentStep}
                    formData={formData}
                    updateField={updateField}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {helper && (helper.prefix != null || helper.action != null) && (
              <div className="mt-6 pt-4 border-t border-[var(--border)] text-center">
                <span className="text-sm text-[var(--text-muted)]">
                  {helper.prefix}
                  <button
                    type="button"
                    onClick={helper.onAction ? goNext : undefined}
                    className="text-brand-500 font-medium hover:underline cursor-pointer"
                  >
                    {helper.action}
                  </button>
                </span>
              </div>
            )}
          </div>

          {/* Navigation below card */}
          <div className="mt-8 flex flex-row justify-center items-center gap-3">
            <StepNavigation
              currentStep={currentStep}
              canProceed={canProceed}
              onBack={goBack}
              onNext={goNext}
            />
          </div>

          <PromptBox
          promptText={promptText}
          promptBase={promptBase}
          instructions={formData.instructions ?? ''}
          isComplete={isLastStep}
          formData={formData}
          onGenerate={handleGenerate}
        />
        <JoinTrip />
        </form>
      </div>
    </div>
  );
}
