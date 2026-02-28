/**
 * Placeholder step content so we can test the full stepper flow.
 * Replace with real components (DatePicker, etc.) for remaining steps.
 */
import CityAutocomplete from './CityAutocomplete';
import { getCitiesByNames } from '../../utils/mockCities';

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
        <div className="mt-6 max-w-md space-y-3">
          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={formData.isFlexible ?? false}
              onChange={(e) => updateField('isFlexible', e.target.checked)}
              className="rounded border-[var(--border)]"
            />
            Flexible dates
          </label>
          <button
            type="button"
            onClick={() => updateField('startDate', new Date())}
            className="border border-[var(--border)] text-[var(--text-secondary)] rounded-xl px-4 py-2 text-sm hover:bg-[var(--surface-hover)]"
          >
            Set start date (today)
          </button>
          {formData.startDate && (
            <button
              type="button"
              onClick={() => updateField('endDate', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}
              className="block border border-[var(--border)] text-[var(--text-secondary)] rounded-xl px-4 py-2 text-sm hover:bg-[var(--surface-hover)]"
            >
              Set end date (+7 days)
            </button>
          )}
        </div>
      );
    case 3:
      return (
        <div className="mt-6 max-w-md">
          <input
            type="number"
            min={1}
            max={30}
            value={formData.numDays ?? 7}
            onChange={(e) => updateField('numDays', parseInt(e.target.value, 10) || 7)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] focus:border-brand-500 focus:outline-none"
          />
        </div>
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
