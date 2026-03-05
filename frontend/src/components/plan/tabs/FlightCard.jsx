import { useState, useMemo, memo } from 'react';

export default memo(function FlightCard({ flight, isCheapest, originCode, destCode, date }) {
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
    <div className="interactive-card rounded-xl border border-[var(--border)] bg-[var(--surface)] active:scale-[0.98] transition-transform cursor-pointer">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between gap-3 p-3 text-left touch-target"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[var(--surface-hover)] flex items-center justify-center text-sm font-semibold text-[var(--text-secondary)]">
            {airlineInitial}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {flightNumber && `${flightNumber} · `}{departureAirport} → {arrivalAirport}
            </div>
            <div className="text-xs text-[var(--text-muted)]">
              {airline} · {durationMinutes > 0 && `${hours}h ${mins}m · `}{stopsLabel}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-bold text-[var(--text-primary)]">
            ${price.toLocaleString()}
          </span>
          {isCheapest && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 font-semibold">
              Cheapest
            </span>
          )}
          <span className="text-xs text-[var(--text-muted)]">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0 text-xs text-[var(--text-secondary)] space-y-2">
          {flight.stop_airports && flight.stop_airports.length > 0 && (
            <p>
              <span className="font-semibold">Layovers:</span>{' '}
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
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-500 mt-2 min-h-[44px]"
            >
              Book on Skyscanner ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
});

