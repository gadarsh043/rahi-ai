import useTripStore from '../../../stores/tripStore';

export default function PlanHeader() {
  const trip = useTripStore((s) => s.trip);

  if (!trip) return null;

  return (
    <header className="mb-3">
      <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">
        {trip.originCity} → {trip.destinationCity}
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mt-1">
        {trip.numDays} days · {trip.pace} · {trip.budgetVibe}
      </p>
    </header>
  );
}

