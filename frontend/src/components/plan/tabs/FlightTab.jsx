import { useState, useMemo, useRef, useEffect } from 'react';
import useTripStore from '../../../stores/tripStore';
import { apiPost } from '../../../services/apiClient';
import FlightCard from './FlightCard';

function formatRelativeTime(iso) {
  if (!iso) return 'recently';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'recently';
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin <= 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr === 1) return '1 hour ago';
  if (diffHr < 24) return `${diffHr} hours ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getRefreshTip(nextRefreshIso) {
  if (!nextRefreshIso) return null;
  const next = new Date(nextRefreshIso);
  if (Number.isNaN(next.getTime())) return null;
  const diffMs = next.getTime() - Date.now();
  if (diffMs <= 0) return null;
  const mins = Math.max(1, Math.ceil(diffMs / 60000));
  const at = next.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return { mins, at };
}

function shiftDate(dateStr, days) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function toISO(d) {
  return d.toISOString().slice(0, 10);
}

function generateDateRange(minStr, maxStr) {
  if (!minStr || !maxStr) return [];
  const min = new Date(minStr + 'T00:00:00');
  const max = new Date(maxStr + 'T00:00:00');
  if (Number.isNaN(min.getTime()) || Number.isNaN(max.getTime())) return [];
  const dates = [];
  const cur = new Date(min);
  while (cur <= max) {
    dates.push(toISO(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatPillDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  const wk = d.toLocaleDateString('en-US', { weekday: 'short' });
  const mo = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${wk}, ${mo}`;
}

function buildSkyUrl(originCode, destCode, departStr, returnStr) {
  if (!originCode || !destCode || !departStr) return 'https://www.skyscanner.com/transport/flights';
  const outCompact = String(departStr).replace(/-/g, '').slice(2);
  const base = `https://www.skyscanner.com/transport/flights/${originCode.toLowerCase()}/${destCode.toLowerCase()}/${outCompact}`;
  if (returnStr) {
    const retCompact = String(returnStr).replace(/-/g, '').slice(2);
    return `${base}/${retCompact}/`;
  }
  return `${base}/`;
}

