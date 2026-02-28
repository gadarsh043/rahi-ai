export default function DurationSlider({ value, onChange }) {
  const safeValue = Math.min(30, Math.max(1, value ?? 7));
  const percent = ((safeValue - 1) / 29) * 100;

  const handleChange = (e) => {
    const next = parseInt(e.target.value, 10);
    if (Number.isNaN(next)) return;
    onChange(Math.min(30, Math.max(1, next)));
  };

  const quickPicks = [3, 5, 7, 10, 14, 21, 30];

  return (
    <div className="mt-6 max-w-md">
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-4xl font-extrabold text-[var(--text-primary)]">
          {safeValue}
        </span>
        <span className="text-lg text-[var(--text-muted)]">days</span>
      </div>

      <div className="relative pt-2">
        <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-400 to-brand-600"
            style={{ width: `${percent}%` }}
          />
        </div>
        <input
          type="range"
          min={1}
          max={30}
          value={safeValue}
          onChange={handleChange}
          className="duration-slider absolute inset-0 w-full cursor-pointer"
        />
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {quickPicks.map((d) => {
          const isActive = safeValue === d;
          return (
            <button
              key={d}
              type="button"
              onClick={() => onChange(d)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium border transition-colors ${
                isActive
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-brand-400 hover:text-brand-400'
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

