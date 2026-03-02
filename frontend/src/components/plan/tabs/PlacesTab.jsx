import useTripStore from '../../../stores/tripStore';
import PlaceCard from '../PlaceCard/PlaceCard';

export default function PlacesTab() {
  const trip = useTripStore((s) => s.trip);
  if (!trip) return null;

  const attractions = trip.places.filter((p) => p.category === 'attraction');

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Places to Go</h2>
        <span className="text-sm text-[var(--text-muted)]">{attractions.length} places</span>
      </div>

      <div className="space-y-3">
        {attractions.map((place) => (
          <PlaceCard key={place.id} place={place} />
        ))}
      </div>
    </div>
  );
}

