import { useMemo } from 'react';
import useTripStore from '../../../stores/tripStore';
import PlaceCard from '../PlaceCard/PlaceCard';

const DIETARY_EXCLUDE_KEYWORDS = {
  vegetarian: ['bbq', 'barbecue', 'steakhouse', 'steak house', 'butcher', 'wings', 'fried chicken'],
  vegan: [
    'bbq',
    'barbecue',
    'steakhouse',
    'steak house',
    'butcher',
    'wings',
    'fried chicken',
    'dairy',
    'cheese',
  ],
  halal: ['pork', 'bacon', 'ham', 'pub'],
  kosher: ['shellfish', 'pork', 'bacon'],
  'gluten-free': [],
};

function filterByDietary(places, dietaryRestrictions) {
  if (!dietaryRestrictions || dietaryRestrictions.length === 0) return places;

  const excludeWords = dietaryRestrictions.flatMap((d) => DIETARY_EXCLUDE_KEYWORDS[d.toLowerCase()] || []);
  if (excludeWords.length === 0) return places;

  return places.filter((place) => {
    const name = (place.name || '').toLowerCase();
    const desc = (place.description || '').toLowerCase();
    const text = `${name} ${desc}`;
    return !excludeWords.some((word) => text.includes(word));
  });
}

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

export default function EatTab() {
  const trip = useTripStore((s) => s.trip);
  if (!trip) return null;

  const dietaryRestrictions =
    trip.dietary || trip.dietaryRestrictions || trip.dietary_restrictions || [];

  const restaurants = useMemo(
    () => trip.places.filter((p) => p.category === 'restaurant'),
    [trip.places],
  );

  const filteredAndSorted = useMemo(() => {
    const filtered = filterByDietary(restaurants, dietaryRestrictions);
    return sortByBudget(filtered, trip.budgetVibe || '$$');
  }, [restaurants, dietaryRestrictions, trip.budgetVibe]);

  const inItinerary = filteredAndSorted.filter((p) => p.isInItinerary);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Restaurant Recommendations</h2>
        <span className="text-sm text-[var(--text-muted)]">
          Showing {inItinerary.length} of {filteredAndSorted.length} places
        </span>
      </div>

      <div className="space-y-3">
        {filteredAndSorted.map((place, i) => (
          <div key={place.id} {...(i === 0 ? { 'data-tour': 'place-card' } : {})}>
            <PlaceCard place={place} />
          </div>
        ))}
      </div>
    </div>
  );
}

