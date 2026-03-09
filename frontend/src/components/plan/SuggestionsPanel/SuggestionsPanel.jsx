import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../../../services/apiClient';

export default function SuggestionsPanel({ tripId }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (tripId && tripId !== 'demo') {
      loadSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  const loadSuggestions = async () => {
    const data = await apiGet(`/plans/${tripId}/suggestions`, {
      context: 'suggestions',
      silent: true,
    });
    if (!data.error) {
      setSuggestions(data.suggestions || []);
    }
  };

  const handleAction = async (id, status) => {
    await apiPost(
      `/plans/${tripId}/suggestions/${id}/${status}`,
      {},
      { context: 'suggestions' },
    );
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s)),
    );
  };

  const pendingCount = suggestions.filter(
    (s) => s.status === 'pending' || !s.status,
  ).length;

  if (suggestions.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((val) => !val)}
        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
      >
        💡 Suggestions
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {pendingCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[var(--z-dropdown)] cursor-default"
            onClick={() => setOpen(false)}
          >
            {/* backdrop */}
          </button>
          <div className="absolute right-0 top-full mt-2 w-[min(320px,calc(100vw-2rem))] max-h-96 overflow-y-auto bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl z-[var(--z-dropdown)] p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
              Suggestions ({pendingCount} pending)
            </h3>

            <div className="space-y-3">
              {suggestions.map((s) => (
                <div
                  key={s.id}
                  className={`p-3 rounded-lg border ${
                    s.status === 'pending' || !s.status
                      ? 'border-brand-500/20 bg-brand-500/5'
                      : s.status === 'accepted'
                        ? 'border-emerald-500/20 bg-emerald-500/5 opacity-75'
                        : 'border-[var(--border)] opacity-60'
                  }`}
                >
                  <p className="text-xs text-[var(--text-muted)] mb-1">
                    {s.viewer_name || 'Anonymous'}
                  </p>
                  <p className="text-sm text-[var(--text-primary)]">
                    {s.suggestion_text}
                  </p>

                  {(s.status === 'pending' || !s.status) && (
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => handleAction(s.id, 'accepted')}
                        className="text-xs font-medium text-emerald-500 hover:text-emerald-600 cursor-pointer"
                      >
                        ✓ Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(s.id, 'rejected')}
                        className="text-xs font-medium text-[var(--text-muted)] hover:text-red-400 cursor-pointer"
                      >
                        ✕ Dismiss
                      </button>
                    </div>
                  )}
                  {s.status && s.status !== 'pending' && (
                    <span className="text-xs text-[var(--text-muted)] mt-1 block">
                      {s.status === 'accepted' ? '✓ Accepted' : '✕ Dismissed'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

