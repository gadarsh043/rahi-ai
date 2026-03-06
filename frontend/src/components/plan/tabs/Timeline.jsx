import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useTripStore from '../../../stores/tripStore';

function PlaceTooltip({ place, anchorRef }) {
  if (!place) return null;

  const categoryEmoji =
    place.category === 'restaurant' ? '🍽' :
    place.category === 'hotel' ? '🏨' :
    place.category === 'cafe' ? '☕' :
    place.category === 'nightlife' ? '🍸' :
    place.category === 'outdoor' ? '🌲' : '📍';

  const [pos, setPos] = useState({ top: '100%', left: 0 });

  useEffect(() => {
    if (!anchorRef?.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    // Try right side first, fall back to below
    if (rect.right + 272 < vw) {
      setPos({ top: 0, left: '100%', marginLeft: 12 });
    } else {
      setPos({ top: '100%', left: 0, marginTop: 8 });
    }
  }, [anchorRef]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15 }}
      style={pos}
      className="absolute z-50 w-64 bg-white dark:bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden pointer-events-none"
    >
      {place.photo_url || place.photoUrl ? (
        <div className="h-28 w-full bg-[var(--surface-hover)]">
          <img
            src={place.photo_url || place.photoUrl}
            alt={place.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-20 w-full bg-[var(--surface-hover)] flex items-center justify-center">
          <span className="text-3xl">{categoryEmoji}</span>
        </div>
      )}

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] leading-tight">
            {place.name}
          </h4>
          {place.rating && (
            <span className="flex items-center gap-0.5 text-xs font-semibold text-brand-500 shrink-0">
              {place.rating} <span className="text-brand-400">★</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium capitalize">
            {place.category}
          </span>
          {place.price_level != null && place.price_level > 0 && (
            <span className="text-[11px] text-[var(--text-muted)]">
              {'$'.repeat(place.price_level)}
            </span>
          )}
        </div>

        {place.address && (
          <p className="text-[11px] text-[var(--text-muted)] mt-1.5 line-clamp-1">
            {place.address}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function ActivityItem({ activity, dayNumber, actIndex, places }) {
  const [hovered, setHovered] = useState(false);
  const itemRef = useRef(null);

  const placeData = activity.place_id
    ? places.find(
        (p) =>
          p.google_place_id === activity.place_id ||
          p.googlePlaceId === activity.place_id
      )
    : null;

  return (
    <div
      ref={itemRef}
      className="relative"
      onMouseEnter={() => placeData && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand-500 border-2 border-[var(--bg)]" />

      <div className="flex items-start gap-3">
        <span className="text-xs font-mono text-[var(--text-muted)] w-12 flex-shrink-0 pt-0.5">
          {activity.time}
        </span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium text-[var(--text-primary)] ${placeData ? 'cursor-default' : ''}`}>
            {activity.title}
          </p>
          {activity.detail && (
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {activity.detail}
            </p>
          )}
        </div>
      </div>

      <AnimatePresence>
        {hovered && placeData && (
          <PlaceTooltip place={placeData} anchorRef={itemRef} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Timeline({ itinerary }) {
  const trip = useTripStore((s) => s.trip);
  const places = trip?.places || [];

  if (!Array.isArray(itinerary) || itinerary.length === 0) return null;

  return (
    <div className="mt-4">
      {itinerary.map((day, dayIndex) => {
        const dayNumber = day.dayNumber ?? day.day_number ?? dayIndex + 1;
        const dayTitle = day.title ?? day.day_title ?? '';
        const activities = Array.isArray(day.activities) ? day.activities : [];
        return (
        <div key={`day-${dayNumber}-${dayTitle || dayIndex}`} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-500">
              Day {dayNumber}
            </span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {dayTitle}
            </span>
          </div>

          <div className="space-y-3 ml-2 border-l-2 border-[var(--border)] pl-4">
            {activities.map((activity, actIndex) => (
              <ActivityItem
                key={`act-${dayNumber}-${activity.time || 't'}-${activity.title || 'a'}-${actIndex}`}
                activity={activity}
                dayNumber={dayNumber}
                actIndex={actIndex}
                places={places}
              />
            ))}
          </div>
        </div>
      );})}
    </div>
  );
}
