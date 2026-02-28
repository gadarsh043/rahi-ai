import { useState, useCallback, useMemo } from 'react';

const INITIAL_FORM_DATA = {
  origin: null,
  destination: null,
  startDate: null,
  endDate: null,
  isFlexible: false,
  numDays: 7,
  pace: null,
  budgetVibe: null,
  preferences: [],
  accommodationType: null,
  passportCountry: null,
  instructions: '',
};

const STEP_COUNT = 10;

function getNextStep(current, formData) {
  if (current === 2 && formData.isFlexible === false) return 4;
  if (current >= STEP_COUNT - 1) return current;
  return current + 1;
}

function getPrevStep(current, formData) {
  if (current === 4 && formData.isFlexible === false) return 2;
  if (current <= 0) return current;
  return current - 1;
}

function canProceedForStep(step, formData) {
  switch (step) {
    case 0:
      return formData.origin != null && (typeof formData.origin === 'object' ? formData.origin?.city : String(formData.origin).trim() !== '');
    case 1:
      return formData.destination != null && (typeof formData.destination === 'object' ? formData.destination?.city : String(formData.destination).trim() !== '');
    case 2:
      if (formData.isFlexible) return true;
      if (!formData.startDate || !formData.endDate) return false;
      {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDay = new Date(start);
        startDay.setHours(0, 0, 0, 0);
        const endDay = new Date(end);
        endDay.setHours(0, 0, 0, 0);
        return startDay >= today && endDay > startDay;
      }
    case 3:
      return formData.isFlexible && formData.numDays != null && formData.numDays >= 1;
    case 4:
      return formData.pace != null;
    case 5:
      return formData.budgetVibe != null;
    case 6:
      return Array.isArray(formData.preferences) && formData.preferences.length >= 2;
    case 7:
      return formData.accommodationType != null;
    case 8:
      return formData.passportCountry != null && (typeof formData.passportCountry === 'object' ? formData.passportCountry?.name : String(formData.passportCountry).trim() !== '');
    case 9:
      return true;
    default:
      return false;
  }
}

function buildPromptText(formData) {
  const parts = [];
  const originStr = typeof formData.origin === 'object' && formData.origin?.city
    ? `${formData.origin.city}`
    : formData.origin;
  const destStr = typeof formData.destination === 'object' && formData.destination?.city
    ? `${formData.destination.city}`
    : formData.destination;
  if (formData.pace) parts.push(formData.pace);
  if (formData.budgetVibe) parts.push(`${formData.budgetVibe} budget`);
  parts.push('trip');
  if (originStr) parts.push(`from ${originStr}`);
  if (destStr) parts.push(`to ${destStr}`);
  if (formData.startDate) {
    const start = formData.startDate instanceof Date ? formData.startDate : new Date(formData.startDate);
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (formData.endDate) {
      const end = formData.endDate instanceof Date ? formData.endDate : new Date(formData.endDate);
      const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      parts.push(`${startStr} – ${endStr}`);
    } else {
      parts.push(startStr);
    }
  }
  if (formData.isFlexible && formData.numDays) parts.push(`${formData.numDays} days`);
  if (formData.preferences?.length) parts.push(formData.preferences.join(', '));
  if (formData.accommodationType) parts.push(formData.accommodationType);
  if (formData.passportCountry) {
    const passportStr = typeof formData.passportCountry === 'object' && formData.passportCountry?.name
      ? formData.passportCountry.name
      : formData.passportCountry;
    parts.push(`Passport: ${passportStr}`);
  }
  if (formData.instructions?.trim()) parts.push(formData.instructions.trim());
  return parts.join(' ');
}

export function useHomeStepper() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [direction, setDirection] = useState('forward');

  const goNext = useCallback(() => {
    setDirection('forward');
    setCurrentStep((s) => getNextStep(s, formData));
  }, [formData]);

  const goBack = useCallback(() => {
    setDirection('backward');
    setCurrentStep((s) => getPrevStep(s, formData));
  }, [formData]);

  const updateField = useCallback((key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setCurrentStep(0);
    setDirection('forward');
  }, []);

  const goToStep = useCallback((step) => {
    if (step < 0 || step > STEP_COUNT - 1) return;
    setDirection(step > currentStep ? 'forward' : 'backward');
    setCurrentStep(step);
  }, [currentStep]);

  const canProceed = useMemo(() => canProceedForStep(currentStep, formData), [currentStep, formData]);
  const promptText = useMemo(() => buildPromptText(formData), [formData]);
  const isLastStep = currentStep === STEP_COUNT - 1;

  return {
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
    resetForm,
  };
}
