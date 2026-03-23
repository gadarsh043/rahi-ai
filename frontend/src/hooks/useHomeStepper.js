import { useState, useCallback, useMemo } from 'react';

const INITIAL_FORM_DATA = {
  origin: null,
  destination: null,
  startDate: null,
  endDate: null,
  isFlexible: false,
  numDays: 7,
  numTravelers: 1,
  travelGroup: null,
  pace: [],
  budgetVibe: null,
  preferences: [],
  accommodationType: [],
  passportCountry: null,
  livesInDestination: null,
  instructions: '',
};

const STEP_COUNT = 10;

function getNextStep(current) {
  if (current >= STEP_COUNT - 1) return current;
  return current + 1;
}

function getPrevStep(current) {
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
      if (formData.isFlexible) return formData.numDays != null && formData.numDays >= 1;
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
      return formData.travelGroup != null;
    case 4:
      return Array.isArray(formData.pace) ? formData.pace.length > 0 : !!formData.pace;
    case 5:
      return formData.budgetVibe != null;
    case 6:
      return Array.isArray(formData.preferences) && formData.preferences.length >= 2;
    case 7:
      return Array.isArray(formData.accommodationType) && formData.accommodationType.length > 0;
    case 8:
      return formData.passportCountry != null && (typeof formData.passportCountry === 'object' ? formData.passportCountry?.name : String(formData.passportCountry).trim() !== '');
    case 9:
      return true;
    default:
      return false;
  }
}

function buildPromptText(formData) {
  const data = formData;
  const parts = [];

  const paceArr = Array.isArray(data.pace) ? data.pace : (data.pace ? [data.pace] : []);
  if (paceArr.length > 0 || data.budgetVibe) {
    const paceText = paceArr.length > 0 ? paceArr.join(' + ') : '';
    const budgetText = data.budgetVibe || '';
    if (paceText && budgetText) {
      parts.push(`I want a ${paceText} ${budgetText} trip`);
    } else if (paceText) {
      parts.push(`I want a ${paceText} trip`);
    } else {
      parts.push(`I want a ${budgetText} trip`);
    }
  } else {
    parts.push('I want a trip');
  }

  const originCity = typeof data.origin === 'object' && data.origin?.city ? data.origin.city : (data.origin && typeof data.origin === 'string' ? data.origin : null);
  const destCity = typeof data.destination === 'object' && data.destination?.city ? data.destination.city : (data.destination && typeof data.destination === 'string' ? data.destination : null);
  if (originCity) parts.push(`from ${originCity}`);
  if (destCity) parts.push(`to ${destCity}`);

  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = new Date(data.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const days = Math.ceil((new Date(data.endDate) - new Date(data.startDate)) / (1000 * 60 * 60 * 24)) + 1;
    parts.push(`for ${days} day${days > 1 ? 's' : ''} (${start} – ${end})`);
  } else if (data.isFlexible && data.numDays) {
    parts.push(`for about ${data.numDays} days`);
  }

  if (data.travelGroup) {
    const groupLabels = { solo: 'solo', couple: 'as a couple', friends: 'with friends', family: 'with family', work: 'for work' };
    parts.push(groupLabels[data.travelGroup] || data.travelGroup);
  }

  if (data.numTravelers && Number(data.numTravelers) > 1) {
    parts.push(`(${Number(data.numTravelers)} people)`);
  }

  const prefs = Array.isArray(data.preferences) ? data.preferences : [];
  if (prefs.length > 0) {
    const top = prefs.slice(0, 3).join(', ');
    const extra = prefs.length > 3 ? ` +${prefs.length - 3} more` : '';
    parts.push(`focused on ${top}${extra}`);
  }

  const accomArr = Array.isArray(data.accommodationType) ? data.accommodationType : (data.accommodationType ? [data.accommodationType] : []);
  if (accomArr.length > 0) {
    const accomText = accomArr.map((a) => `${a}s`).join(' & ');
    parts.push(`staying in ${accomText}`);
  }

  if (data.instructions && String(data.instructions).trim()) {
    const short = data.instructions.length > 40 ? data.instructions.slice(0, 40) + '...' : data.instructions;
    parts.push(`(${short})`);
  }

  return parts.join(' ');
}

export function useHomeStepper() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [direction, setDirection] = useState('forward');

  const goNext = useCallback(() => {
    setDirection('forward');
    setCurrentStep((s) => getNextStep(s));
  }, []);

  const goBack = useCallback(() => {
    setDirection('backward');
    setCurrentStep((s) => getPrevStep(s));
  }, []);

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
  const promptBase = useMemo(
    () => buildPromptText({ ...formData, instructions: '' }),
    [formData]
  );
  const isLastStep = currentStep === STEP_COUNT - 1;

  // Build a partial prompt including only fields from steps 0..upToStep
  const promptForStep = useCallback((upToStep) => {
    const masked = { ...INITIAL_FORM_DATA };
    if (upToStep >= 0) masked.origin = formData.origin;
    if (upToStep >= 1) masked.destination = formData.destination;
    if (upToStep >= 2) {
      masked.startDate = formData.startDate;
      masked.endDate = formData.endDate;
      masked.isFlexible = formData.isFlexible;
      masked.numDays = formData.numDays;
    }
    if (upToStep >= 3) {
      masked.travelGroup = formData.travelGroup;
      masked.numTravelers = formData.numTravelers;
    }
    if (upToStep >= 4) masked.pace = formData.pace;
    if (upToStep >= 5) masked.budgetVibe = formData.budgetVibe;
    if (upToStep >= 6) masked.preferences = formData.preferences;
    if (upToStep >= 7) masked.accommodationType = formData.accommodationType;
    if (upToStep >= 8) masked.passportCountry = formData.passportCountry;
    if (upToStep >= 9) masked.instructions = formData.instructions;
    return buildPromptText(masked);
  }, [formData]);

  return {
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
    resetForm,
  };
}
