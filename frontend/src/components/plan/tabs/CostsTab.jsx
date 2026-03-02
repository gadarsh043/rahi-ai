import useTripStore from '../../../stores/tripStore';
import CostBreakdown from './CostBreakdown';

export default function CostsTab() {
  const trip = useTripStore((s) => s.trip);
  if (!trip) return null;

  const estimate = trip.costEstimate;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold text-[var(--text-primary)]">Costs &amp; Spending</h2>
      <p className="text-xs text-[var(--text-muted)]">
        This is a rough estimate based on typical prices in Dallas for your dates.
      </p>

      <CostBreakdown estimate={estimate} numTravelers={trip.numTravelers} />
    </div>
  );
}

