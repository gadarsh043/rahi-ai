import { useState } from 'react';
import useTripStore from '../../../stores/tripStore';

export default function NextTab() {
  const trip = useTripStore((s) => s.trip);
  if (!trip) return null;

  const visaInfoRaw = trip.visaInfo || trip.visa_info || {};
  const essentialsRaw = trip.travelEssentials || trip.travel_essentials || {};

  const visaRequired =
    visaInfoRaw.visa_required ?? visaInfoRaw.visaRequired ?? null;
  const visaType = visaInfoRaw.type || '';
  const visaValidity = visaInfoRaw.validity || '';
  const visaProcessing = visaInfoRaw.processing || '';
  const visaWarnings = visaInfoRaw.warnings || [];

  const initialChecklist = (visaInfoRaw.checklist || []).map((item, index) => {
    if (typeof item === 'string') {
      return { id: `ck-${index}`, text: item, checked: false };
    }
    return {
      id: item.id || `ck-${index}`,
      text: item.text || '',
      checked: Boolean(item.checked),
    };
  });

  const [checklist, setChecklist] = useState(initialChecklist);

  const toggleItem = (id) => {
    setChecklist((items) =>
      items.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    );
  };

  const emergency =
    essentialsRaw.emergency_numbers || essentialsRaw.emergencyNumbers || {};
  const emergencyValue =
    emergency && Object.keys(emergency).length > 0
      ? [
          emergency.police && `Police ${emergency.police}`,
          emergency.ambulance && `Ambulance ${emergency.ambulance}`,
          emergency.fire && `Fire ${emergency.fire}`,
        ]
          .filter(Boolean)
          .join(', ')
      : '';

  const essentialsCards = [
    {
      icon: '🗣',
      label: 'Language',
      value: essentialsRaw.language || '',
    },
    {
      icon: '🚨',
      label: 'Emergency Numbers',
      value: emergencyValue,
    },
    {
      icon: '💡',
      label: 'Tipping',
      value: essentialsRaw.tipping || '',
    },
    {
      icon: '🔌',
      label: 'Power Plugs',
      value: essentialsRaw.power_plug || essentialsRaw.powerPlug || '',
    },
    {
      icon: '📱',
      label: 'SIM Advice',
      value: essentialsRaw.sim_advice || essentialsRaw.simAdvice || '',
    },
    {
      icon: '💧',
      label: 'Water Safety',
      value: essentialsRaw.water_safety || essentialsRaw.waterSafety || '',
    },
    {
      icon: '🕐',
      label: 'Timezone',
      value: essentialsRaw.timezone || '',
    },
    {
      icon: '💵',
      label: 'Currency Info',
      value: essentialsRaw.currency_info || essentialsRaw.currencyInfo || '',
    },
    {
      icon: '🌡',
      label: 'Weather',
      value: essentialsRaw.weather_note || essentialsRaw.weatherNote || '',
    },
    {
      icon: '👔',
      label: 'Dress Code',
      value: essentialsRaw.dress_code || essentialsRaw.dressCode || '',
    },
  ].filter((card) => card.value);

  return (
    <div className="p-4 space-y-6">
      {/* Section 1: Visa & Entry */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          Visa &amp; Entry
        </h2>
        {visaRequired === null && !visaType && !visaValidity && !visaProcessing ? (
          <p className="text-sm text-[var(--text-secondary)]">
            Visa information is not available for this trip. Please check with the embassy
            or official government website for the latest requirements.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-3">
              {visaRequired !== null && (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    visaRequired
                      ? 'bg-amber-500/10 text-amber-700'
                      : 'bg-emerald-500/10 text-emerald-600'
                  }`}
                >
                  {visaRequired ? 'Visa Required' : 'Visa Free'}
                </span>
              )}
              <span className="text-xs text-[var(--text-muted)]">
                {visaType}
                {visaValidity ? ` · ${visaValidity}` : ''}
              </span>
            </div>
            {visaProcessing && (
              <p className="text-sm text-[var(--text-secondary)]">
                Processing: {visaProcessing}
              </p>
            )}
            <div className="space-y-2">
              {visaWarnings?.map((w) => (
                <div
                  key={w}
                  className="text-xs px-3 py-2 rounded-lg bg-amber-500/10 text-amber-700 border border-amber-500/30"
                >
                  {w}
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Section 2: Document Checklist */}
      {checklist.length > 0 && (
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
      )}

      {/* Section 3: Travel Essentials */}
      {essentialsCards.length > 0 && (
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
                <p className="text-xs text-[var(--text-secondary)]">
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}


