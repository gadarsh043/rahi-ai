import { useState, useEffect, useRef } from 'react';

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
    setLoading(true);
    try {
      const resp = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(
          q
        )}&limit=5&lang=en&layer=city`
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
      setResults(cities);
      setIsOpen(cities.length > 0);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Photon API error:', err);
      setResults([]);
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
    <div ref={wrapperRef} className="mt-6 max-w-md relative">
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
        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-brand-500/50 transition-colors text-base"
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
              <span className="text-[var(--text-muted)]">📍</span>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {city.city}
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
