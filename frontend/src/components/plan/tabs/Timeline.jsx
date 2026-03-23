import { useState, useRef, useEffect } from 'react';
import useTripStore from '../../../stores/tripStore';

function buildMapsSearchUrl(title, destinationCity) {
  const query = encodeURIComponent(`${title} ${destinationCity || ''}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

async function geocodePlace(title, destinationCity) {
  const query = `${title} ${destinationCity || ''}`.trim();
  try {
    const resp = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`
    );
    const data = await resp.json();
    const feature = data?.features?.[0];
    if (feature?.geometry?.coordinates) {
      const [lng, lat] = feature.geometry.coordinates;
      const props = feature.properties || {};
      return {
        lat,
        lng,
        name: props.name || title,
        address: [props.street, props.city, props.state, props.country]
          .filter(Boolean)
          .join(', '),
      };
    }
  } catch {
    // Geocode failed — fall through
  }
  return null;
}

function ActivityItem({ activity, dayNumber, actIndex, places, destinationCity }) {
  const placeData = activity.place_id
    ? places.find(
        (p) =>
          p.google_place_id === activity.place_id ||
          p.googlePlaceId === activity.place_id
      )
    : null;

  const isClickable = placeData || activity.title;

  const handleClick = async () => {
    if (placeData && typeof placeData.lat === 'number' && typeof placeData.lng === 'number') {
      useTripStore.getState().focusPlace(placeData);
      return;
    }

    if (!activity.title) return;

    const mapsUrl = buildMapsSearchUrl(activity.title, destinationCity);
    const geo = await geocodePlace(activity.title, destinationCity);

    if (geo) {
      // Geocode succeeded — show on map with info card
      useTripStore.getState().setMapMessage({
        title: activity.title,
        text: geo.address || '',
        mapsUrl,
        lat: geo.lat,
        lng: geo.lng,
        countdown: 0,
      });
    } else {
      // Geocode failed — show message + auto-open Google Maps
      let remaining = 10;
      const interval = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          clearInterval(interval);
          window.open(mapsUrl, '_blank', 'noopener');
          setTimeout(() => useTripStore.getState().clearMapMessage(), 500);
        } else {
          useTripStore.getState().setMapMessage({
            title: activity.title,
            text: 'Google Maps has more details on this spot — opening it for you.',
            mapsUrl,
            countdown: remaining,
            _intervalId: interval,
          });
        }
      }, 1000);

      useTripStore.getState().setMapMessage({
        title: activity.title,
        text: 'Google Maps has more details on this spot — opening it for you.',
        mapsUrl,
        countdown: 10,
        _intervalId: interval,
      });
    }
  };

  return (
    <div className="relative">
      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand-500 border-2 border-[var(--bg)]" />

      <div
        className={`flex items-start gap-3 ${isClickable ? 'cursor-pointer hover:bg-[var(--surface-hover)] -mx-2 px-2 py-1 rounded-lg transition-colors' : ''}`}
        onClick={isClickable ? handleClick : undefined}
      >
        <span className="text-xs font-mono text-[var(--text-muted)] w-12 flex-shrink-0 pt-0.5">
          {activity.time}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {activity.title}
          </p>
          {activity.detail && (
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {activity.detail}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function getDayDate(startDate, dayNumber) {
  if (!startDate) return null;
  // Parse YYYY-MM-DD strictly in local time to avoid UTC timezone offsets shifting it a day back
  const datePart = startDate.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + (dayNumber - 1));
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function DayAlertIcon({ alert }) {
  const [show, setShow] = useState(false);
  const ref = useRef(null);
  const [position, setPosition] = useState('bottom');

  useEffect(() => {
    if (show && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      // If tooltip would overflow bottom, show above
      setPosition(rect.bottom + 80 > window.innerHeight ? 'top' : 'bottom');
    }
  }, [show]);

  return (
    <span
      ref={ref}
      className="relative inline-flex items-center ml-1.5"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onTouchStart={() => setShow((s) => !s)}
    >
      <span className="w-4 h-4 rounded-full border border-amber-400/60 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center justify-center cursor-default select-none">
        i
      </span>
      {show && (
        <span
          className={`absolute left-1/2 -translate-x-1/2 z-30 w-56 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] shadow-lg text-xs text-[var(--text-secondary)] leading-relaxed pointer-events-none ${
            position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          {alert}
        </span>
      )}
    </span>
  );
}

export default function Timeline({ itinerary }) {
  const trip = useTripStore((s) => s.trip);
  const places = trip?.places || [];
  const startDate = trip?.startDate;
  const destinationCity = trip?.destinationCity || '';

  if (!Array.isArray(itinerary) || itinerary.length === 0) return null;

  return (
    <div className="mt-4">
      {itinerary.map((day, dayIndex) => {
        const dayNumber = day.dayNumber ?? day.day_number ?? dayIndex + 1;
        const dayTitle = day.title ?? day.day_title ?? '';
        const dayAlert = day.dayAlert ?? day.day_alert ?? null;
        const activities = Array.isArray(day.activities) ? day.activities : [];
        const dateStr = getDayDate(startDate, dayNumber);
        return (
        <div key={`day-${dayNumber}-${dayTitle || dayIndex}`} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-500">
              Day {dayNumber}{dateStr ? ` (${dateStr})` : ''}
            </span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {dayTitle}
            </span>
            {dayAlert && <DayAlertIcon alert={dayAlert} />}
          </div>

          <div className="space-y-3 ml-2 border-l-2 border-[var(--border)] pl-4">
            {activities.map((activity, actIndex) => (
              <ActivityItem
                key={`act-${dayNumber}-${activity.time || 't'}-${activity.title || 'a'}-${actIndex}`}
                activity={activity}
                dayNumber={dayNumber}
                actIndex={actIndex}
                places={places}
                destinationCity={destinationCity}
              />
            ))}
          </div>
        </div>
      );})}
    </div>
  );
}
