export default function PlaceCard({ place, variant = 'standard', showActions = true }) {
  const isHotel = place.category === 'hotel';
  const isAttraction = place.category === 'attraction';

  const Wrapper = ({ children }) => (
    <div
      className={`flex gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:shadow-md transition-shadow ${
        variant === 'compact' ? 'items-center' : ''
      }`}
    >
      {children}
    </div>
  );

  const Photo = () => (
    <div
      className={`flex-shrink-0 rounded-lg overflow-hidden bg-[var(--surface-hover)] ${
        variant === 'compact' ? 'w-[80px] h-[72px]' : 'w-[120px] h-[100px]'
      }`}
    >
      {place.photoUrl ? (
        <img
          src={place.photoUrl}
          alt={place.name}
          className="w-full h-full object-cover"
        />
      ) : null}
    </div>
  );

  const MetaTags = () => (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      {place.cuisineType && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-hover)] text-[var(--text-secondary)]">
          {place.cuisineType}
        </span>
      )}
      {place.priceLevel !== undefined && place.priceLevel !== null && (
        <span className="text-xs text-[var(--text-muted)]">
          {'$'.repeat(place.priceLevel || 1)}
        </span>
      )}
      {place.visitDuration && (
        <span className="text-xs text-[var(--text-muted)]">
          {place.visitDuration}
          min
        </span>
      )}
      {isHotel && place.pricePerNight && (
        <span className="text-xs font-semibold text-[var(--text-primary)]">
          ${place.pricePerNight}/night
        </span>
      )}
      {isAttraction && place.ticketPrice !== undefined && place.ticketPrice !== null && (
        <span className="text-xs text-[var(--text-muted)]">
          {place.ticketPrice > 0 ? `$${place.ticketPrice}/person` : 'Free entry'}
        </span>
      )}
    </div>
  );

  const HotelExtras = () => {
    if (!isHotel) return null;
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {(place.amenities || []).map((amenity) => (
          <span
            key={amenity}
            className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--surface-hover)] text-[var(--text-secondary)]"
          >
            {amenity}
          </span>
        ))}
      </div>
    );
  };

  const AttractionExtras = () => {
    if (!isAttraction) return null;
    return (
      <div className="mt-2">
        {place.famousFor && (
          <p className="text-sm italic text-[var(--text-secondary)]">
            Famous for: {place.famousFor}
          </p>
        )}
      </div>
    );
  };

  const Actions = () => {
    if (!showActions) return null;
    return (
      <div className="flex items-center gap-3 mt-3">
        {place.googleMapsUrl && (
          <a
            href={place.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--text-muted)] hover:text-brand-500 transition-colors"
          >
            Details →
          </a>
        )}
        {place.affiliateUrl && (
          <a
            href={place.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors"
          >
            {place.category === 'hotel'
              ? 'Book Now ↗'
              : place.category === 'attraction'
              ? 'Get Tickets ↗'
              : 'Reserve ↗'}
          </a>
        )}
      </div>
    );
  };

  return (
    <Wrapper>
      <Photo />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-[var(--text-primary)] truncate">
            {place.name}
          </h3>
          {place.rating && (
            <span className="flex items-center gap-1 text-sm font-semibold text-brand-500 flex-shrink-0">
              {place.rating}
              <span className="text-brand-400">★</span>
            </span>
          )}
        </div>

        {place.description && (
          <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
            {place.description}
          </p>
        )}

        <MetaTags />
        <HotelExtras />
        <AttractionExtras />
        <Actions />
      </div>
    </Wrapper>
  );
}

