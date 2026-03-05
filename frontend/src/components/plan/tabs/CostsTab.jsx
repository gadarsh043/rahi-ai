import useTripStore from '../../../stores/tripStore';
import useAuthStore from '../../../stores/authStore';
import CurrencySelector from '../../common/CurrencySelector/CurrencySelector';
import CostBreakdown from './CostBreakdown';

export default function CostsTab() {
  const trip = useTripStore((s) => s.trip);
  const setCurrency = useTripStore((s) => s.setCurrency);
  const profile = useAuthStore((s) => s.profile);
  if (!trip) return null;

  const estimate = trip.costEstimate;
  const currencyCode =
    trip?.currency || profile?.preferred_currency || 'USD';

  const handleCurrencyChange = (code) => {
    setCurrency(code);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Costs &amp; Spending
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Rough estimate for your trip. Currency can be adjusted.
          </p>
        </div>
        <CurrencySelector
          value={currencyCode}
          onChange={handleCurrencyChange}
          compact
        />
      </div>

      <CostBreakdown
        estimate={estimate}
        numTravelers={trip.numTravelers}
        currencyCode={currencyCode}
      />
    </div>
  );
}

