import useTripStore from '../../../stores/tripStore';

export default function PlanView() {
  const trip = useTripStore((s) => s.trip);

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Content Panel */}
      <div className="flex-1 min-w-0 overflow-y-auto p-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          {trip.originCity} → {trip.destinationCity}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {trip.numDays} days · {trip.pace} · {trip.budgetVibe}
        </p>
        <p className="mt-4 text-sm text-[var(--text-muted)]">Plan View shell loaded. Tabs coming next.</p>
      </div>

      {/* Map Panel placeholder */}
      <div className="hidden lg:block w-[45%] bg-[var(--surface)] border-l border-[var(--border)]">
        <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
          Map placeholder
        </div>
      </div>
    </div>
  );
}

