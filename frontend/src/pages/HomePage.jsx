import { AnimatePresence, motion } from 'framer-motion';
import { useHomeStepper } from '../hooks/useHomeStepper';
import { STEP_CONFIG } from '../utils/stepConfig';
import StepQuestion from '../components/home/StepQuestion';
import StepIndicator from '../components/home/StepIndicator';
import StepNavigation from '../components/home/StepNavigation';
import StepContentPlaceholder from '../components/home/StepContentPlaceholder';
import PromptBox from '../components/home/PromptBox';
import JoinTrip from '../components/home/JoinTrip';

export default function HomePage() {
  const {
    currentStep,
    formData,
    direction,
    canProceed,
    promptText,
    isLastStep,
    goNext,
    goBack,
    goToStep,
    updateField,
  } = useHomeStepper();

  const config = STEP_CONFIG[currentStep];
  const isForward = direction === 'forward';

  return (
    <div className="flex flex-1 min-h-0 min-w-0">
      <div className="flex flex-1 flex-col items-center min-w-0">
        <div className="flex flex-1 flex-col w-full max-w-lg px-4 py-8 min-h-0 pb-32">
        <StepQuestion
          icon={config?.icon}
          question={config?.question}
          subtitle={config?.subtitle}
        />

        <div className="flex-1 min-h-[200px] mt-2">
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

        <div className="mt-8 pt-6 space-y-6">
          <StepIndicator currentStep={currentStep} onStepClick={goToStep} />
          <StepNavigation
            currentStep={currentStep}
            canProceed={canProceed}
            onBack={goBack}
            onNext={goNext}
          />
        </div>

        <PromptBox
          promptText={promptText}
          isComplete={isLastStep}
          formData={formData}
          onGenerate={(data) => console.log('Generate trip — formData:', data)}
        />
        <JoinTrip />
        </div>
      </div>
    </div>
  );
}
