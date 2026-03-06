const GROUPS = [
  { id: 'solo', label: 'Solo', icon: '🧑', desc: 'Just me, exploring' },
  { id: 'couple', label: 'Couple', icon: '💑', desc: 'Romantic getaway' },
  { id: 'friends', label: 'Friends', icon: '👯', desc: 'Squad trip' },
  { id: 'family', label: 'Family', icon: '👨‍👩‍👧', desc: 'With the fam' },
  { id: 'work', label: 'Work Trip', icon: '💼', desc: 'Business + fun' },
];

export default function TravelGroupSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
      {GROUPS.map((g) => {
        const active = value === g.id;
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => onChange(g.id)}
            className={`flex flex-col items-center gap-1.5 py-4 px-3 rounded-2xl border-2 transition-all cursor-pointer ${
              active
                ? 'border-brand-500 bg-brand-500/8 shadow-sm'
                : 'border-[var(--border)] bg-[var(--surface)] hover:border-brand-300'
            }`}
          >
            <span className="text-2xl">{g.icon}</span>
            <span className={`text-sm font-semibold ${active ? 'text-brand-600 dark:text-brand-400' : 'text-[var(--text-primary)]'}`}>
              {g.label}
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">{g.desc}</span>
          </button>
        );
      })}
    </div>
  );
}
