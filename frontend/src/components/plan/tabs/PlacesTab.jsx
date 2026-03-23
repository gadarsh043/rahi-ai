import { useMemo } from 'react';
import useTripStore from '../../../stores/tripStore';
import PlaceCard from '../PlaceCard/PlaceCard';

const BUDGET_ORDER = {
  $: [1, 2, 0, 3, 4],
  $$: [2, 1, 3, 0, 4],
  $$$: [3, 2, 4, 1, 0],
  $$$$: [4, 3, 2, 1, 0],
};

function sortByBudget(places, budgetVibe) {
  const order = BUDGET_ORDER[budgetVibe] || BUDGET_ORDER.$$;
  return [...places].sort((a, b) => {
    const pa = a.priceLevel ?? 0;
    const pb = b.priceLevel ?? 0;
    const ia = order.indexOf(pa);
    const ib = order.indexOf(pb);
    const sa = ia === -1 ? 99 : ia;
    const sb = ib === -1 ? 99 : ib;
    return sa - sb;
  });
}

export default function PlacesTab() {
  const trip = useTripStore((s) => s.trip);
  if (!trip) return null;

  const attractions = useMemo(
    () => trip.places.filter((p) => p.category === 'attraction'),
    [trip.places],
  );
  const sortedAttractions = useMemo(
    () => sortByBudget(attractions, trip.budgetVibe || '$$'),
    [attractions, trip.budgetVibe],
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Places to Go</h2>
        <span className="text-sm text-[var(--text-muted)]">{sortedAttractions.length} places</span>
      </div>

      <div className="space-y-3">
        {sortedAttractions.map((place) => (
          <PlaceCard key={place.id} place={place} />
        ))}
      </div>
    </div>
  );
}

