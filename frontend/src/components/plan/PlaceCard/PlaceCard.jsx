import { memo } from 'react';
import useTripStore from '../../../stores/tripStore';

function formatCount(count) {
  if (!count) return '';
  if (count >= 1000) return `(${(count / 1000).toFixed(1).replace(/\.0$/, '')}K)`;
  return `(${count})`;
}

export default memo(function PlaceCard({ place, variant = 'standard' }) {
  const hasCoords = typeof place.lat === 'number' && typeof place.lng === 'number';

  const handleClick = () => {
    if (hasCoords) {
      useTripStore.getState().focusPlace(place);
    }
  };

  const categoryEmoji =
    place.category === 'restaurant'
      ? '🍽'
      : place.category === 'hotel'
      ? '🏨'
      : '📍';

  const typeLabel = place.typeDisplay || '';

  return (
    <div
      onClick={handleClick}
      className={`flex gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] transition-all ${
        hasCoords ? 'cursor-pointer active:scale-[0.98] hover:border-brand-300' : ''
      } ${variant === 'compact' ? 'items-center' : ''}`}
    >
      {/* Photo */}
      <div className="flex-shrink-0 rounded-lg overflow-hidden bg-[var(--surface-hover)] w-14 h-14 lg:w-24 lg:h-20 flex items-center justify-center">
        {place.photoUrl ? (
          <img
            src={place.photoUrl}
            alt={place.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-2xl">{categoryEmoji}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-semibold text-[var(--text-primary)] truncate">
            {place.name}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            {place.rating && (
              <span className="flex items-center gap-0.5 text-sm font-semibold text-brand-500">
                {place.rating}
                <span className="text-brand-400">★</span>
              </span>
            )}
            {place.userRatingCount > 0 && (
              <span className="text-[11px] text-[var(--text-muted)]">
                {formatCount(place.userRatingCount)}
              </span>
            )}
          </div>
        </div>

        {place.description && (
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-1">
            {place.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          {typeLabel && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-hover)] text-[var(--text-secondary)]">
              {typeLabel}
            </span>
          )}
          {place.priceLevel != null && place.priceLevel > 0 && (
            <span className="text-xs text-[var(--text-muted)]">
              {'$'.repeat(place.priceLevel)}
            </span>
          )}
          {place.openingHoursDisplay && place.openingHoursDisplay !== 'hours N/A' && (
            <span className="text-xs text-[var(--text-muted)]">
              {place.openingHoursDisplay}
            </span>
          )}
          {place.affiliateUrl && (
            <a
              href={place.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors"
            >
              {place.category === 'hotel' ? 'Book ↗' : place.category === 'attraction' ? 'Tickets ↗' : 'Reserve ↗'}
            </a>
          )}
          {place.isInItinerary && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-success/10 text-success font-medium">
              In itinerary
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

