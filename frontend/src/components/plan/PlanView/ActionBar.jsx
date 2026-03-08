import { useState } from 'react';
import useTripStore from '../../../stores/tripStore';
import { apiPost } from '../../../services/apiClient';
import { toast } from '../../common/Toast/Toast';

export default function ActionBar({ isDemo = false }) {
  const openChat = useTripStore((s) => s.openChat);
  const toggleLetsPick = useTripStore((s) => s.toggleLetsPick);
  const pendingChanges = useTripStore((s) => s.pendingChanges);
  const trip = useTripStore((s) => s.trip);
  const setTrip = useTripStore((s) => s.setTrip);
  const clearPendingChanges = useTripStore((s) => s.clearPendingChanges);

  const [rebuilding, setRebuilding] = useState(false);
  const hasPending = pendingChanges && pendingChanges.length > 0;

  const handleRebuild = async () => {
    if (!trip) return;
    setRebuilding(true);
    try {
      const data = await apiPost(
        `/plans/${trip.id}/rebuild`,
        {},
        { context: 'rebuild' },
      );
      if (data?.error) return;
      if (data.itinerary) {
        setTrip({
          ...trip,
          itinerary: data.itinerary?.itinerary || data.itinerary,
          narrative: data.itinerary?.narrative ?? trip.narrative,
        });
      }
      clearPendingChanges();
      toast.success('Itinerary rebuilt!');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Rebuild failed:', err);
      toast.error('Rebuild failed. Try again.');
    } finally {
      setRebuilding(false);
    }
  };

  return (
    <div
      className={`fixed bottom-14 lg:bottom-0 left-0 right-0
                 flex items-center gap-2 px-3 py-2
                 bg-[var(--bg)] border-t border-[var(--border)]
                 pb-[max(8px,env(safe-area-inset-bottom))]
                 lg:static lg:border-t-0 lg:pb-0 lg:px-6 lg:pt-2 lg:pb-4 lg:justify-end
                 ${isDemo ? 'z-auto' : 'z-[var(--z-sticky)]'}`}
    >
      <div className="flex w-full lg:w-auto lg:inline-flex items-center gap-2">
        <button
          type="button"
          onClick={openChat}
          data-tour="chat-input"
          aria-label="Open chat"
          className="flex-1 lg:flex-none flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[var(--surface)] text-sm font-medium text-[var(--text-primary)] active:scale-[0.98] transition-transform touch-target"
        >
          💬 <span className="hidden sm:inline">Chat</span>
        </button>

        {hasPending ? (
          <button
            type="button"
            onClick={handleRebuild}
            disabled={rebuilding}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-500 text-sm font-semibold text-white active:scale-[0.98] transition-transform touch-target disabled:opacity-60"
          >
            {rebuilding ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Rebuilding…</span>
              </>
            ) : (
              <>
                🔄 Rebuild Itinerary
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-white/20">
                  {pendingChanges.length}
                </span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={toggleLetsPick}
            data-tour="lets-pick"
            aria-label="Open place picker"
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-brand-500 text-sm font-medium text-white active:scale-[0.98] transition-transform touch-target"
          >
            🎯 <span className="hidden sm:inline">Let&apos;s Pick</span>
          </button>
        )}
      </div>
    </div>
  );
}
