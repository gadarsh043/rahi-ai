import useTripStore from '../../../stores/tripStore';
import PlaceCard from '../PlaceCard/PlaceCard';

const FILTERS = ['All', 'Hotel', 'Hostel', 'Apartment'];

export default function StayTab() {
  const trip = useTripStore((s) => s.trip);
  if (!trip) return null;

  const hotels = trip.places.filter((p) => p.category === 'hotel');

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Where to Stay</h2>
        <span className="text-sm text-[var(--text-muted)]">{hotels.length} options</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            className="text-xs px-3 py-1 rounded-full border border-[var(--border)] text-[var(--text-secondary)] bg-white dark:bg-transparent hover:border-brand-500/60 hover:text-brand-500 transition-colors"
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {hotels.map((place) => (
          <PlaceCard key={place.id} place={place} />
        ))}
      </div>
    </div>
  );
}

