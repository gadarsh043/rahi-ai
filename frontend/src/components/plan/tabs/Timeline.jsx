export default function Timeline({ itinerary }) {
  if (!Array.isArray(itinerary) || itinerary.length === 0) return null;

  return (
    <div className="mt-4">
      {itinerary.map((day) => (
        <div key={day.dayNumber} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-500">
              Day {day.dayNumber}
            </span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {day.title}
            </span>
          </div>

          <div className="space-y-3 ml-2 border-l-2 border-[var(--border)] pl-4">
            {day.activities.map((activity) => (
              <div key={`${day.dayNumber}-${activity.time}-${activity.title}`} className="relative">
                {/* Time dot */}
                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand-500 border-2 border-[var(--bg)]" />

                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono text-[var(--text-muted)] w-12 flex-shrink-0 pt-0.5">
                    {activity.time}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {activity.title}
                    </p>
                    {activity.detail && (
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {activity.detail}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

