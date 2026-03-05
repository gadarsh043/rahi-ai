/**
 * Placeholder step content so we can test the full stepper flow.
 * Uses real components for origin/destination + dates. Other steps are simple stubs for now.
 */
import { useEffect } from 'react';
import CityAutocomplete from './CityAutocomplete';
import TripDatePicker from './TripDatePicker';
import DurationSlider from './DurationSlider';
import PaceSelector from './PaceSelector';
import BudgetVibeSelector from './BudgetVibeSelector';
import PreferencePills from './PreferencePills';
import AccommodationSelector from './AccommodationSelector';
import CountryAutocomplete from './CountryAutocomplete';
import InstructionsInput from './InstructionsInput';

function PassportStep({ formData, updateField }) {
  const passportCountry = formData.passportCountry?.name || '';
  const destinationCountry = formData.destination?.country || '';
  const destinationCity = formData.destination?.city || '';

  const sameCountry =
    passportCountry &&
    destinationCountry &&
    passportCountry.trim().toLowerCase() === destinationCountry.trim().toLowerCase();

  // If passport == destination, auto-set livesInDestination true silently.
  useEffect(() => {
    if (sameCountry && formData.livesInDestination !== true) {
      updateField('livesInDestination', true);
    }
  }, [sameCountry, formData.livesInDestination, updateField]);

  return (
    <div>
      <CountryAutocomplete
        placeholder="e.g. India, United States"
        value={formData.passportCountry}
        onChange={(country) => {
          updateField('passportCountry', country);
          // Reset if switching countries
          updateField('livesInDestination', null);
        }}
      />

      {passportCountry &&
        destinationCountry &&
        !sameCountry && (
          <div className="mt-6">
            <p className="text-sm font-medium text-[var(--text-secondary)] mb-3">
              Do you currently live in {destinationCity || destinationCountry}?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => updateField('livesInDestination', false)}
                className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                  formData.livesInDestination === false
                    ? 'border-brand-500 bg-brand-500/10 text-[var(--text-primary)]'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-brand-500/30'
                }`}
              >
                No, I&apos;m visiting
              </button>
              <button
                type="button"
                onClick={() => updateField('livesInDestination', true)}
                className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                  formData.livesInDestination === true
                    ? 'border-brand-500 bg-brand-500/10 text-[var(--text-primary)]'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-brand-500/30'
                }`}
              >
                Yes, I live / study / work there
              </button>
            </div>
          </div>
        )}
    </div>
  );
}

export default function StepContentPlaceholder({ step, formData, updateField }) {
  switch (step) {
    case 0:
      return (
        <CityAutocomplete
          placeholder="e.g. Paris, Mumbai"
          value={formData.origin}
          onChange={(city) => updateField('origin', city)}
        />
      );
    case 1:
      return (
        <div data-tour="destination">
          <CityAutocomplete
            placeholder="e.g. Tokyo, Bali"
            value={formData.destination}
            onChange={(city) => updateField('destination', city)}
          />
        </div>
      );
    case 2:
      return (
        <TripDatePicker
          startDate={formData.startDate}
          endDate={formData.endDate}
          isFlexible={formData.isFlexible}
          numDays={formData.numDays}
          onChange={({ startDate, endDate, isFlexible, numDays }) => {
            updateField('startDate', startDate);
            updateField('endDate', endDate);
            updateField('isFlexible', isFlexible);
            updateField('numDays', numDays);
          }}
        />
      );
    case 3:
      return (
        formData.isFlexible ? (
          <DurationSlider
            value={formData.numDays ?? 7}
            onChange={(days) => updateField('numDays', days)}
          />
        ) : (
          <div className="mt-6 max-w-md">
            <p className="text-sm text-[var(--text-muted)]">
              Turn on &quot;I&apos;m flexible&quot; in the previous step to adjust trip length here.
            </p>
          </div>
        )
      );
    case 4:
      return (
        <PaceSelector
          value={formData.pace}
          onChange={(pace) => updateField('pace', pace)}
        />
      );
    case 5:
      return (
        <div className="mt-6">
          <BudgetVibeSelector
            value={formData.budgetVibe}
            onChange={(budgetVibe) => updateField('budgetVibe', budgetVibe)}
          />

          <div className="mt-8">
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">
              How many travelers?
            </h3>
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() =>
                  updateField(
                    'numTravelers',
                    Math.max(1, (formData.numTravelers || 1) - 1)
                  )
                }
                disabled={(formData.numTravelers || 1) <= 1}
                className="w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-xl font-bold flex items-center justify-center hover:bg-[var(--surface-hover)] disabled:opacity-30 transition-all"
              >
                -
              </button>
              <span className="text-3xl font-bold text-[var(--text-primary)] w-12 text-center">
                {formData.numTravelers || 1}
              </span>
              <button
                type="button"
                onClick={() =>
                  updateField(
                    'numTravelers',
                    Math.min(10, (formData.numTravelers || 1) + 1)
                  )
                }
                disabled={(formData.numTravelers || 1) >= 10}
                className="w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-xl font-bold flex items-center justify-center hover:bg-[var(--surface-hover)] disabled:opacity-30 transition-all"
              >
                +
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)] text-center mt-2">
              Costs will be estimated per person
            </p>
          </div>
        </div>
      );
    case 6:
      return (
        <PreferencePills
          value={formData.preferences}
          onChange={(preferences) => updateField('preferences', preferences)}
        />
      );
    case 7:
      return (
        <AccommodationSelector
          value={formData.accommodationType}
          onChange={(accommodationType) => updateField('accommodationType', accommodationType)}
        />
      );
    case 8:
      return (
        <PassportStep formData={formData} updateField={updateField} />
      );
    case 9:
      return (
        <InstructionsInput
          value={formData.instructions}
          onChange={(text) => updateField('instructions', text)}
        />
      );
    default:
      return null;
  }
}
