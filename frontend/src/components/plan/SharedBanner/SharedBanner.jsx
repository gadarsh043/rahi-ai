import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../../../services/apiClient';
import { toast } from '../../common/Toast/Toast';
import useTripStore from '../../../stores/tripStore';
import useAuthStore from '../../../stores/authStore';
import { trackEvent } from '../../../services/posthog';

export default function SharedBanner({ ownerName }) {
  const trip = useTripStore((s) => s.trip);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [forking, setForking] = useState(false);

  if (!trip) return null;

  const handleSuggest = async () => {
    if (!suggestion.trim()) return;
    setSubmitting(true);
    const result = await apiPost(
      `/plans/${trip.id}/suggest`,
      {
        viewer_name: name || 'Anonymous',
        suggestion_text: suggestion,
      },
      { context: 'suggest' },
    );

    if (!result.error) {
      toast.success('Suggestion sent!');
      trackEvent('suggestion_submitted', { trip_id: trip.id });
      setSuggestion('');
      setName('');
      setShowSuggest(false);
    }
    setSubmitting(false);
  };

  const handleFork = async () => {
    if (!user) {
      toast.info('Sign in to fork this trip');
      return;
    }
    setForking(true);
    const result = await apiPost(
      `/plans/${trip.id}/fork`,
      {},
      { context: 'fork' },
    );
    if (!result.error && result.new_trip_id) {
      trackEvent('trip_forked', {
        original_trip_id: trip.id,
        share_code: trip.shareCode || trip.share_code,
      });
      toast.success('Trip forked! Editing your copy now.');
      navigate(`/plan/${result.new_trip_id}`);
    }
    setForking(false);
  };

  return (
    <div className="bg-brand-500/10 border-b border-brand-500/20 rounded-xl mb-3">
      <div className="px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        <span className="text-sm text-[var(--text-primary)]">
          👤 Shared by <strong>{ownerName || 'a friend'}</strong> · View Only
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSuggest((open) => !open)}
            className="text-xs font-medium text-brand-500 hover:text-brand-600 px-3 py-1.5 rounded-lg border border-brand-500/20 hover:bg-brand-500/10 transition-colors cursor-pointer"
          >
            💡 Suggest
          </button>
          <button
            type="button"
            onClick={handleFork}
            disabled={forking}
            className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer disabled:opacity-60"
          >
            {forking ? '...' : '🔀 Fork Trip'}
          </button>
        </div>
      </div>

      {showSuggest && (
        <div className="px-4 pb-3 pt-1">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-32 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
            />
            <input
              type="text"
              placeholder="Add Perot Museum! or Try Maple Leaf Diner..."
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSuggest()}
              className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
            />
            <button
              type="button"
              onClick={handleSuggest}
              disabled={submitting || !suggestion.trim()}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

