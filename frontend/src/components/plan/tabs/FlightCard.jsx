import { useState, useMemo, memo } from 'react';
import useTripStore from '../../../stores/tripStore';

function formatTime(datetimeStr) {
  if (!datetimeStr) return '';
  // "2026-03-12 17:02" → "5:02 PM"
  const parts = datetimeStr.split(' ');
  const timePart = parts[1] || parts[0];
  const [h, m] = timePart.split(':').map(Number);
  if (Number.isNaN(h)) return timePart;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatDate(datetimeStr) {
  if (!datetimeStr) return '';
  // "2026-03-12 17:02" → "Mar 12"
  const datePart = datetimeStr.split(' ')[0];
  const d = new Date(datePart + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return datePart;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCarbon(grams) {
  if (!grams || typeof grams !== 'number') return null;
  const kg = grams >= 1000 ? Math.round(grams / 1000) : grams;
  const unit = grams >= 1000 ? 'kg' : 'g';
  return `${kg} ${unit} CO2`;
}

const BADGE_STYLES = {
  best: 'bg-brand-500/10 text-brand-600',
  cheapest: 'bg-success/10 text-success',
  fastest: 'bg-info/10 text-info',
};

const BADGE_LABELS = {
  best: 'Best',
  cheapest: 'Cheapest',
  fastest: 'Fastest',
};

export default memo(function FlightCard({ flight, badges = [], originCode, destCode, date, returnDate }) {
  const [expanded, setExpanded] = useState(false);
  const trip = useTripStore((s) => s.trip);
  const numTravelers = trip?.num_travelers ?? trip?.numTravelers ?? 1;

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
  const airlineLogo = flight.airline_logo || flight.airlineLogo || '';
  const flightNumber = flight.flight_number || flight.flightNumber || '';

  const departureAirport = flight.departure_airport || originCode;
  const arrivalAirport = flight.arrival_airport || destCode;
  const departureTime = formatTime(flight.departure_time || flight.departureTime);
  const arrivalTime = formatTime(flight.arrival_time || flight.arrivalTime);
  const departureDate = formatDate(flight.departure_time || flight.departureTime);

  const carbonLabel = formatCarbon(flight.carbon_emissions || flight.carbonEmissions);

  const bookingUrl = useMemo(() => {
    if (!originCode || !destCode || !date) return null;
    const outCompact = String(date).replace(/-/g, '').slice(2);
    const base = `https://www.skyscanner.com/transport/flights/${originCode.toLowerCase()}/${destCode.toLowerCase()}/${outCompact}`;
    if (returnDate) {
      const retCompact = String(returnDate).replace(/-/g, '').slice(2);
      return `${base}/${retCompact}/`;
    }
    return `${base}/`;
  }, [originCode, destCode, date, returnDate]);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] active:scale-[0.98] transition-transform cursor-pointer">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between gap-3 p-3 text-left touch-target"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Airline logo or initial */}
          <div className="w-10 h-10 rounded-lg bg-[var(--surface-hover)] flex items-center justify-center flex-shrink-0 overflow-hidden">
            {airlineLogo ? (
              <img src={airlineLogo} alt={airline} className="w-8 h-8 object-contain" />
            ) : (
              <span className="text-sm font-semibold text-[var(--text-secondary)]">
                {airline.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0">
            {/* Times + route */}
            <div className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {departureTime && arrivalTime
                ? `${departureTime} - ${arrivalTime}`
                : `${departureAirport} → ${arrivalAirport}`}
            </div>
            {/* Airline + duration + stops */}
            <div className="text-xs text-[var(--text-muted)] mt-0.5">
              {airline}{flightNumber ? ` · ${flightNumber}` : ''} · {durationMinutes > 0 && `${hours}h ${mins}m · `}{stopsLabel}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0 text-right">
          <span className="text-sm font-bold text-[var(--text-primary)]">
            {numTravelers > 1
              ? `$${price.toLocaleString()}/person · $${(price * numTravelers).toLocaleString()} total`
              : `$${price.toLocaleString()}`}
          </span>
          {badges.length > 0 && (
            <div className="flex gap-1">
              {badges.map((badge) => (
                <span
                  key={badge}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${BADGE_STYLES[badge] || ''}`}
                >
                  {BADGE_LABELS[badge] || badge}
                </span>
              ))}
            </div>
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-2.5">
          {/* Route detail */}
          <div className="flex items-center gap-3 text-xs">
            <div className="text-center">
              <p className="font-semibold text-[var(--text-primary)]">{departureTime || '--'}</p>
              <p className="text-[var(--text-muted)]">{departureAirport}</p>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <p className="text-[var(--text-muted)]">
                {durationMinutes > 0 ? `${hours}h ${mins}m` : ''}
              </p>
              <div className="w-full border-t border-dashed border-[var(--border)] my-1 relative">
                {stops > 0 && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[var(--text-muted)]" />
                )}
              </div>
              <p className="text-[var(--text-muted)]">{stopsLabel}</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-[var(--text-primary)]">{arrivalTime || '--'}</p>
              <p className="text-[var(--text-muted)]">{arrivalAirport}</p>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
            {departureDate && <span>{departureDate}</span>}
            {flight.stop_airports && flight.stop_airports.length > 0 && (
              <span>via {flight.stop_airports.join(', ')}</span>
            )}
            {carbonLabel && <span>{carbonLabel}</span>}
          </div>

          {/* Booking link */}
          {bookingUrl && (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors min-h-[44px]"
            >
              Book on Skyscanner ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
});
