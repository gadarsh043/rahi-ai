import { useState, useMemo } from 'react';

export default function FlightCard({ flight, isCheapest, originCode, destCode, date }) {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => setExpanded((v) => !v);

  const durationMinutes =
    typeof flight.duration_minutes === 'number'
      ? flight.duration_minutes
      : typeof flight.total_duration === 'number'
      ? flight.total_duration
      : 0;

  const hours = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;

  const price = flight.price_usd ?? flight.priceUsd ?? flight.price ?? 0;
  const stops = typeof flight.stops === 'number' ? flight.stops : 0;

  const stopsLabel = useMemo(() => {
    if (stops === 0) return 'Nonstop';
    if (stops === 1) {
      const stop = (flight.stop_airports && flight.stop_airports[0]) || '';
      return stop ? `1 stop (${stop})` : '1 stop';
    }
    return `${stops} stops`;
  }, [stops, flight.stop_airports]);

  const airline = flight.airline || 'Unknown airline';
  const airlineInitial =
    airline && typeof airline === 'string' ? airline.charAt(0).toUpperCase() : '✈️';
  const flightNumber = flight.flight_number || flight.flightNumber || '';

  const departureAirport = flight.departure_airport || originCode;
  const arrivalAirport = flight.arrival_airport || destCode;

  const bookingUrl = useMemo(() => {
    if (!originCode || !destCode || !date) return null;
    const compactDate = String(date).replace(/-/g, '').slice(2);
    return `https://www.skyscanner.com/transport/flights/${originCode}/${destCode}/${compactDate}/`;
  }, [originCode, destCode, date]);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:shadow-md transition-shadow">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div className="w-10 h-10 rounded-full bg-[var(--surface-hover)] flex items-center justify-center text-sm font-semibold text-[var(--text-secondary)]">
          {airlineInitial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-primary)]">
            <span className="font-semibold">{airline}</span>
            {flightNumber && (
              <span className="text-[var(--text-muted)]">· {flightNumber}</span>
            )}
          </div>
          <div className="mt-1 text-xs text-[var(--text-secondary)] flex flex-wrap gap-2">
            <span>
              {departureAirport} → {arrivalAirport}
            </span>
            {durationMinutes > 0 && (
              <span>
                · {hours}h {mins}m
              </span>
            )}
            <span>· {stopsLabel}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            ${price.toLocaleString()}
          </span>
          {isCheapest && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 font-semibold">
              Cheapest
            </span>
          )}
        </div>
        <span className="ml-2 text-xs text-[var(--text-muted)]">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0 text-xs text-[var(--text-secondary)] space-y-1">
          {flight.stop_airports && flight.stop_airports.length > 0 && (
            <p>
              <span className="font-semibold">Stops:</span>{' '}
              {flight.stop_airports.join(' · ') || 'See airline site for details'}
            </p>
          )}
          {flight.carbon_emissions && (
            <p>
              <span className="font-semibold">Estimated emissions:</span>{' '}
              {flight.carbon_emissions} kg CO₂
            </p>
          )}
          {bookingUrl && (
            <a
              href={bookingUrl}
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

