import useTripStore from '../../../stores/tripStore';
import Timeline from './Timeline';

export default function TripTab() {
  const trip = useTripStore((s) => s.trip);
  if (!trip) return null;

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold text-[var(--text-primary)]">About Your Trip</h2>
      <p className="text-xs text-[var(--text-muted)] mt-1">
        Day-by-day itinerary for your Dallas honeymoon.
      </p>

      {/* Future: narrative block from AI goes here */}

      <Timeline itinerary={trip.itinerary} />
    </div>
  );
}

