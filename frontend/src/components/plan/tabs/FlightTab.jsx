import { useState, useMemo } from 'react';
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
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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
  const destCode =
    transport.destination_code || trip.destinationIata || trip.destination_iata || '';

  const distanceKm = transport.distance_km || transport.distanceKm;
  const distanceLabel =
    typeof distanceKm === 'number' ? `${Math.round(distanceKm).toLocaleString()} km` : null;

  const cheapestPrice = flights.length
    ? flights.reduce((min, f) => {
        const price = f.price_usd ?? f.priceUsd ?? f.price;
        if (typeof price !== 'number') return min;
        if (min == null) return price;
        return price < min ? price : min;
      }, null)
    : null;

  const handleRefresh = async () => {
    if (!trip?.id || !canRefresh || refreshing) return;
    try {
      setRefreshing(true);
      const data = await apiPost(`/plans/${trip.id}/refresh-flights`, {});
      if (data && !data.error) {
        const updated = {
          ...trip,
          transportData: data,
        };
        setTrip(updated);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const renderHeader = (title, subtitle) => (
    <div className="flex items-center justify-between gap-2">
      <div>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
        {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
        {!canRefresh && refreshTip && (
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            Refresh available in {refreshTip.mins} min (at {refreshTip.at})
          </p>
        )}
      </div>
      {mode === 'flight' && (
        <button
          type="button"
          onClick={handleRefresh}
          disabled={!canRefresh || refreshing}
          title={
            !canRefresh && refreshTip
              ? `Available at ${refreshTip.at} (${refreshTip.mins} min)`
              : undefined
          }
          className={`text-xs px-3 py-1.5 min-h-[44px] rounded-full border border-[var(--border)] bg-[var(--surface)] transition-colors ${
            !canRefresh || refreshing
              ? 'text-[var(--text-muted)] cursor-not-allowed opacity-60'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] cursor-pointer'
          }`}
        >
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      )}
    </div>
  );

  if (mode === 'flight') {
    const date = trip.startDate || trip.start_date;
    const gfUrl =
      originCode && destCode && date
        ? `https://www.google.com/travel/flights?q=flights+from+${encodeURIComponent(
            originCode
          )}+to+${encodeURIComponent(destCode)}+on+${encodeURIComponent(date)}`
        : 'https://www.google.com/travel/flights';

    const skyUrl =
      originCode && destCode && date
        ? `https://www.skyscanner.com/transport/flights/${originCode.toLowerCase()}/${destCode.toLowerCase()}/${String(date)
            .replace(/-/g, '')
            .slice(2)}/`
        : 'https://www.skyscanner.com/transport/flights';

    // Never show an empty list. If we have no cards, show fallback links.
    if (flights.length === 0) {
      const date = trip.startDate || trip.start_date;
      const gfUrl =
        originCode && destCode && date
          ? `https://www.google.com/travel/flights?q=flights+from+${encodeURIComponent(
              originCode
            )}+to+${encodeURIComponent(destCode)}+on+${encodeURIComponent(date)}`
          : 'https://www.google.com/travel/flights';

      const skyUrl =
        originCode && destCode && date
          ? `https://www.skyscanner.com/transport/flights/${originCode.toLowerCase()}/${destCode.toLowerCase()}/${String(
              date
            )
              .replace(/-/g, '')
              .slice(2)}/`
          : 'https://www.skyscanner.com/transport/flights';

      return (
        <div className="p-4 space-y-4">
          {renderHeader(
            `Flights: ${trip.originCity || originCode} → ${trip.destinationCity || destCode}`,
            'Live flight search coming soon – use these links meanwhile.'
          )}
          <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
            {(error || note) && (
              <div className="rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                {error && <p className="font-semibold text-[var(--text-primary)]">{error}</p>}
                {note && <p className="mt-0.5">{note}</p>}
              </div>
            )}
            <p className="text-sm text-[var(--text-secondary)]">
              For now, search directly on:
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href={skyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors"
              >
                Search on Skyscanner ↗
              </a>
              <a
                href={gfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                Search on Google Flights ↗
              </a>
            </div>
          </div>
        </div>
      );
    }

    const pricesLabel =
      fetchedAt || cached
        ? `Prices as of ${formatRelativeTime(fetchedAt)}${cached ? ' (cached)' : ''}`
        : 'Prices updated recently';

    return (
      <div className="p-4 space-y-4">
        {renderHeader('Flight Options', pricesLabel)}
        <div className="space-y-3">
          {flights.map((flight) => (
            <FlightCard
              key={flight.booking_token || flight.id || `${flight.airline}-${flight.flight_number}`}
              flight={flight}
              isCheapest={
                cheapestPrice != null &&
                (flight.price_usd ?? flight.priceUsd ?? flight.price) === cheapestPrice
              }
              originCode={originCode}
              destCode={destCode}
              date={transport.departure_date || trip.startDate || trip.start_date}
            />
          ))}
        </div>
        <div className="pt-1">
          <div className="flex flex-wrap gap-2">
            <a
              href={skyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              Search on Skyscanner ↗
            </a>
            <a
              href={gfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              Search on Google Flights ↗
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'drive') {
    const hours = typeof distanceKm === 'number' ? Math.round(distanceKm / 80) : null;
    const minutes =
      typeof distanceKm === 'number' ? Math.round((distanceKm / 80 - hours) * 60) : null;

    const mapsUrl =
      trip.originLat &&
      trip.originLng &&
      trip.destinationLat &&
      trip.destinationLng &&
      `https://www.google.com/maps/dir/?api=1&origin=${trip.originLat},${trip.originLng}&destination=${trip.destinationLat},${trip.destinationLng}&travelmode=driving`;

    const rentalUrl = trip.destinationCity
      ? `https://www.rentalcars.com/SearchResults.do?destination=${encodeURIComponent(
          trip.destinationCity
        )}`
      : 'https://www.rentalcars.com/';

    return (
      <div className="p-4 space-y-4">
        {renderHeader('Drive / Road Trip', null)}
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
            Rahify recommends driving for this distance. Always check live traffic, tolls, and road
            conditions before you go.
          </p>
          <div className="flex flex-wrap gap-2">
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors"
              >
                Open in Google Maps ↗
              </a>
            )}
            <a
              href={rentalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              Search rental cars ↗
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {renderHeader('Travel Details', null)}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
        <p className="text-sm text-[var(--text-secondary)]">
          Rahify will soon show train, bus, and ferry options here. For now, use the map and your
          favorite travel sites to pick the best route.
        </p>
      </div>
    </div>
  );
}

