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

      {trip?.narrative && (
        <div className="mb-6 mt-4 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
            Trip Overview
          </h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
            {trip.narrative}
          </p>
        </div>
      )}

      <Timeline itinerary={trip.itinerary} />
    </div>
  );
}

