import useTripStore from '../../../stores/tripStore';
import PlaceCard from '../PlaceCard/PlaceCard';

export default function EatTab() {
  const trip = useTripStore((s) => s.trip);
  if (!trip) return null;

  const restaurants = trip.places.filter((p) => p.category === 'restaurant');
  const inItinerary = restaurants.filter((p) => p.isInItinerary);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Restaurant Recommendations</h2>
        <span className="text-sm text-[var(--text-muted)]">
          Showing {inItinerary.length} of {restaurants.length} places
        </span>
      </div>

      <div className="space-y-3">
        {restaurants.map((place) => (
          <PlaceCard key={place.id} place={place} />
        ))}
      </div>
    </div>
  );
}

