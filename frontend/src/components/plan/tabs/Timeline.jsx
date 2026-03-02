export default function Timeline({ itinerary }) {
  if (!Array.isArray(itinerary) || itinerary.length === 0) return null;

  return (
    <div className="mt-4">
      {itinerary.map((day, dayIndex) => {
        const dayNumber = day.dayNumber ?? day.day_number ?? dayIndex + 1;
        const dayTitle = day.title ?? day.day_title ?? '';
        const activities = Array.isArray(day.activities) ? day.activities : [];
        return (
        <div key={`day-${dayNumber}-${dayTitle || dayIndex}`} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-500">
              Day {dayNumber}
            </span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {dayTitle}
            </span>
          </div>

          <div className="space-y-3 ml-2 border-l-2 border-[var(--border)] pl-4">
            {activities.map((activity, actIndex) => (
              <div
                key={`act-${dayNumber}-${activity.time || 't'}-${activity.title || 'a'}-${actIndex}`}
                className="relative"
              >
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
      );})}
    </div>
  );
}

