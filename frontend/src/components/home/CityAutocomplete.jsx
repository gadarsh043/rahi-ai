import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_CITIES } from '../../utils/mockCities';

function formatCityLabel(city) {
  if (!city || !city.city) return '';
  return city.region ? `${city.city}, ${city.region}` : city.city;
}

function formatCountry(city) {
  return city?.country ?? '';
}

export default function CityAutocomplete({ placeholder, value, onChange, popularCities = [] }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRef = useRef(null);

  const isSelected = value != null && typeof value === 'object' && value.city;

  const filtered = query.trim().length > 0
    ? MOCK_CITIES.filter(
        (c) =>
          c.city.toLowerCase().includes(query.toLowerCase()) ||
          (c.country && c.country.toLowerCase().includes(query.toLowerCase())) ||
          (c.region && c.region.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 5)
    : [];

  const showDropdown = !isSelected && query.trim().length > 0;
  const displayChips = popularCities.slice(0, 4);

  useEffect(() => {
    setFocusedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!showDropdown) return;
    const len = filtered.length;
    setFocusedIndex((i) => (i < 0 ? 0 : i >= len ? len - 1 : i));
  }, [filtered.length, showDropdown]);

  const handleKeyDown = (e) => {
    if (!showDropdown || filtered.length === 0) {
      if (e.key === 'Escape') {
        setQuery('');
        setIsOpen(false);
        inputRef.current?.blur();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((i) => (i < filtered.length - 1 ? i + 1 : i));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((i) => (i > 0 ? i - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const city = filtered[focusedIndex];
      if (city) {
        onChange(city);
        setQuery('');
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setQuery('');
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (city) => {
    onChange(city);
    setQuery('');
    setIsOpen(false);
    setFocusedIndex(0);
  };

  const handleChange = () => {
    onChange(null);
    setQuery('');
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  if (isSelected) {
    return (
      <div className="mt-6 max-w-md">
        <div className="bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/30 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white shrink-0" aria-hidden>
            ✓
          </div>
          <span className="flex-1 font-medium text-[var(--text-primary)]">
            {value.city}, {value.country}
          </span>
          <button
            type="button"
            onClick={handleChange}
            className="text-brand-500 text-sm font-medium cursor-pointer hover:underline"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 max-w-md">
      <div className="glass dark:glass-dark rounded-2xl p-4">
        <div className="flex flex-row items-center gap-2">
          <span className="text-lg shrink-0" aria-hidden>🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 150)}
            onKeyDown={handleKeyDown}
            className="bg-transparent text-[var(--text-primary)] text-base w-full outline-none placeholder:text-[var(--text-muted)] focus-visible:ring-2 focus-visible:ring-brand-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] rounded-lg"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={showDropdown && filtered.length > 0}
            aria-controls="city-listbox"
            id="city-autocomplete-input"
          />
        </div>
      </div>

      {!showDropdown && displayChips.length > 0 && (
        <div className="mt-3">
          <span className="text-xs text-[var(--text-muted)] font-medium">Popular:</span>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {displayChips.map((city) => (
              <button
                key={`${city.city}-${city.country}`}
                type="button"
                onClick={() => handleSelect(city)}
                className="border border-[var(--border)] rounded-full px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:border-brand-400 hover:text-brand-400 cursor-pointer transition-colors duration-150"
              >
                {city.city}
              </button>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            id="city-listbox"
            role="listbox"
            aria-labelledby="city-autocomplete-input"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="glass dark:glass-dark rounded-xl mt-2 overflow-hidden max-h-[280px] overflow-y-auto"
          >
            {filtered.length === 0 ? (
              <div className="text-center text-sm text-[var(--text-muted)] py-6">
                No cities found
              </div>
            ) : (
              filtered.map((city, i) => (
                <button
                  key={`${city.city}-${city.country}-${i}`}
                  type="button"
                  role="option"
                  aria-selected={i === focusedIndex}
                  onClick={() => handleSelect(city)}
                  onMouseEnter={() => setFocusedIndex(i)}
                  className={`
                    w-full px-4 py-3 min-h-[44px] flex justify-between items-center cursor-pointer transition-colors text-left
                    hover:bg-[var(--surface-hover)]
                    ${i === focusedIndex ? 'border-l-2 border-brand-500 bg-[var(--surface-hover)]' : ''}
                  `}
                >
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {formatCityLabel(city)}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] shrink-0 ml-2">
                    {formatCountry(city)}
                  </span>
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
