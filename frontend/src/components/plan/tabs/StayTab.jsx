import { useState, useMemo } from 'react';
import useTripStore from '../../../stores/tripStore';
import PlaceCard from '../PlaceCard/PlaceCard';

const FILTERS = ['all', 'hotel', 'hostel', 'apartment'];

export default function StayTab() {
  const trip = useTripStore((s) => s.trip);
  const [filter, setFilter] = useState('all');
  if (!trip) return null;

  const places = useMemo(
    () => trip.places.filter((p) => p.category === 'hotel' || p.category === 'lodging'),
    [trip.places],
  );

  const filteredPlaces = useMemo(() => {
    if (filter === 'all') return places;
    return places.filter((p) => {
      const type = (p.accommodation_type || p.category || '').toLowerCase();
      if (filter === 'hotel') return type.includes('hotel') || type.includes('lodging');
      if (filter === 'hostel') return type.includes('hostel');
      if (filter === 'apartment') return type.includes('apartment') || type.includes('rental');
      return true;
    });
  }, [filter, places]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Where to Stay</h2>
        <span className="text-sm text-[var(--text-muted)]">
          {filteredPlaces.length} options
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-brand-500 text-white'
                : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredPlaces.map((place) => (
          <PlaceCard key={place.id} place={place} />
        ))}
      </div>
    </div>
  );
}


