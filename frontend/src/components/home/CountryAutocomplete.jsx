import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COMMON_COUNTRIES, filterCountries } from '../../utils/countries';

export default function CountryAutocomplete({ placeholder, value, onChange }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRef = useRef(null);

  const isSelected = value != null && typeof value === 'object' && value.name;

  const { common: commonList, all: allList } = filterCountries(query);
  const flatList = [...commonList, ...allList];
  const showDropdown = !isSelected && query.trim().length > 0;
  const hasResults = flatList.length > 0;

  useEffect(() => {
    setFocusedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!showDropdown) return;
    const len = flatList.length;
    setFocusedIndex((i) => (i < 0 ? 0 : i >= len ? len - 1 : i));
  }, [flatList.length, showDropdown]);

  const handleKeyDown = (e) => {
    if (!showDropdown || flatList.length === 0) {
      if (e.key === 'Escape') {
        setQuery('');
        setIsOpen(false);
        inputRef.current?.blur();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((i) => (i < flatList.length - 1 ? i + 1 : i));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((i) => (i > 0 ? i - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const country = flatList[focusedIndex];
      if (country) {
        onChange(country);
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

  const handleSelect = (country) => {
    onChange(country);
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
            {value.flag} {value.name} ✓
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

  let flatIndex = 0;
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
            aria-expanded={showDropdown && hasResults}
            aria-controls="country-listbox"
            id="country-autocomplete-input"
          />
        </div>
      </div>

      {!showDropdown && (
        <div className="mt-3">
          <span className="text-xs text-[var(--text-muted)] font-medium">Common:</span>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {COMMON_COUNTRIES.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => handleSelect(country)}
                className="border border-[var(--border)] rounded-full px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:border-brand-400 hover:text-brand-400 cursor-pointer transition-colors duration-150"
              >
                {country.flag} {country.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            id="country-listbox"
            role="listbox"
            aria-labelledby="country-autocomplete-input"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="glass dark:glass-dark rounded-xl mt-2 overflow-hidden max-h-[280px] overflow-y-auto relative z-50"
          >
            {!hasResults ? (
              <div className="text-center text-sm text-[var(--text-muted)] py-6">
                No countries found
              </div>
            ) : (
              <>
                {commonList.length > 0 && (
                  <>
                    <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold px-4 py-2 sticky top-0 bg-[var(--surface)] dark:bg-[var(--surface)]">
                      Common
                    </div>
                    {commonList.map((country) => {
                      const i = flatIndex++;
                      const isFocused = i === focusedIndex;
                      return (
                        <button
                          key={country.code}
                          type="button"
                          role="option"
                          aria-selected={isFocused}
                          onClick={() => handleSelect(country)}
                          onMouseEnter={() => setFocusedIndex(i)}
                          className={`w-full px-4 py-3 min-h-[44px] flex items-center gap-2 cursor-pointer transition-colors text-left hover:bg-[var(--surface-hover)] ${isFocused ? 'border-l-2 border-brand-500 bg-[var(--surface-hover)]' : ''}`}
                        >
                          <span className="text-lg">{country.flag}</span>
                          <span className="text-sm font-medium text-[var(--text-primary)]">{country.name}</span>
                        </button>
                      );
                    })}
                  </>
                )}
                {allList.length > 0 && (
                  <>
                    <div className="border-t border-[var(--border)] my-1" />
                    <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold px-4 py-2 sticky top-0 bg-[var(--surface)] dark:bg-[var(--surface)]">
                      All Countries
                    </div>
                    {allList.map((country) => {
                      const i = flatIndex++;
                      const isFocused = i === focusedIndex;
                      return (
                        <button
                          key={country.code}
                          type="button"
                          role="option"
                          aria-selected={isFocused}
                          onClick={() => handleSelect(country)}
                          onMouseEnter={() => setFocusedIndex(i)}
                          className={`w-full px-4 py-3 min-h-[44px] flex items-center gap-2 cursor-pointer transition-colors text-left hover:bg-[var(--surface-hover)] ${isFocused ? 'border-l-2 border-brand-500 bg-[var(--surface-hover)]' : ''}`}
                        >
                          <span className="text-lg">{country.flag}</span>
                          <span className="text-sm font-medium text-[var(--text-primary)]">{country.name}</span>
                        </button>
                      );
                    })}
                  </>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
