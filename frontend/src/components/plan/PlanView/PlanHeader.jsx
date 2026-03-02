import useTripStore from '../../../stores/tripStore';
import ShareButton from '../ShareButton/ShareButton';
import SuggestionsPanel from '../SuggestionsPanel/SuggestionsPanel';

export default function PlanHeader() {
  const trip = useTripStore((s) => s.trip);
  const mode = useTripStore((s) => s.mode);

  if (!trip) return null;

  return (
    <header className="mb-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">
            {trip.originCity} → {trip.destinationCity}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {trip.numDays} days · {trip.pace} · {trip.budgetVibe}
          </p>
        </div>
        {mode !== 'shared' && (
          <div className="flex items-center gap-2">
            <SuggestionsPanel tripId={trip.id} />
            <ShareButton />
          </div>
        )}
      </div>
    </header>
  );
}


