import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { AnimatePresence, motion } from 'framer-motion';
import useTripStore from '../../../stores/tripStore';
import { MARKER_COLORS } from '../../../utils/mockTripData';

const getCategoryEmoji = (cat) => {
  switch (cat) {
    case 'restaurant':
      return '🍽';
    case 'hotel':
      return '🏠';
    case 'attraction':
      return '📍';
    case 'cafe':
      return '☕';
    default:
      return '📌';
  }
};

const createMarkerIcon = (category, isSelected) => {
  const color = MARKER_COLORS[category] || '#6B7280';

  if (isSelected) {
    const size = 44;
    const outer = 60;
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="position:relative;width:${outer}px;height:${outer}px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;inset:0;border-radius:50%;border:3px solid ${color};opacity:0.4;animation:marker-pulse 1.5s ease-out infinite;"></div>
        <div style="background:white;width:${size}px;height:${size}px;border-radius:50%;border:4px solid ${color};box-shadow:0 4px 12px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;z-index:1;">
          <span style="font-size:18px;">${getCategoryEmoji(category)}</span>
        </div>
      </div>`,
      iconSize: [outer, outer],
      iconAnchor: [outer / 2, outer / 2],
    });
  }

  const size = 28;
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
      <span style="color:white;font-size:12px;">${getCategoryEmoji(category)}</span>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

function isValidCoord(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function RecenterMap({ lat, lng, zoom }) {
  const map = useMap();
  const hasMoved = useRef(false);
  useEffect(() => {
    if (!isValidCoord(lat) || !isValidCoord(lng)) return;
    try {
      const size = map.getSize();
      if (!hasMoved.current || !size.x || !size.y) {
        map.setView([lat, lng], zoom || 12);
        hasMoved.current = true;
      } else {
        map.flyTo([lat, lng], zoom || 12, { duration: 0.8 });
      }
    } catch {
      map.setView([lat, lng], zoom || 12);
    }
  }, [lat, lng, zoom, map]);
  return null;
}

function RoutesLayer({ activeTab, trip, allPlaces }) {
  const map = useMap();
  const routeGroupRef = useRef(null);

  useEffect(() => {
    if (!map || !trip) return;

    // Clear previous routes
    if (routeGroupRef.current) {
      routeGroupRef.current.clearLayers();
      map.removeLayer(routeGroupRef.current);
    }
    routeGroupRef.current = L.layerGroup().addTo(map);

    const originLat = trip.originLat ?? trip.origin_lat;
    const originLng = trip.originLng ?? trip.origin_lng;
    const destLat = trip.destinationLat ?? trip.destination_lat;
    const destLng = trip.destinationLng ?? trip.destination_lng;

    // FLIGHT TAB: curved dashed line from origin to destination
    if (
      activeTab === 'flight' &&
      typeof originLat === 'number' &&
      typeof originLng === 'number' &&
      typeof destLat === 'number' &&
      typeof destLng === 'number'
    ) {
      const origin = [originLat, originLng];
      const dest = [destLat, destLng];

      const midLat = (origin[0] + dest[0]) / 2;
      const midLng = (origin[1] + dest[1]) / 2;
      const offset = Math.abs(origin[1] - dest[1]) * 0.15;
      const curvedMid = [midLat + offset, midLng];

      const points = [];
      for (let t = 0; t <= 1.0001; t += 0.05) {
        const lat =
          (1 - t) * (1 - t) * origin[0] +
          2 * (1 - t) * t * curvedMid[0] +
          t * t * dest[0];
        const lng =
          (1 - t) * (1 - t) * origin[1] +
          2 * (1 - t) * t * curvedMid[1] +
          t * t * dest[1];
        points.push([lat, lng]);
      }

      const routeLine = L.polyline(points, {
        color: '#F97316', // brand-500
        weight: 2.5,
        opacity: 0.7,
        dashArray: '8, 8',
      });

      const originMarker = L.circleMarker(origin, {
        radius: 6,
        fillColor: '#10B981',
        fillOpacity: 1,
        color: '#ffffff',
        weight: 2,
      }).bindPopup(
        `<b>${trip.originCity || trip.origin_city || 'Origin'}</b><br/>Origin`
      );

      const destMarker = L.circleMarker(dest, {
        radius: 6,
        fillColor: '#EF4444',
        fillOpacity: 1,
        color: '#ffffff',
        weight: 2,
      }).bindPopup(
        `<b>${trip.destinationCity || trip.destination_city || 'Destination'}</b><br/>Destination`
      );

      routeGroupRef.current.addLayer(routeLine);
      routeGroupRef.current.addLayer(originMarker);
      routeGroupRef.current.addLayer(destMarker);

      map.fitBounds([origin, dest], { padding: [40, 40] });
    }

    // TRIP TAB: connect activities by day
    if (activeTab === 'trip' && trip.itinerary) {
      const days =
        Array.isArray(trip.itinerary?.itinerary) && trip.itinerary.itinerary.length
          ? trip.itinerary.itinerary
          : Array.isArray(trip.itinerary)
          ? trip.itinerary
          : [];

      const allPoints = [];
      const dayColors = [
        '#3B82F6',
        '#8B5CF6',
        '#10B981',
        '#F59E0B',
        '#EF4444',
        '#EC4899',
        '#14B8A6',
      ];

      days.forEach((day, dayIdx) => {
        const dayPoints = [];
        (day.activities || []).forEach((act) => {
          if (typeof act.lat === 'number' && typeof act.lng === 'number') {
            dayPoints.push([act.lat, act.lng]);
          } else if (act.place_id) {
            const place =
              allPlaces?.find(
                (p) =>
                  p.google_place_id === act.place_id ||
                  p.googlePlaceId === act.place_id ||
                  p.id === act.place_id
              ) || null;
            if (place && typeof place.lat === 'number' && typeof place.lng === 'number') {
              dayPoints.push([place.lat, place.lng]);
            }
          }
        });

        if (dayPoints.length > 1) {
          const line = L.polyline(dayPoints, {
            color: dayColors[dayIdx % dayColors.length],
            weight: 2,
            opacity: 0.6,
            dashArray: '4, 6',
          }).bindPopup(
            `Day ${day.day_number || dayIdx + 1}: ${day.title || ''}`.trim()
          );
          routeGroupRef.current.addLayer(line);
        }
        allPoints.push(...dayPoints);
      });

      if (allPoints.length > 0) {
        map.fitBounds(allPoints, { padding: [30, 30] });
      }
    }

    return () => {
      if (routeGroupRef.current) {
        routeGroupRef.current.clearLayers();
        map.removeLayer(routeGroupRef.current);
        routeGroupRef.current = null;
      }
    };
  }, [activeTab, trip, allPlaces, map]);

  return null;
}

function FlyToSelected({ places, selectedId }) {
  const map = useMap();
  const prevId = useRef(null);

  useEffect(() => {
    if (!selectedId || selectedId === prevId.current) return;
    prevId.current = selectedId;
    const place = places.find((p) => p.id === selectedId);
    if (place && isValidCoord(place.lat) && isValidCoord(place.lng)) {
      try {
        const size = map.getSize();
        if (size.x && size.y) {
          map.flyTo([place.lat, place.lng], 16, { duration: 0.8 });
        } else {
          map.setView([place.lat, place.lng], 16);
        }
      } catch {
        map.setView([place.lat, place.lng], 16);
      }
    }
  }, [selectedId, places, map]);

  return null;
}

function formatRatingCount(count) {
  if (!count) return '';
  if (count >= 1000) return `(${(count / 1000).toFixed(1).replace(/\.0$/, '')}K)`;
  return `(${count})`;
}

function MapInfoCard({ place, onClose }) {
  if (!place) return null;

  const typeLabel = place.typeDisplay || (
    place.category === 'restaurant' ? 'Restaurant' :
    place.category === 'hotel' ? 'Hotel' :
    place.category === 'attraction' ? 'Attraction' :
    place.category === 'cafe' ? 'Café' :
    place.category === 'nightlife' ? 'Nightlife' :
    place.category === 'outdoor' ? 'Outdoor' : 'Place'
  );

  const hours = place.openingHoursDisplay || '';
  const website = place.website || '';
  const ratingCount = place.userRatingCount;
  const description = place.description || '';
  const priceLevel = place.priceLevel ?? place.price_level;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="absolute bottom-4 left-4 right-4 z-[1000] bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden"
    >
      <div className="flex gap-3 p-3">
        {/* Photo */}
        <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-[var(--surface-hover)]">
          {place.photoUrl || place.photo_url ? (
            <img
              src={place.photoUrl || place.photo_url}
              alt={place.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              {place.category === 'restaurant' ? '🍽' : place.category === 'hotel' ? '🏨' : '📍'}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)] truncate">
              {place.name}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors text-xs"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Rating + type + price */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {place.rating && (
              <span className="flex items-center gap-0.5 text-sm font-semibold text-brand-500">
                {place.rating}
                <span className="text-brand-400">★</span>
                {ratingCount > 0 && (
                  <span className="text-[11px] font-normal text-[var(--text-muted)] ml-0.5">
                    {formatRatingCount(ratingCount)}
                  </span>
                )}
              </span>
            )}
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium">
              {typeLabel}
            </span>
            {priceLevel != null && priceLevel > 0 && (
              <span className="text-xs text-[var(--text-muted)]">
                {'$'.repeat(priceLevel)}
              </span>
            )}
            {place.isInItinerary && (
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-success/10 text-success font-medium">
                In itinerary
              </span>
            )}
          </div>

          {/* Description */}
          {description && (
            <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
              {description}
            </p>
          )}

          {/* Address + hours */}
          <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
            {place.address && (
              <span className="truncate">{place.address}</span>
            )}
            {place.address && hours && <span>·</span>}
            {hours && hours !== 'hours N/A' && (
              <span className="flex-shrink-0">{hours}</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-2">
            {(place.googleMapsUrl || place.google_maps_url) && (
              <a
                href={place.googleMapsUrl || place.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors"
              >
                Google Maps ↗
              </a>
            )}
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Website ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MapMessageCard({ message, onClose }) {
  if (!message) return null;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="absolute bottom-4 left-4 right-4 z-[1000] bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
            {message.title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors text-xs"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {message.text}
        </p>
        <div className="flex items-center gap-3 mt-3">
          {message.mapsUrl && (
            <a
              href={message.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors"
            >
              Open in Google Maps ↗
            </a>
          )}
          {message.countdown > 0 && (
            <span className="text-xs text-[var(--text-muted)]">
              Opening in {message.countdown}s...
            </span>
          )}
          {message.countdown > 0 && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors ml-auto"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function MapPanel({ trip: tripProp, places: placesProp, activeTab }) {
  const tripFromStore = useTripStore((s) => s.trip);
  const activeSectionIdStore = useTripStore((s) => s.activeSectionId);
  const mapCenter = useTripStore((s) => s.mapCenter);
  const mapZoom = useTripStore((s) => s.mapZoom);
  const selectedMarkerId = useTripStore((s) => s.selectedMarkerId);
  const setSelectedMarker = useTripStore((s) => s.setSelectedMarker);
  const mapMessage = useTripStore((s) => s.mapMessage);
  const clearMapMessage = useTripStore((s) => s.clearMapMessage);

  const trip = tripProp || tripFromStore;
  const activeSectionId = activeTab || activeSectionIdStore;

  if (!trip) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
        Loading map...
      </div>
    );
  }

  const rawCenter = mapCenter || {
    lat: trip.destinationLat,
    lng: trip.destinationLng,
  };
  const center = {
    lat: isValidCoord(rawCenter.lat) ? rawCenter.lat : 0,
    lng: isValidCoord(rawCenter.lng) ? rawCenter.lng : 0,
  };

  const allPlaces = useMemo(
    () => (Array.isArray(placesProp) ? placesProp : trip.places || []),
    [placesProp, trip.places]
  );

  const places = useMemo(() => {
    if (!Array.isArray(trip.places)) return [];
    switch (activeSectionId) {
      case 'eat':
        return trip.places.filter((p) => p.category === 'restaurant');
      case 'stay':
        return trip.places.filter((p) => p.category === 'hotel');
      case 'go':
        return trip.places.filter((p) => p.category === 'attraction');
      default:
        return trip.places;
    }
  }, [trip.places, activeSectionId]);

  return (
    <div data-tour="map-panel" className="w-full h-full relative">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={12}
        scrollWheelZoom
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap lat={center.lat} lng={center.lng} zoom={mapZoom} />
        <RoutesLayer activeTab={activeSectionId} trip={trip} allPlaces={allPlaces} />

        <FlyToSelected places={allPlaces} selectedId={selectedMarkerId} />
        {places.filter((p) => isValidCoord(p.lat) && isValidCoord(p.lng)).map((place) => (
          <Marker
            key={place.id}
            position={[place.lat, place.lng]}
            icon={createMarkerIcon(place.category, selectedMarkerId === place.id)}
            eventHandlers={{
              click: () => setSelectedMarker(place.id),
            }}
          />
        ))}
        {/* Temporary marker for geocoded/mapMessage places */}
        {mapMessage && isValidCoord(mapMessage.lat) && isValidCoord(mapMessage.lng) && (
          <Marker
            position={[mapMessage.lat, mapMessage.lng]}
            icon={createMarkerIcon('attraction', true)}
          />
        )}
      </MapContainer>

      <button
        type="button"
        onClick={() => {
          useTripStore.setState({
            mapCenter: { lat: trip.destinationLat, lng: trip.destinationLng },
            mapZoom: null,
            selectedMarkerId: null,
          });
        }}
        className="absolute top-4 right-4 z-[1000] px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-secondary)] shadow-sm hover:bg-[var(--surface-hover)]"
        aria-label="Center map on destination"
      >
        Center on destination
      </button>

      <AnimatePresence>
        {selectedMarkerId && !mapMessage && (
          <MapInfoCard
            place={allPlaces.find((p) => p.id === selectedMarkerId)}
            onClose={() => setSelectedMarker(null)}
          />
        )}
        {mapMessage && (
          <MapMessageCard
            message={mapMessage}
            onClose={clearMapMessage}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

