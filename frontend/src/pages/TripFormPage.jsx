import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useHomeStepper } from '../hooks/useHomeStepper';
import { STEP_CONFIG } from '../utils/stepConfig';
import StepQuestion from '../components/home/StepQuestion';
import StepContentPlaceholder from '../components/home/StepContentPlaceholder';
import useTourStore from '../stores/tourStore';
import useTourCheck from '../hooks/useTourCheck';
import { trackEvent } from '../services/posthog';

function getStepLabel(step, data) {
  switch (step) {
    case 0: return data.origin?.city || null;
    case 1: return data.destination?.city || null;
    case 2: {
      if (data.isFlexible) return 'Flexible dates';
      if (data.startDate && data.endDate) {
        const s = new Date(data.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const e = new Date(data.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${s} – ${e}`;
      }
      return null;
    }
    case 3: {
      const labels = { solo: 'Solo', couple: 'Couple', friends: 'Friends', family: 'Family', work: 'Work Trip' };
      return data.travelGroup ? labels[data.travelGroup] : null;
    }
    case 4: {
      const p = Array.isArray(data.pace) ? data.pace : (data.pace ? [data.pace] : []);
      return p.length > 0 ? p.join(' + ') : null;
    }
    case 5: return data.budgetVibe || null;
    case 6: {
      const p = data.preferences || [];
      return p.length > 0 ? (p.length <= 2 ? p.join(', ') : `${p.slice(0, 2).join(', ')} +${p.length - 2}`) : null;
    }
    case 7: {
      const a = Array.isArray(data.accommodationType) ? data.accommodationType : (data.accommodationType ? [data.accommodationType] : []);
      return a.length > 0 ? a.join(' + ') : null;
    }
    case 8: return data.passportCountry?.name || null;
    case 9: return data.instructions?.trim() ? 'Extra notes' : null;
    default: return null;
  }
}

const STEP_NAMES = [
  'origin',
  'destination',
  'dates',
  'travel_group',
  'pace',
  'budget',
  'preferences',
  'accommodation',
  'passport_country',
  'extras',
];

export default function TripFormPage() {
  const {
    currentStep,
    formData,
    direction,
    canProceed,
    promptText,
    promptBase,
    promptForStep,
    isLastStep,
    goNext,
    goBack,
    goToStep,
    updateField,
  } = useHomeStepper();

  const navigate = useNavigate();
  const [flyingPill, setFlyingPill] = useState(null);
  const [promptGlow, setPromptGlow] = useState(false);
  const [displayPrompt, setDisplayPrompt] = useState('');
  // Ref to snapshot promptText AFTER goNext updates formData
  const pendingPromptUpdate = useRef(false);

  const triggerAddedAnimation = useCallback((label) => {
    if (!label) return;
    setFlyingPill({ label, key: Date.now() });
    pendingPromptUpdate.current = true;
    // Prompt updates when pill "lands" — synced with animation timing
    setTimeout(() => {
      pendingPromptUpdate.current = false;
      setPromptGlow(true);
    }, 1050);
    setTimeout(() => setPromptGlow(false), 1800);
  }, []);

  useTourCheck('form', true, 1500);

  // Navigate form to match tour step
  const activeTour = useTourStore((s) => s.activeTour);
  const goToStepRef = useRef(goToStep);
  goToStepRef.current = goToStep;

  useEffect(() => {
    if (!activeTour || activeTour.page !== 'form') return;
    const tourStep = activeTour.steps[activeTour.currentIndex];
    if (tourStep?.formStep != null) {
      goToStepRef.current(tourStep.formStep);
    }
  }, [activeTour]);

  // Demo prompt for the prompt tour step
  const DEMO_PROMPT = 'I want a moderate $$ trip from San Francisco to Tokyo for 8 days as a couple focused on culture, food, nightlife staying in hotels';
  const tourOnPrompt = activeTour?.page === 'form'
    && activeTour.steps[activeTour.currentIndex]?.featureId === 'form-prompt';

  const config = STEP_CONFIG[currentStep];
  const isForward = direction === 'forward';
  const isFirstStep = currentStep === 0;

  const buildGenerateParams = (data, promptString) => {
    const base = (promptBase || '').trim();
    const edited = (promptString || '').trim();
    const newInstructions = base && edited.startsWith(base)
      ? edited.slice(base.length).trim()
      : edited;
    updateField('instructions', newInstructions);
    const dataToSend = { ...data, instructions: newInstructions };

    const origin =
      dataToSend.origin && typeof dataToSend.origin === 'object'
        ? dataToSend.origin
        : null;
    const destination =
      dataToSend.destination && typeof dataToSend.destination === 'object'
        ? dataToSend.destination
        : null;
    const passport =
      dataToSend.passportCountry &&
      typeof dataToSend.passportCountry === 'object'
        ? dataToSend.passportCountry.name
        : dataToSend.passportCountry;

    const startDate =
      dataToSend.startDate instanceof Date
        ? dataToSend.startDate.toISOString().slice(0, 10)
        : dataToSend.startDate;
    const endDate =
      dataToSend.endDate instanceof Date
        ? dataToSend.endDate.toISOString().slice(0, 10)
        : dataToSend.endDate;

    const generateParams = {
      origin_city: origin?.city || (dataToSend.origin || ''),
      origin_country: origin?.country || '',
      origin_lat: origin?.lat ?? 0,
      origin_lng: origin?.lng ?? 0,
      destination_city: destination?.city || (dataToSend.destination || ''),
      destination_country: destination?.country || '',
      destination_lat: destination?.lat ?? 0,
      destination_lng: destination?.lng ?? 0,
      start_date: startDate || null,
      end_date: endDate || null,
      num_days: (startDate && endDate)
        ? Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1
        : (dataToSend.numDays ?? 7),
      pace: Array.isArray(dataToSend.pace) && dataToSend.pace.length > 0
        ? dataToSend.pace.join(' + ')
        : (dataToSend.pace || 'moderate'),
      budget_vibe: dataToSend.budgetVibe || '$$',
      accommodation_type: Array.isArray(dataToSend.accommodationType) && dataToSend.accommodationType.length > 0
        ? dataToSend.accommodationType.join(' + ')
        : (dataToSend.accommodationType || 'hotel'),
      preferences: dataToSend.preferences || [],
      passport_country: passport || '',
      instructions: dataToSend.instructions || '',
      dietary: dataToSend.dietary || [],
      disability: dataToSend.disability || [],
      travel_group: dataToSend.travelGroup || 'solo',
      num_travelers: dataToSend.numTravelers || 1,
      lives_in_destination: dataToSend.livesInDestination,
      currency: dataToSend.currency || 'USD',
    };

    return generateParams;
  };

  const handleGenerate = (data, promptString) => {
    const generateParams = buildGenerateParams(data, promptString);
    trackEvent('trip_generate_clicked', {
      origin: generateParams.origin_city,
      destination: generateParams.destination_city,
      num_days: generateParams.num_days,
      pace: generateParams.pace,
      budget_vibe: generateParams.budget_vibe,
    });
    navigate('/plan/new', { state: { generateParams } });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canProceed) return;
    if (isLastStep) {
      handleGenerate(formData, promptText);
    } else {
      const label = getStepLabel(currentStep, formData);
      const stepIdx = currentStep;
      const stepName = STEP_NAMES[stepIdx] || `step_${stepIdx + 1}`;
      trackEvent('form_step_completed', {
        step: stepIdx + 1,
        step_name: stepName,
      });
      triggerAddedAnimation(label);
      // Brief delay so user sees the pill lift before step transitions
      setTimeout(() => goNext(), 150);
      // Update displayed prompt when pill lands — show prompt up to this step
      setTimeout(() => setDisplayPrompt(promptForStep(stepIdx)), 1100);
    }
  };

  return (
    <form
      className="flex flex-col h-[calc(100dvh-var(--topbar-height))] lg:h-[calc(100dvh-var(--topbar-height))]"
      onSubmit={handleSubmit}
    >
      {/* Main area */}
      <div className="flex-1 flex flex-col items-center px-3 md:px-6 py-4 min-h-0 overflow-y-auto">
        {/* Card + side nav buttons row */}
        <div className="w-full max-w-4xl flex items-center gap-3 flex-1 min-h-0">
          {/* Back button — left side of card (desktop) */}
          <div className="hidden md:flex shrink-0 w-20 justify-center">
            {!isFirstStep && (
              <button
                type="button"
                onClick={() => { setDisplayPrompt(promptForStep(currentStep - 2)); goBack(); }}
                className="w-11 h-11 rounded-full border border-[var(--border)] bg-white dark:bg-[var(--surface)] text-[var(--text-secondary)] flex items-center justify-center hover:bg-[var(--surface-hover)] transition-colors cursor-pointer shadow-sm text-lg"
                aria-label="Back"
              >
                &larr;
              </button>
            )}
          </div>

          {/* Floating card */}
          <div className="flex-1 min-w-0 relative">
            <div data-tour="form-card" className="relative bg-white dark:bg-[var(--surface)] rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.3)] overflow-hidden">
              {/* Warm gradient wash on the left */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -left-20 -top-20 w-80 h-80 bg-gradient-to-br from-brand-200/40 via-brand-100/20 to-transparent rounded-full blur-3xl" />
                <div className="absolute -left-10 bottom-0 w-60 h-60 bg-gradient-to-tr from-brand-100/30 to-transparent rounded-full blur-2xl" />
              </div>

              <div className="relative z-10 flex flex-col min-h-[min(65dvh,560px)]">
                {/* Progress bar — top of card */}
                <div data-tour="form-progress" className="flex items-center gap-3 px-5 md:px-8 pt-5 pb-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0"
                  >
                    &larr; Home
                  </button>
                  <div className="flex-1 h-1.5 bg-brand-100 dark:bg-[var(--border)] rounded-full overflow-hidden min-w-0">
                    <div
                      className="h-full bg-gradient-to-r from-brand-400 to-brand-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${((currentStep + 1) / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--text-muted)] shrink-0">
                    {currentStep + 1}/10
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col items-center justify-start px-5 md:px-8 pt-6 pb-6 min-h-0 overflow-y-auto">
                  <div className="w-full max-w-xl">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-500 text-center mb-3">
                      Step {currentStep + 1} of 10
                    </p>

                    <StepQuestion
                      icon={config?.icon}
                      question={config?.question}
                      subtitle={config?.subtitle}
                    />

                    <div className="mt-5">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={currentStep}
                          initial={{ opacity: 0, x: isForward ? 20 : -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: isForward ? -20 : 20 }}
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
                  </div>
                </div>

                {/* Mobile-only back/next inside card bottom */}
                <div className="md:hidden shrink-0 border-t border-brand-100 dark:border-[var(--border)] px-5 py-3 flex items-center justify-between">
                  {!isFirstStep ? (
                    <button
                      type="button"
                      onClick={() => { setDisplayPrompt(promptForStep(currentStep - 2)); goBack(); }}
                      className="text-sm font-medium text-[var(--text-secondary)] cursor-pointer"
                    >
                      &larr; Back
                    </button>
                  ) : <div />}
                  <button
                    type="submit"
                    disabled={!canProceed}
                    className={`bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-2.5 text-sm font-semibold active:scale-[0.97] transition-all ${isLastStep ? 'px-8' : 'px-6'} ${!canProceed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {isLastStep ? 'Generate' : 'Next \u2192'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Next button — right side of card (desktop) */}
          <div className="hidden md:flex shrink-0 w-20 justify-center">
            <button
              type="submit"
              disabled={!canProceed}
              className={`w-11 h-11 rounded-full bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 active:scale-[0.95] transition-all shadow-sm text-lg ${!canProceed ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              aria-label={isLastStep ? 'Generate' : 'Next'}
            >
              {isLastStep ? '✓' : '\u2192'}
            </button>
          </div>
        </div>

        {/* Flying pill animation */}
        <div className="w-full max-w-3xl relative h-0 overflow-visible">
          <AnimatePresence>
            {flyingPill && (
              <motion.div
                key={flyingPill.key}
                initial={{ opacity: 1, y: -300, scale: 2.08 }}
                animate={{ opacity: [1, 1, 1, 0.85, 0], y: [-280, -280, -260, 10, 36], scale: [1.08, 1.08, 1.02, 0.92, 0.82] }}
                transition={{
                  duration: 1.5,
                  ease: [0.22, 1, 0.36, 1],
                  times: [0, 0.2, 0.4, 0.85, 1],
                }}
                onAnimationComplete={() => setFlyingPill(null)}
                className="flex justify-center pointer-events-none absolute inset-x-0 top-0 z-10"
              >
                <span className="bg-brand-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-[0_4px_16px_rgba(249,115,22,0.35)] whitespace-nowrap">
                  + {flyingPill.label}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Prompt preview — updates only when pill lands, live on last step */}
        <div data-tour="form-prompt" className="w-full max-w-3xl mt-4 shrink-0">
          {(tourOnPrompt || isLastStep ? promptText : displayPrompt) || tourOnPrompt ? (
            <div
              className={`bg-white dark:bg-[var(--surface)] rounded-2xl px-5 py-3 transition-all duration-500 ease-out ${
                promptGlow
                  ? 'border border-brand-500/40 shadow-[0_0_16px_rgba(249,115,22,0.12)]'
                  : 'border border-[var(--border)]'
              }`}
            >
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                <span className="font-semibold text-brand-500">Request: </span>
                {tourOnPrompt ? DEMO_PROMPT : (isLastStep ? promptText : displayPrompt)}
              </p>
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)] text-center py-2">
              Your trip builds as you answer...
            </p>
          )}
        </div>
      </div>

      {/* Spacer for mobile bottom nav */}
      <div className="shrink-0 h-14 lg:h-0" />
    </form>
  );
}
