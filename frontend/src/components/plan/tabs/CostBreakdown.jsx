import { ALL_CURRENCIES } from '../../common/CurrencySelector/CurrencySelector';
import { convertAmount } from '../../../utils/exchangeRates';

export default function CostBreakdown({ estimate, numTravelers, currencyCode, rate = 1 }) {
  if (!estimate) return null;

  const safeNum = (v) => {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const fx = (usd) => convertAmount(usd, rate);

  const accommodation = estimate.accommodation;
  const food = estimate.food;
  const activities = estimate.activities;
  const flights = estimate.flights;
  const localTransport = estimate.localTransport ?? estimate.local_transport;

  const totalUSD = safeNum(estimate.total);
  const total = fx(totalUSD);
  const perPerson = fx(safeNum(
    estimate.perPerson ?? estimate.per_person ?? (numTravelers ? totalUSD / numTravelers : totalUSD)
  ));
  const dailyAvg = fx(safeNum(estimate.dailyAvg ?? estimate.daily_avg));
  const currency = currencyCode || estimate.currency || 'USD';
  const label = estimate.label;

  const currencyMeta =
    ALL_CURRENCIES.find((c) => c.code === currency) || ALL_CURRENCIES[0];
  const symbol = currencyMeta?.symbol || '$';

  const categories = [
    {
      key: 'accommodation',
      icon: '🛏',
      label: accommodation?.label || 'Accommodation',
      amount: fx(safeNum(accommodation?.total ?? accommodation)),
    },
    {
      key: 'food',
      icon: '🍽',
      label: food?.label || 'Food & Drinks',
      amount: fx(safeNum(food?.total ?? food)),
    },
    {
      key: 'activities',
      icon: '🎟',
      label: 'Activities & Tickets',
      amount: fx(safeNum(activities?.total ?? activities)),
    },
    {
      key: 'flights',
      icon: '✈️',
      label: flights?.label || 'Flights',
      amount: fx(safeNum(flights?.total ?? flights)),
    },
    {
      key: 'localTransport',
      icon: '🚕',
      label: localTransport?.label || 'Local Transport',
      amount: fx(safeNum(localTransport?.total ?? localTransport)),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--text-secondary)]">
              Total for {numTravelers} {numTravelers === 1 ? 'person' : 'people'}
            </p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {symbol}
              {total.toLocaleString()}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Per person:{' '}
              <span className="font-semibold text-[var(--text-secondary)]">
                {symbol}
                {perPerson.toLocaleString()}
              </span>
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--surface-hover)] text-[10px] font-semibold text-[var(--text-muted)]">
              {label === 'final' ? 'Final' : 'Estimated'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {categories.map(({ key, icon, label: catLabel, amount }) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1">
                <span>{icon}</span>
                <span className="text-[var(--text-primary)]">{catLabel}</span>
              </span>
              <span className="font-semibold text-[var(--text-primary)]">
                {symbol}
                {safeNum(amount).toLocaleString()}
              </span>
            </div>
            <div className="h-2 bg-[var(--surface-hover)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{
                  width: total > 0
                    ? `${Math.max(4, (safeNum(amount) / total) * 100)}%`
                    : '0%',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-1">
        <span>
          Daily average:{' '}
          <span className="font-semibold text-[var(--text-secondary)]">
            {symbol}
            {dailyAvg.toLocaleString()}
          </span>
        </span>
        <span>
          Currency: <span className="font-semibold text-[var(--text-secondary)]">
            {currency}
          </span>
        </span>
      </div>
    </div>
  );
}
