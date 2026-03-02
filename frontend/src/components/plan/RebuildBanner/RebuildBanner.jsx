import { useState } from 'react';
import useTripStore from '../../../stores/tripStore';

export default function RebuildBanner() {
  const pendingChanges = useTripStore((s) => s.pendingChanges);
  const trip = useTripStore((s) => s.trip);
  const setTrip = useTripStore((s) => s.setTrip);
  const clearPendingChanges = useTripStore((s) => s.clearPendingChanges);
  const [rebuilding, setRebuilding] = useState(false);

  if (!pendingChanges || pendingChanges.length === 0 || !trip) return null;

  const handleRebuild = async () => {
    setRebuilding(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/v1';
      const resp = await fetch(`${API_URL}/plans/${trip.id}/rebuild`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('supabase_token') || ''}`,
        },
      });
      const data = await resp.json();
      if (data.itinerary) {
        setTrip({
          ...trip,
          itinerary: data.itinerary?.itinerary || data.itinerary,
          narrative: data.itinerary?.narrative ?? trip.narrative,
        });
      }
      clearPendingChanges();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Rebuild failed:', err);
    } finally {
      setRebuilding(false);
    }
  };

  return (
    <div className="sticky top-12 z-30 mx-4 mt-2 mb-2">
      <div className="flex items-center justify-between gap-3 bg-brand-500/10 border border-brand-500/20 rounded-xl px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg shrink-0">✨</span>
          <div className="min-w-0">
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {pendingChanges.length} change{pendingChanges.length > 1 ? 's' : ''}{' '}
              pending
            </span>
            <span className="text-xs text-[var(--text-muted)] ml-1.5 hidden sm:inline">
              — tap rebuild to update your itinerary
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={clearPendingChanges}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] px-2 py-1.5 rounded-lg transition-colors"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={handleRebuild}
            disabled={rebuilding}
            className="text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
          >
            {rebuilding ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Rebuilding...
              </>
            ) : (
              <>🔄 Rebuild Itinerary</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

