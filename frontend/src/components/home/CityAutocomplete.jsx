import { useState, useEffect, useRef } from 'react';
import { lookupIATA } from '../../utils/airportCodes';

export default function CityAutocomplete({ label, value, onChange, placeholder }) {
  const [query, setQuery] = useState(value?.city || '');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // keep input in sync when parent value changes
  useEffect(() => {
    setQuery(value?.city || '');
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchCities = async (q) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }

    // Check IATA code first (instant, no API call)
    const iataMatch = lookupIATA(q);

    setLoading(true);
    try {
      // Use the city name for Photon search if we matched an IATA code
      const searchQuery = iataMatch ? iataMatch.city : q;
      const resp = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(
          searchQuery
        )}&limit=6&lang=en&layer=city&layer=locality&layer=district&layer=county`
      );
      const data = await resp.json();
      const cities = (data.features || []).map((feat) => ({
        city: feat.properties.name,
        country: feat.properties.country || '',
        state: feat.properties.state || '',
        lat: feat.geometry.coordinates[1],
        lng: feat.geometry.coordinates[0],
        display: `${feat.properties.name}${
          feat.properties.state ? `, ${feat.properties.state}` : ''
        }, ${feat.properties.country || ''}`,
      }));

      // Prepend IATA match if it exists and isn't already the first result
      let combined = cities;
      if (iataMatch) {
        const alreadyFirst = cities.length > 0 && cities[0].city === iataMatch.city && cities[0].country === iataMatch.country;
        if (!alreadyFirst) {
          combined = [iataMatch, ...cities.filter((c) => !(c.city === iataMatch.city && c.country === iataMatch.country))];
        }
      }

      setResults(combined);
      setIsOpen(combined.length > 0);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Photon API error:', err);
      // Still show IATA match even if Photon fails
      if (iataMatch) {
        setResults([iataMatch]);
        setIsOpen(true);
      } else {
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchCities(val), 300);
  };

  const handleSelect = (city) => {
    setQuery(city.display);
    setIsOpen(false);
    onChange({
      city: city.city,
      country: city.country,
      lat: city.lat,
      lng: city.lng,
    });
  };

  return (
    <div ref={wrapperRef} className="mt-6 max-w-md mx-auto relative">
      {label && (
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
          {label}
        </label>
      )}
      <input
        type="text"
        value={query}
        onChange={handleInput}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        placeholder={placeholder || 'Search any city...'}
        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-brand-500/50 focus-visible:ring-2 focus-visible:ring-brand-500/30 transition-colors text-base"
      />

      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          {results.map((city, i) => (
            <button
              key={`${city.city}-${city.country}-${i}`}
              type="button"
              onClick={() => handleSelect(city)}
              className="w-full text-left px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-3"
            >
              <span className="text-[var(--text-muted)] text-sm">{city.iata ? '✈' : '📍'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                  {city.city}
                  {city.iata && (
                    <span className="text-[10px] font-bold text-brand-500 bg-brand-50 dark:bg-brand-500/10 px-1.5 py-0.5 rounded">
                      {city.iata}
                    </span>
                  )}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {city.state ? `${city.state}, ` : ''}
                  {city.country}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
