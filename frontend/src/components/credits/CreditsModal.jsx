import { useEffect } from 'react';

export default function CreditsModal({ open, onClose, tripsRemaining }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-black/40"
        onClick={onClose}
        aria-label="Close credits modal"
      >
        {/* scrim */}
      </button>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Credits
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Trips remaining: <span className="font-semibold">{tripsRemaining ?? '—'}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="px-5 py-5">
            <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Buying credits is coming soon
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                For MVP, you can keep planning with your remaining trips. Payments + packages
                will land next.
              </p>
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

