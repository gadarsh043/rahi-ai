import useTripStore from '../../../stores/tripStore';
import ShareButton from '../ShareButton/ShareButton';
import SuggestionsPanel from '../SuggestionsPanel/SuggestionsPanel';
import { toast } from '../../common/Toast/Toast';
import { savePlan } from '../../../services/api';

export default function PlanHeader() {
  const trip = useTripStore((s) => s.trip);
  const mode = useTripStore((s) => s.mode);
  const setMode = useTripStore((s) => s.setMode);

  if (!trip) return null;

  const handleDownloadPDF = async () => {
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
      a.download = `rahi-${trip.destinationCity}-trip.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded!');
    } catch {
      toast.error("Couldn't generate PDF. Try again.");
    }
  };

  const handleSaveTrip = async () => {
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
    <header className="mb-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">
            {trip.originCity} → {trip.destinationCity}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {trip.numDays} days · {trip.pace} · {trip.budgetVibe}
          </p>
        </div>
        {mode !== 'shared' && (
          <div className="flex items-center gap-2">
            <SuggestionsPanel tripId={trip.id} />
            <ShareButton />
            {mode === 'saved' && (
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs md:text-sm font-semibold px-3 md:px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                📄 Download PDF
              </button>
            )}
            {mode !== 'saved' && (
              <button
                type="button"
                onClick={handleSaveTrip}
                className="flex items-center gap-1.5 border border-[var(--border)] text-xs md:text-sm font-semibold px-3 md:px-4 py-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              >
                💾 Save Trip
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}


