import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
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
  const size = isSelected ? 34 : 28;
  const borderWidth = isSelected ? 4 : 3;

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:${borderWidth}px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
      <span style="color:white;font-size:12px;">${getCategoryEmoji(category)}</span>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 12);
    }
  }, [lat, lng, map]);
  return null;
}

export default function MapPanel() {
  const trip = useTripStore((s) => s.trip);
  const activeSectionId = useTripStore((s) => s.activeSectionId);
  const mapCenter = useTripStore((s) => s.mapCenter);
  const selectedMarkerId = useTripStore((s) => s.selectedMarkerId);
  const setSelectedMarker = useTripStore((s) => s.setSelectedMarker);

  if (!trip) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
        Loading map...
      </div>
    );
  }

  const center = mapCenter || {
    lat: trip.destinationLat,
    lng: trip.destinationLng,
  };

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
    <div className="w-full h-full relative">
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
        <RecenterMap lat={center.lat} lng={center.lng} />

        {places.map((place) => (
          <Marker
            key={place.id}
            position={[place.lat, place.lng]}
            icon={createMarkerIcon(place.category, selectedMarkerId === place.id)}
            eventHandlers={{
              click: () => setSelectedMarker(place.id),
            }}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-semibold text-[var(--text-primary)] mb-1">
                  {place.name}
                </p>
                <p className="text-[var(--text-secondary)] mb-1">
                  {place.category} · {place.rating}★
                </p>
                {place.googleMapsUrl && (
                  <a
                    href={place.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-brand-500 hover:text-brand-600"
                  >
                    View on Google Maps ↗
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <button
        type="button"
        onClick={() => {
          useTripStore.setState({
            mapCenter: { lat: trip.destinationLat, lng: trip.destinationLng },
          });
        }}
        className="absolute top-4 right-4 z-[1000] px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-secondary)] shadow-sm hover:bg-[var(--surface-hover)]"
      >
        Center on destination
      </button>
    </div>
  );
}

