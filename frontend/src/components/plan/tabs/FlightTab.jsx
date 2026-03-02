import useTripStore from '../../../stores/tripStore';
import FlightCard from './FlightCard';

export default function FlightTab() {
  const trip = useTripStore((s) => s.trip);
  if (!trip) return null;

  const flights = trip.flights || [];
  const cheapest = flights.reduce(
    (min, f) => (min === null || f.price < min ? f.price : min),
    null
  );

  const priceDate = trip.createdAt
    ? new Date(trip.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'recently';

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Flight Options</h2>
          <p className="text-xs text-[var(--text-muted)]">Prices as of {priceDate}</p>
        </div>
        <button
          type="button"
          disabled
          title="Available in 10min"
          className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-muted)] bg-[var(--surface)] cursor-not-allowed"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {flights.map((flight) => (
          <FlightCard
            key={flight.id}
            flight={flight}
            isCheapest={cheapest != null && flight.price === cheapest}
          />
        ))}
      </div>
    </div>
  );
}

