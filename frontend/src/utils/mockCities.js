/**
 * Mock cities for CityAutocomplete. Replace with Google Places / API later.
 * Format: { city, country, region, lat, lng }
 */
export const MOCK_CITIES = [
  { city: 'Mumbai', country: 'India', region: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  { city: 'Delhi', country: 'India', region: 'Delhi', lat: 28.7041, lng: 77.1025 },
  { city: 'Bangalore', country: 'India', region: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { city: 'Hyderabad', country: 'India', region: 'Telangana', lat: 17.3850, lng: 78.4867 },
  { city: 'Chennai', country: 'India', region: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { city: 'Kolkata', country: 'India', region: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { city: 'Pune', country: 'India', region: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { city: 'Dubai', country: 'United Arab Emirates', region: 'Dubai', lat: 25.2048, lng: 55.2708 },
  { city: 'London', country: 'United Kingdom', region: 'England', lat: 51.5074, lng: -0.1278 },
  { city: 'Singapore', country: 'Singapore', region: null, lat: 1.3521, lng: 103.8198 },
  { city: 'Paris', country: 'France', region: 'Île-de-France', lat: 48.8566, lng: 2.3522 },
  { city: 'Tokyo', country: 'Japan', region: 'Kantō', lat: 35.6762, lng: 139.6503 },
  { city: 'Bali', country: 'Indonesia', region: null, lat: -8.4095, lng: 115.1889 },
  { city: 'New York', country: 'United States', region: 'New York', lat: 40.7128, lng: -74.0060 },
  { city: 'Los Angeles', country: 'United States', region: 'California', lat: 34.0522, lng: -118.2437 },
  { city: 'San Francisco', country: 'United States', region: 'California', lat: 37.7749, lng: -122.4194 },
  { city: 'Miami', country: 'United States', region: 'Florida', lat: 25.7617, lng: -80.1918 },
  { city: 'Chicago', country: 'United States', region: 'Illinois', lat: 41.8781, lng: -87.6298 },
  { city: 'Barcelona', country: 'Spain', region: 'Catalonia', lat: 41.3851, lng: 2.1734 },
  { city: 'Amsterdam', country: 'Netherlands', region: null, lat: 52.3676, lng: 4.9041 },
  { city: 'Rome', country: 'Italy', region: 'Lazio', lat: 41.9028, lng: 12.4964 },
  { city: 'Sydney', country: 'Australia', region: 'New South Wales', lat: -33.8688, lng: 151.2093 },
  { city: 'Hong Kong', country: 'Hong Kong', region: null, lat: 22.3193, lng: 114.1694 },
  { city: 'Bangkok', country: 'Thailand', region: null, lat: 13.7563, lng: 100.5018 },
  { city: 'Istanbul', country: 'Turkey', region: null, lat: 41.0082, lng: 28.9784 },
  { city: 'Lisbon', country: 'Portugal', region: null, lat: 38.7223, lng: -9.1393 },
  { city: 'Cape Town', country: 'South Africa', region: 'Western Cape', lat: -33.9249, lng: 18.4241 },
  { city: 'Mexico City', country: 'Mexico', region: null, lat: 19.4326, lng: -99.1332 },
  { city: 'Toronto', country: 'Canada', region: 'Ontario', lat: 43.6532, lng: -79.3832 },
];

/**
 * Get city by city name (case-insensitive match).
 * For popular chips we pass city keys; resolve to full city object from MOCK_CITIES.
 */
export function getCitiesByNames(names) {
  const lower = (s) => (s || '').toLowerCase();
  return names
    .map((name) => MOCK_CITIES.find((c) => lower(c.city) === lower(name)))
    .filter(Boolean);
}