function buildGfUrl(originLabel, destLabel, departStr, returnStr) {
  if (!originLabel || !destLabel || !departStr) return 'https://www.google.com/travel/flights';
  let q = `Flights from ${originLabel} to ${destLabel} on ${departStr}`;
  if (returnStr) q += ` return ${returnStr}`;
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}`;
}

// ── Pill Date Picker Dropdown ──
function DatePillPicker({ value, dates, onChange, label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors min-h-[36px]"
      >
        <span className="text-[11px] text-[var(--text-muted)] font-medium">{label}</span>
        <span className="font-semibold">{formatShortDate(value)}</span>
        <span className="text-[10px] text-[var(--text-muted)]">▾</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-[var(--z-dropdown)] bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg p-2 w-[220px] max-h-[240px] overflow-y-auto">
          <div className="flex flex-wrap gap-1.5">
            {dates.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => { onChange(d); setOpen(false); }}
                className={`text-xs px-2.5 py-1.5 rounded-full font-medium transition-colors ${
                  d === value
                    ? 'bg-brand-500 text-white'
                    : 'bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:bg-brand-50 hover:text-brand-600'
                }`}
              >
                {formatPillDate(d)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FlightTab() {
  const trip = useTripStore((s) => s.trip);
  const [refreshing, setRefreshing] = useState(false);
  const setTrip = useTripStore((s) => s.setTrip);

  if (!trip) return null;

  const transport = trip.transportData || trip.transport_data || {};
  const mode = transport.mode || trip.transportMode || trip.transport_mode || 'flight';

  const flightsRaw = transport.flights || [];
  const flights = Array.isArray(flightsRaw) ? flightsRaw : [];
  const cached = transport.cached;
  const fetchedAt = transport.fetched_at || transport.fetchedAt;
  const nextRefresh = transport.next_refresh || transport.nextRefresh;
  const note = transport.note;
  const error = transport.error;

  const canRefresh = useMemo(() => {
    if (!nextRefresh) return true;
    const next = new Date(nextRefresh);
    if (Number.isNaN(next.getTime())) return true;
    return Date.now() > next.getTime();
  }, [nextRefresh]);

  const refreshTip = useMemo(() => getRefreshTip(nextRefresh), [nextRefresh]);

  const originCode = transport.origin_code || trip.originIata || trip.origin_iata || '';
  const destCode = transport.destination_code || trip.destinationIata || trip.destination_iata || '';
  const distanceKm = transport.distance_km || transport.distanceKm;

  // Trip dates
  const tripStart = trip.startDate || trip.start_date || '';
  const tripEnd = trip.endDate || trip.end_date || '';
  const today = toISO(new Date());

  // Flight date state
  // Always default to tripStart - 1 / tripEnd. Don't use transport dates
  // (backend sets departure_date = trip start during generation, which is wrong for flights).
  const defaultDepart = shiftDate(tripStart, -1);
  const defaultReturn = tripEnd;
  const [departDate, setDepartDate] = useState(defaultDepart);
  const [returnDate, setReturnDate] = useState(defaultReturn);
  const [isOneWay, setIsOneWay] = useState(false);

  // Date ranges for pill pickers
  // Out: max(today, tripStart - 5) → tripStart - 1
  const departDates = useMemo(() => {
    const fiveBefore = shiftDate(tripStart, -5);
    const min = fiveBefore > today ? fiveBefore : today;
    const max = shiftDate(tripStart, -1);
    return min <= max ? generateDateRange(min, max) : [];
  }, [today, tripStart]);

  // Return: tripEnd → tripEnd + 4
  const returnDates = useMemo(
    () => generateDateRange(tripEnd, shiftDate(tripEnd, 4)),
    [tripEnd]
  );

  // Deep links update instantly with selected dates
  const originLabel = trip.originCity || originCode;
  const destLabel = trip.destinationCity || destCode;
  const skyUrl = buildSkyUrl(originCode, destCode, departDate, isOneWay ? null : returnDate);
  const gfUrl = buildGfUrl(originLabel, destLabel, departDate, isOneWay ? null : returnDate);

  const flightBadges = useMemo(() => {
    if (!flights.length) return {};
    let cheapestId = null;
    let cheapestPrice = Infinity;
    let fastestId = null;
    let fastestDuration = Infinity;

    flights.forEach((f) => {
      const price = f.price_usd ?? f.priceUsd ?? f.price ?? Infinity;
      const duration = f.duration_minutes ?? f.total_duration ?? Infinity;
      if (price < cheapestPrice) { cheapestPrice = price; cheapestId = f.id || f.booking_token || f.flight_number; }
      if (duration < fastestDuration) { fastestDuration = duration; fastestId = f.id || f.booking_token || f.flight_number; }
    });

    const badges = {};
    flights.forEach((f) => {
      const fKey = f.id || f.booking_token || f.flight_number;
      const tags = [];
      if (f.tag === 'best') tags.push('best');
      if (fKey === cheapestId) tags.push('cheapest');
      if (fKey === fastestId) tags.push('fastest');
      if (tags.length) badges[fKey] = tags;
    });
    return badges;
  }, [flights]);

  const handleSearch = async () => {
    if (!trip?.id || !canRefresh || refreshing) return;
    try {
      setRefreshing(true);
      const data = await apiPost(`/plans/${trip.id}/refresh-flights`, {
        departure_date: departDate,
        return_date: isOneWay ? null : returnDate || null,
      });
      if (data && !data.error) {
        setTrip({ ...trip, transportData: data });
      }
    } finally {
      setRefreshing(false);
    }
  };

  const pricesSubtitle = useMemo(() => {
    if (fetchedAt || cached) {
      return `Prices as of ${formatRelativeTime(fetchedAt)}${cached ? ' (cached)' : ''}`;
    }
    return null;
  }, [fetchedAt, cached]);

  // ── Header: Row 1 = Flights + controls, Row 2 = route + freshness + refresh ──
  const flightHeader = (
    <div className="space-y-2">
      {/* Row 1: Title + date controls + search */}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-bold text-[var(--text-primary)] mr-1">Flights</h2>

        {/* Round trip / One way toggle */}
        <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
          <button
            type="button"
            onClick={() => setIsOneWay(false)}
            className={`text-xs px-3 py-1.5 font-medium transition-colors ${
              !isOneWay ? 'bg-brand-500 text-white' : 'bg-[var(--surface)] text-[var(--text-secondary)]'
            }`}
          >
            Round trip
          </button>
          <button
            type="button"
            onClick={() => setIsOneWay(true)}
            className={`text-xs px-3 py-1.5 font-medium transition-colors ${
              isOneWay ? 'bg-brand-500 text-white' : 'bg-[var(--surface)] text-[var(--text-secondary)]'
            }`}
          >
            One way
          </button>
        </div>

        <DatePillPicker
          label="Out"
          value={departDate}
          dates={departDates}
          onChange={setDepartDate}
        />

        {!isOneWay && (
          <>
            <span className="text-[var(--text-muted)] text-xs">→</span>
            <DatePillPicker
              label="Return"
              value={returnDate}
              dates={returnDates}
              onChange={setReturnDate}
            />
          </>
        )}

        <button
          type="button"
          onClick={handleSearch}
          disabled={!canRefresh || refreshing || !departDate}
          className={`text-xs px-4 py-1.5 rounded-lg font-semibold min-h-[36px] transition-colors ${
            !canRefresh || refreshing || !departDate
              ? 'bg-[var(--surface-hover)] text-[var(--text-muted)] cursor-not-allowed'
              : 'bg-brand-500 text-white hover:bg-brand-600'
          }`}
        >
          {refreshing ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Row 2: Route · freshness                              Refresh */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-[var(--text-muted)]">
          {originLabel} → {destLabel}
          {pricesSubtitle ? ` · ${pricesSubtitle}` : ''}
          {!canRefresh && refreshTip ? ` · Refresh in ${refreshTip.mins} min` : ''}
        </p>
        <button
          type="button"
          onClick={handleSearch}
          disabled={!canRefresh || refreshing}
          className={`text-xs px-3 py-1 rounded-full border border-[var(--border)] transition-colors flex-shrink-0 ${
            !canRefresh || refreshing
              ? 'text-[var(--text-muted)] cursor-not-allowed opacity-60'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] cursor-pointer'
          }`}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </div>
  );

  if (mode === 'flight') {
    // Empty state
    if (flights.length === 0) {
      return (
        <div className="p-4 space-y-4">
          {flightHeader}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
            {(error || note) && (
              <div className="rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                {error && <p className="font-semibold text-[var(--text-primary)]">{error}</p>}
                {note && <p className="mt-0.5">{note}</p>}
              </div>
            )}
            <p className="text-sm text-[var(--text-secondary)]">
              Hit Search above, or try these links:
            </p>
            <div className="flex flex-wrap gap-2">
              <a href={skyUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors">
                Skyscanner ↗
              </a>
              <a href={gfUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors">
                Google Flights ↗
              </a>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-4">
        {flightHeader}
        <div className="space-y-3">
          {flights.map((flight) => {
            const fKey = flight.id || flight.booking_token || flight.flight_number;
            return (
              <FlightCard
                key={flight.booking_token || flight.id || `${flight.airline}-${flight.flight_number}`}
                flight={flight}
                badges={flightBadges[fKey] || []}
                originCode={originCode}
                destCode={destCode}
                date={departDate}
                returnDate={isOneWay ? null : returnDate}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <a href={skyUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors">
            Skyscanner ↗
          </a>
          <a href={gfUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors">
            Google Flights ↗
          </a>
        </div>
      </div>
    );
  }

  if (mode === 'drive') {
    const hours = typeof distanceKm === 'number' ? Math.round(distanceKm / 80) : null;
    const minutes =
      typeof distanceKm === 'number' ? Math.round((distanceKm / 80 - hours) * 60) : null;
    const distanceLabel =
      typeof distanceKm === 'number' ? `${Math.round(distanceKm).toLocaleString()} km` : null;

    const mapsUrl =
      trip.originLat && trip.originLng && trip.destinationLat && trip.destinationLng &&
      `https://www.google.com/maps/dir/?api=1&origin=${trip.originLat},${trip.originLng}&destination=${trip.destinationLat},${trip.destinationLng}&travelmode=driving`;

    const rentalUrl = trip.destinationCity
      ? `https://www.rentalcars.com/SearchResults.do?destination=${encodeURIComponent(trip.destinationCity)}`
      : 'https://www.rentalcars.com/';

    return (
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Drive / Road Trip</h2>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚗</span>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Drive — {distanceLabel || 'Road trip'}
              </p>
              {hours != null && (
                <p className="text-xs text-[var(--text-secondary)]">
                  Est. {hours}h {minutes || 0}m (assuming ~80 km/h)
                </p>
              )}
            </div>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            Rahify recommends driving for this distance. Always check live traffic, tolls, and road conditions before you go.
          </p>
          <div className="flex flex-wrap gap-2">
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors">
                Open in Google Maps ↗
              </a>
            )}
            <a href={rentalUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors">
              Search rental cars ↗
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold text-[var(--text-primary)]">Travel Details</h2>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
        <p className="text-sm text-[var(--text-secondary)]">
          Rahify will soon show train, bus, and ferry options here. For now, use the map and your favorite travel sites to pick the best route.
        </p>
      </div>
    </div>
  );
}
