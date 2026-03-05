import { useEffect, useMemo, useRef } from 'react';
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

export default function MapPanel({ trip: tripProp, places: placesProp, activeTab }) {
  const tripFromStore = useTripStore((s) => s.trip);
  const activeSectionIdStore = useTripStore((s) => s.activeSectionId);
  const mapCenter = useTripStore((s) => s.mapCenter);
  const selectedMarkerId = useTripStore((s) => s.selectedMarkerId);
  const setSelectedMarker = useTripStore((s) => s.setSelectedMarker);

  const trip = tripProp || tripFromStore;
  const activeSectionId = activeTab || activeSectionIdStore;

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
        <RecenterMap lat={center.lat} lng={center.lng} />
        <RoutesLayer activeTab={activeSectionId} trip={trip} allPlaces={allPlaces} />

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
        className="absolute top-4 right-4 z-[var(--z-overlay)] px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-secondary)] shadow-sm hover:bg-[var(--surface-hover)]"
        aria-label="Center map on destination"
      >
        Center on destination
      </button>
    </div>
  );
}

