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
  const domesticNote =
    visaInfoRaw.domestic_note || visaInfoRaw.domesticNote || '';

  const documentsChecklistRaw =
    essentialsRaw.documents_checklist || essentialsRaw.documentsChecklist || [];

  const combinedChecklist = [
    ...(visaInfoRaw.checklist || []),
    ...(documentsChecklistRaw || []),
  ];

  const initialChecklist = combinedChecklist.map((item, index) => {
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

  const weatherRaw = essentialsRaw.weather || {};
  const weatherNote =
    essentialsRaw.weather_note ||
    essentialsRaw.weatherNote ||
    weatherRaw.note ||
    '';
  const weatherPack = Array.isArray(weatherRaw.pack) ? weatherRaw.pack : [];
  const weatherWarnings = Array.isArray(weatherRaw.warnings)
    ? weatherRaw.warnings
    : [];

  const seasonalAlerts =
    Array.isArray(essentialsRaw.seasonal_alerts) ||
    Array.isArray(essentialsRaw.seasonalAlerts)
      ? (essentialsRaw.seasonal_alerts || essentialsRaw.seasonalAlerts || [])
      : [];

  const dressCodeRaw =
    essentialsRaw.dress_code || essentialsRaw.dressCode || null;

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
      value: weatherNote,
    },
  ].filter((card) => card.value);

  return (
    <div className="p-4 space-y-6">
      {/* Section 1: Visa & Entry */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          Visa &amp; Entry
        </h2>
        {domesticNote ? (
          <div className="space-y-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">
              Domestic trip
            </span>
            <p className="text-sm text-[var(--text-secondary)]">
              {domesticNote}
            </p>
          </div>
        ) : visaRequired === null &&
          !visaType &&
          !visaValidity &&
          !visaProcessing ? (
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
                className="w-full flex items-start gap-2 text-left text-xs min-h-[44px] py-2"
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

          {/* Weather packing + alerts */}
          {(weatherNote ||
            (weatherPack && weatherPack.length > 0) ||
            (weatherWarnings && weatherWarnings.length > 0)) && (
            <div className="mt-3 border border-[var(--border)] rounded-xl p-3 bg-[var(--surface)] space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-base">🌡</span>
                <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wide">
                  Weather &amp; Packing
                </span>
              </div>
              {weatherNote && (
                <p className="text-xs text-[var(--text-secondary)]">
                  {weatherNote}
                </p>
              )}
              {weatherPack && weatherPack.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    What to pack
                  </p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {weatherPack.map((item) => (
                      <li
                        key={item}
                        className="text-xs text-[var(--text-secondary)]"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {weatherWarnings && weatherWarnings.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Weather warnings
                  </p>
                  <div className="space-y-1">
                    {weatherWarnings.map((w) => (
                      <div
                        key={w}
                        className="text-xs px-2 py-1.5 rounded-lg bg-amber-500/10 text-amber-700 border border-amber-500/30"
                      >
                        {w}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dress code (per-day or single) */}
          {dressCodeRaw && (
            <div className="mt-3 border border-[var(--border)] rounded-xl p-3 bg-[var(--surface)] space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-base">👔</span>
                <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wide">
                  Dress Code
                </span>
              </div>
              {Array.isArray(dressCodeRaw) ? (
                <div className="space-y-1">
                  {dressCodeRaw.map((item) => (
                    <div
                      key={item.day}
                      className="flex gap-3 py-1.5 border-t border-[var(--border)] first:border-t-0"
                    >
                      <span className="text-[11px] font-semibold text-brand-500 whitespace-nowrap">
                        Day {item.day}
                      </span>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {item.suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--text-secondary)]">
                  {dressCodeRaw}
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Section 4: Seasonal Alerts */}
      {seasonalAlerts && seasonalAlerts.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Seasonal Alerts
          </h3>
          <div className="space-y-2">
            {seasonalAlerts.map((alert, idx) => (
              <div
                key={idx}
                className="text-xs px-3 py-2 rounded-lg bg-amber-500/10 text-amber-700 border border-amber-500/30"
              >
                {alert}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}


