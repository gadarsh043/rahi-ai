/**
 * Placeholder step content so we can test the full stepper flow.
 * Uses real components for origin/destination + dates. Other steps are simple stubs for now.
 */
import CityAutocomplete from './CityAutocomplete';
import TripDatePicker from './TripDatePicker';
import DurationSlider from './DurationSlider';
import PaceSelector from './PaceSelector';
import BudgetVibeSelector from './BudgetVibeSelector';
import PreferencePills from './PreferencePills';
import AccommodationSelector from './AccommodationSelector';
import CountryAutocomplete from './CountryAutocomplete';
import InstructionsInput from './InstructionsInput';

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
        <CityAutocomplete
          placeholder="e.g. Tokyo, Bali"
          value={formData.destination}
          onChange={(city) => updateField('destination', city)}
        />
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
        <BudgetVibeSelector
          value={formData.budgetVibe}
          onChange={(budgetVibe) => updateField('budgetVibe', budgetVibe)}
        />
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
        <CountryAutocomplete
          placeholder="e.g. India, United States"
          value={formData.passportCountry}
          onChange={(country) => updateField('passportCountry', country)}
        />
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
