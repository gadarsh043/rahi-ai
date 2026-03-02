import { useState } from 'react';
import useTripStore from '../../../stores/tripStore';

export default function NextTab() {
  const trip = useTripStore((s) => s.trip);
  if (!trip) return null;

  const { visaInfo, travelEssentials } = trip;
  const [checklist, setChecklist] = useState(visaInfo?.checklist || []);

  const toggleItem = (id) => {
    setChecklist((items) =>
      items.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const essentialsCards = [
    { icon: '🗣', label: 'Language', value: travelEssentials.language },
    {
      icon: '🚨',
      label: 'Emergency Numbers',
      value: `Police ${travelEssentials.emergencyNumbers.police}, Ambulance ${travelEssentials.emergencyNumbers.ambulance}, Fire ${travelEssentials.emergencyNumbers.fire}`,
    },
    { icon: '💡', label: 'Tipping', value: travelEssentials.tipping },
    { icon: '🔌', label: 'Power Plugs', value: travelEssentials.powerPlug },
    { icon: '📱', label: 'SIM Advice', value: travelEssentials.simAdvice },
    { icon: '💧', label: 'Water Safety', value: travelEssentials.waterSafety },
    { icon: '🕐', label: 'Timezone', value: travelEssentials.timezone },
    { icon: '💵', label: 'Currency Info', value: travelEssentials.currencyInfo },
    { icon: '🌡', label: 'Weather', value: travelEssentials.weatherNote },
    { icon: '👔', label: 'Dress Code', value: travelEssentials.dressCode },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Section 1: Visa & Entry */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Visa &amp; Entry</h2>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
              visaInfo.visaRequired
                ? 'bg-emerald-500/10 text-emerald-600'
                : 'bg-emerald-500/10 text-emerald-600'
            }`}
          >
            {visaInfo.visaRequired ? 'Visa Required' : 'Visa Free'}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {visaInfo.type} · {visaInfo.validity}
          </span>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          Processing: {visaInfo.processing}
        </p>
        <div className="space-y-2">
          {visaInfo.warnings?.map((w) => (
            <div
              key={w}
              className="text-xs px-3 py-2 rounded-lg bg-amber-500/10 text-amber-700 border border-amber-500/30"
            >
              {w}
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Document Checklist */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Document Checklist
        </h3>
        <div className="space-y-2">
          {checklist.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleItem(item.id)}
              className="w-full flex items-start gap-2 text-left text-xs"
            >
              <span
                className={`mt-0.5 inline-flex w-4 h-4 rounded border flex-shrink-0 items-center justify-center ${
                  item.checked
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-[var(--border)] bg-[var(--surface)]'
                }`}
              >
                {item.checked ? '✓' : ''}
              </span>
              <span
                className={`${
                  item.checked
                    ? 'line-through text-emerald-600'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                {item.text}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Section 3: Travel Essentials */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Travel Essentials
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {essentialsCards.map((card) => (
            <div
              key={card.label}
              className="border border-[var(--border)] rounded-xl p-3 bg-[var(--surface)]"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base">{card.icon}</span>
                <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wide">
                  {card.label}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">{card.value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

