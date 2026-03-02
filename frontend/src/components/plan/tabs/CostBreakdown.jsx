export default function CostBreakdown({ estimate, numTravelers }) {
  if (!estimate) return null;

  const { accommodation, food, activities, flights, localTransport, total, perPerson, dailyAvg, currency, label } =
    estimate;

  const categories = [
    { key: 'accommodation', icon: '🛏', label: accommodation?.label || 'Accommodation', amount: accommodation?.total || 0 },
    { key: 'food', icon: '🍽', label: food?.label || 'Food & Drinks', amount: food?.total || 0 },
    { key: 'activities', icon: '🎟', label: 'Activities & Tickets', amount: activities?.total || 0 },
    { key: 'flights', icon: '✈️', label: flights?.label || 'Flights', amount: flights?.total || 0 },
    { key: 'localTransport', icon: '🚕', label: localTransport?.label || 'Local Transport', amount: localTransport?.total || 0 },
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
              ${total.toLocaleString()}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Per person: <span className="font-semibold text-[var(--text-secondary)]">
                ${perPerson.toLocaleString()}
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
                ${amount.toLocaleString()}
              </span>
            </div>
            <div className="h-2 bg-[var(--surface-hover)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{
                  width: total > 0 ? `${Math.max(4, (amount / total) * 100)}%` : '0%',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-1">
        <span>
          Daily average: <span className="font-semibold text-[var(--text-secondary)]">
            ${dailyAvg.toLocaleString()}
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

