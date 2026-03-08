import { useState } from 'react';
import { apiPost } from '../../../services/apiClient';
import { toast } from '../../common/Toast/Toast';
import useTripStore from '../../../stores/tripStore';

export default function ShareButton() {
  const trip = useTripStore((s) => s.trip);
  const setTrip = useTripStore((s) => s.setTrip);
  const isDemo = useTripStore((s) => s.isDemo);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!trip) return null;

  const shareCode = trip.shareCode || trip.share_code;
  const shareUrl = shareCode
    ? `${window.location.origin}/plan/${trip.id}?shared=${shareCode}`
    : null;

  const handleGenerateCode = async () => {
    if (!trip) return;
    if (isDemo) {
      toast.info('Demo mode: generate a real trip to share it.');
      return;
    }
    setLoading(true);
    const result = await apiPost(
      `/plans/${trip.id}/share`,
      {},
      { context: 'share' },
    );
    if (!result.error) {
      setTrip({ ...trip, shareCode: result.share_code });
      toast.success('Share link created!');
    }
    setLoading(false);
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied!');
    } catch {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      toast.success('Link copied!');
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        data-tour="share-button"
        onClick={() => {
          if (isDemo) {
            toast.info('Demo mode: generate a real trip to share it.');
            return;
          }
          setShowPopup((open) => !open);
        }}
        className="flex items-center gap-1.5 border border-[var(--border)] px-3 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
      >
        🔗 Share
      </button>

      {showPopup && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[var(--z-dropdown)] cursor-default"
            onClick={() => setShowPopup(false)}
          >
            {/* backdrop */}
          </button>

          <div className="absolute right-0 top-full mt-2 w-[min(320px,calc(100vw-2rem))] bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl z-[var(--z-dropdown)] p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
              Share this trip
            </h3>

            {shareCode ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 bg-[var(--bg)] rounded-lg px-3 py-2">
                  <div>
                    <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                      Share code
                    </p>
                    <p className="text-lg font-mono font-semibold text-[var(--text-primary)]">
                      {shareCode}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-brand-500 text-xs font-semibold hover:text-brand-600 shrink-0 cursor-pointer"
                  >
                    Copy link
                  </button>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Share the 6‑character code with friends. They can join from the
                  home page using <span className="font-mono">{shareCode}</span>.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-[var(--text-muted)]">
                  Create a share link so friends can view your trip and suggest
                  changes.
                </p>
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  disabled={loading}
                  className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  {loading ? 'Creating...' : 'Create Share Link'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

