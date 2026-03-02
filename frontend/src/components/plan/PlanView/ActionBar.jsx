import useTripStore from '../../../stores/tripStore';

export default function ActionBar() {
  const openChat = useTripStore((s) => s.openChat);
  const toggleLetsPick = useTripStore((s) => s.toggleLetsPick);

  return (
    <div className="px-6 pb-4 pt-2 flex justify-end pointer-events-none">
      <div className="inline-flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-3 py-2 shadow-sm pointer-events-auto">
        <button
          type="button"
          onClick={openChat}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[var(--surface-hover)] transition-colors"
        >
          <span className="text-[var(--text-muted)]">✨</span>
          <span className="text-sm text-[var(--text-muted)]">
            Chat with Rahi
          </span>
        </button>
        <span className="w-px h-5 bg-[var(--border)]" />
        <button
          type="button"
          onClick={toggleLetsPick}
          className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap active:scale-[0.97]"
        >
          Let&apos;s Pick
        </button>
      </div>
    </div>
  );
}

