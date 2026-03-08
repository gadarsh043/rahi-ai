import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useTripStore from '../../../stores/tripStore';
import ShareButton from '../ShareButton/ShareButton';
import SuggestionsPanel from '../SuggestionsPanel/SuggestionsPanel';
import { toast } from '../../common/Toast/Toast';
import { savePlan } from '../../../services/api';
import { trackEvent } from '../../../services/posthog';

export default function PlanHeader({ isDemo: isDemoProp = false }) {
  const trip = useTripStore((s) => s.trip);
  const mode = useTripStore((s) => s.mode);
  const setMode = useTripStore((s) => s.setMode);
  const isDemo = useTripStore((s) => s.isDemo);
  const navigate = useNavigate();
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  if (!trip) return null;

  const handleDownloadPDF = async () => {
    if (downloadingPDF) return;
    setDownloadingPDF(true);
    trackEvent('pdf_downloaded', {
      trip_id: trip.id,
      mode,
    });
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || 'http://localhost:8000/v1';
      const token = localStorage.getItem('supabase_token') || '';
      const resp = await fetch(`${API_URL}/plans/${trip.id}/pdf`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      if (!resp.ok) {
        toast.error("Couldn't generate PDF. Try again.");
        return;
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rahify-${trip.destinationCity}-trip.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded!');
    } catch {
      toast.error("Couldn't generate PDF. Try again.");
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleSaveTrip = async () => {
    if (isDemo) {
      toast.info('Demo mode: generate a real trip to save it.');
      return;
    }
    try {
      const result = await savePlan(trip.id);
      if (result?.error) {
        return;
      }
      toast.success('Trip saved to your library!');
      setMode('saved');
    } catch {
      toast.error("Couldn't save your trip. Please try again.");
    }
  };

  return (
    <header className={`relative border-b border-[var(--border)] bg-[var(--bg)] lg:border-b-0 lg:bg-transparent mb-0 lg:mb-3 ${isDemoProp ? 'z-auto' : 'z-[calc(var(--z-sticky)+10)]'}`}>
      <div className="flex items-center justify-between gap-3 px-0 py-2 lg:px-0 lg:py-0">
        {/* Left: back + title */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="lg:hidden text-[var(--text-muted)] text-base px-1"
            aria-label="Go back"
          >
            ←
          </button>
          <div className="min-w-0">
            <h1 className="text-sm lg:text-2xl font-bold lg:font-extrabold text-[var(--text-primary)] truncate">
              {trip.originCity} → {trip.destinationCity}
              <span className="text-[var(--text-muted)] font-normal ml-1">
                {trip.numDays}D
              </span>
            </h1>
            <p className="hidden lg:block text-sm text-[var(--text-secondary)] mt-1">
              {trip.numDays} days · {trip.pace} · {trip.budgetVibe}
            </p>
          </div>
        </div>

        {/* Right: currency + actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {mode !== 'shared' && (
            <div className="flex items-center gap-1.5">
              {!isDemo && (
                <div className="hidden md:block">
                  <SuggestionsPanel tripId={trip.id} />
                </div>
              )}
              <ShareButton />
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={downloadingPDF}
                className="flex items-center gap-1.5 border border-[var(--border)] text-xs md:text-sm font-medium px-2.5 md:px-3 py-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer disabled:opacity-50"
              >
                {downloadingPDF ? (
                  <div className="w-3.5 h-3.5 border-2 border-[var(--text-muted)] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="text-sm">PDF</span>
                )}
              </button>
              {mode !== 'saved' && (
                <button
                  type="button"
                  onClick={handleSaveTrip}
                  data-tour="save-button"
                  className="hidden md:flex items-center gap-1.5 border border-[var(--border)] text-sm font-medium px-3 py-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                >
                  Save
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


