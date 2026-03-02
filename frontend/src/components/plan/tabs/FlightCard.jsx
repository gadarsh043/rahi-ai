import { useState } from 'react';

export default function FlightCard({ flight, isCheapest }) {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => setExpanded((v) => !v);

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const stopsLabel =
    flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:shadow-md transition-shadow">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div className="w-10 h-10 rounded-full bg-[var(--surface-hover)] flex items-center justify-center text-sm font-semibold text-[var(--text-secondary)]">
          {flight.airline?.[0] ?? '✈️'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-primary)]">
            <span className="font-semibold">{flight.airline}</span>
            <span className="text-[var(--text-muted)]">· {flight.flightNumber}</span>
          </div>
          <div className="mt-1 text-xs text-[var(--text-secondary)] flex flex-wrap gap-2">
            <span>
              {flight.origin} → {flight.destination}
            </span>
            <span>· {formatTime(flight.departureTime)} → {formatTime(flight.arrivalTime)}</span>
            <span>· {stopsLabel}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            ${flight.price}
          </span>
          {isCheapest && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 font-semibold">
              Cheapest
            </span>
          )}
        </div>
        <span className="ml-2 text-xs text-[var(--text-muted)]">
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0 text-xs text-[var(--text-secondary)] space-y-1">
          <p>
            <span className="font-semibold">Layover:</span> {flight.layoverDuration} in{' '}
            {flight.stopCity}
          </p>
          <p>
            <span className="font-semibold">Cabin:</span> {flight.cabinClass}
          </p>
          <p>
            <span className="font-semibold">Baggage:</span> {flight.baggageIncluded}
          </p>
          {flight.bookingUrl && (
            <a
              href={flight.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex mt-2 px-3 py-1.5 rounded-full bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors"
            >
              Book on Skyscanner ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}

