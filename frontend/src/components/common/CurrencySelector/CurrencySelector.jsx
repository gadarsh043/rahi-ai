import { useEffect, useMemo, useRef, useState } from 'react';

export const COMMON_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
];

export const ALL_CURRENCIES = [
  ...COMMON_CURRENCIES,
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Złoty' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
];

function getCurrencyData(code) {
  return (
    ALL_CURRENCIES.find((c) => c.code === code) || {
      code: code || 'USD',
      symbol: '$',
      name: 'US Dollar',
    }
  );
}

export default function CurrencySelector({ value, onChange, compact = false }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  const current = useMemo(() => getCurrencyData(value || 'USD'), [value]);

  const matchesSearch = (c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  };

  const filtered = useMemo(
    () =>
      ALL_CURRENCIES.filter(matchesSearch).sort((a, b) =>
        a.code.localeCompare(b.code),
      ),
    [search],
  );

  const pinned = useMemo(
    () => COMMON_CURRENCIES.filter(matchesSearch),
    [search],
  );

  const rest = useMemo(
    () =>
      filtered.filter(
        (c) => !COMMON_CURRENCIES.find((p) => p.code === c.code),
      ),
    [filtered],
  );

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const handleSelect = (code) => {
    if (onChange) onChange(code);
    setOpen(false);
    setSearch('');
  };

  const triggerLabel = compact
    ? `💱 ${current.code}`
    : `${current.code} ${current.symbol}`;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs md:text-sm font-medium px-3 py-1.5 md:py-2 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer ${
          compact ? '' : 'min-w-[110px] justify-between'
        }`}
      >
        <span className="truncate">{triggerLabel}</span>
        <span className="text-[10px] text-[var(--text-muted)]">▾</span>
      </button>

      {/* Desktop dropdown */}
      {open && (
        <div className="hidden md:block absolute right-0 mt-2 w-[min(256px,calc(100vw-2rem))] bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl z-[var(--z-dropdown)]">
          <div className="p-3 border-b border-[var(--border)]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search currency..."
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-brand-500/50"
            />
          </div>
          <div className="max-h-72 overflow-y-auto py-2">
            {pinned.length > 0 && (
              <div className="pb-2 border-b border-[var(--border)]">
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Common
                </p>
                {pinned.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelect(c.code)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left text-xs hover:bg-[var(--surface-hover)] cursor-pointer"
                  >
                    <span className="flex flex-col">
                      <span className="font-medium text-[var(--text-primary)]">
                        {c.code} {c.symbol}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {c.name}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            {rest.length > 0 && (
              <div className="pt-1">
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  All
                </p>
                {rest.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelect(c.code)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left text-xs hover:bg-[var(--surface-hover)] cursor-pointer"
                  >
                    <span className="flex flex-col">
                      <span className="font-medium text-[var(--text-primary)]">
                        {c.code} {c.symbol}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {c.name}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            {pinned.length === 0 && rest.length === 0 && (
              <p className="px-3 py-4 text-[11px] text-[var(--text-muted)]">
                No currencies match your search.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Mobile bottom sheet */}
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[var(--z-overlay-backdrop)] bg-black/40 md:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close currency selector"
          >
            {/* scrim */}
          </button>
          <div className="fixed inset-x-0 bottom-0 z-[var(--z-overlay)] md:hidden">
            <div className="mx-auto w-full max-w-md rounded-t-2xl bg-[var(--surface)] border-t border-[var(--border)] shadow-xl">
              <div className="pt-3 pb-2 flex flex-col items-center">
                <div className="w-10 h-1 rounded-full bg-[var(--border)] mb-2" />
                <p className="text-xs font-semibold text-[var(--text-muted)]">
                  Choose currency
                </p>
              </div>
              <div className="px-4 pb-3">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search currency..."
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-brand-500/50"
                />
              </div>
              <div className="max-h-72 overflow-y-auto pb-3">
                {pinned.length > 0 && (
                  <div className="pb-1 border-b border-[var(--border)]">
                    <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Common
                    </p>
                    {pinned.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleSelect(c.code)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-left text-xs hover:bg-[var(--surface-hover)] cursor-pointer"
                      >
                        <span className="flex flex-col">
                          <span className="font-medium text-[var(--text-primary)]">
                            {c.code} {c.symbol}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {c.name}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {rest.length > 0 && (
                  <div className="pt-1">
                    <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      All
                    </p>
                    {rest.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleSelect(c.code)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-left text-xs hover:bg-[var(--surface-hover)] cursor-pointer"
                      >
                        <span className="flex flex-col">
                          <span className="font-medium text-[var(--text-primary)]">
                            {c.code} {c.symbol}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {c.name}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {pinned.length === 0 && rest.length === 0 && (
                  <p className="px-4 py-4 text-[11px] text-[var(--text-muted)]">
                    No currencies match your search.
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

