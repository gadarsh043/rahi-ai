/**
 * Placeholder step content so we can test the full stepper flow.
 * Uses real components for origin/destination + dates. Other steps are simple stubs for now.
 */
import CityAutocomplete from './CityAutocomplete';
import { getCitiesByNames } from '../../utils/mockCities';
import TripDatePicker from './TripDatePicker';
import DurationSlider from './DurationSlider';

const POPULAR_ORIGIN = getCitiesByNames(['Dubai', 'London', 'Singapore', 'Delhi']);
const POPULAR_DESTINATION = getCitiesByNames(['Paris', 'Tokyo', 'Bali', 'New York']);

export default function StepContentPlaceholder({ step, formData, updateField }) {
  switch (step) {
    case 0:
      return (
        <CityAutocomplete
          placeholder="e.g. Paris, Mumbai"
          value={formData.origin}
          onChange={(city) => updateField('origin', city)}
          popularCities={POPULAR_ORIGIN}
        />
      );
    case 1:
      return (
        <CityAutocomplete
          placeholder="e.g. Tokyo, Bali"
          value={formData.destination}
          onChange={(city) => updateField('destination', city)}
          popularCities={POPULAR_DESTINATION}
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
        <div className="mt-6 flex flex-wrap gap-2 max-w-md">
          {['relaxed', 'moderate', 'active', 'intense'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => updateField('pace', p)}
              className={`rounded-xl px-4 py-2 text-sm font-medium border transition-colors ${
                formData.pace === p
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      );
    case 5:
      return (
        <div className="mt-6 flex flex-wrap gap-2 max-w-md">
          {['$', '$$', '$$$', '$$$$'].map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => updateField('budgetVibe', b)}
              className={`rounded-xl px-4 py-2 text-sm font-medium border transition-colors ${
                formData.budgetVibe === b
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      );
    case 6:
      return (
        <div className="mt-6 max-w-md">
          <p className="text-sm text-[var(--text-muted)]">Optional — tap Next to continue.</p>
        </div>
      );
    case 7:
      return (
        <div className="mt-6 flex flex-wrap gap-2 max-w-md">
          {['Hotel', 'Hostel', 'Apartment'].map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => updateField('accommodationType', a)}
              className={`rounded-xl px-4 py-2 text-sm font-medium border transition-colors ${
                formData.accommodationType === a
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      );
    case 8:
      return (
        <div className="mt-6 max-w-md">
          <input
            type="text"
            placeholder="e.g. United States"
            value={formData.passportCountry ?? ''}
            onChange={(e) => updateField('passportCountry', e.target.value || null)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-brand-500 focus:outline-none"
          />
        </div>
      );
    case 9:
      return (
        <div className="mt-6 max-w-md">
          <textarea
            placeholder="Any special requests..."
            value={formData.instructions ?? ''}
            onChange={(e) => updateField('instructions', e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-brand-500 focus:outline-none resize-none"
          />
        </div>
      );
    default:
      return null;
  }
}
