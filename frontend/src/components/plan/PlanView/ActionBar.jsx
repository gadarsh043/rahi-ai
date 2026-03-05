import useTripStore from '../../../stores/tripStore';

export default function ActionBar() {
  const openChat = useTripStore((s) => s.openChat);
  const toggleLetsPick = useTripStore((s) => s.toggleLetsPick);

  return (
    <div
      className="fixed bottom-14 lg:bottom-0 left-0 right-0 z-[50]
                 flex items-center gap-2 px-3 py-2
                 bg-[var(--bg)] border-t border-[var(--border)]
                 pb-[max(8px,env(safe-area-inset-bottom))]
                 lg:static lg:border-t-0 lg:pb-0 lg:px-6 lg:pt-2 lg:pb-4 lg:justify-end"
    >
      <div className="flex w-full lg:w-auto lg:inline-flex items-center gap-2">
        <button
          type="button"
          onClick={openChat}
          data-tour="chat-input"
          className="flex-1 lg:flex-none flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[var(--surface)] text-sm font-medium text-[var(--text-primary)] active:scale-[0.98] transition-transform touch-target"
        >
          💬 <span className="hidden sm:inline">Chat</span>
        </button>
        <button
          type="button"
          onClick={toggleLetsPick}
          data-tour="lets-pick"
          className="flex-1 lg:flex-none flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-brand-500 text-sm font-medium text-white active:scale-[0.98] transition-transform touch-target"
        >
          🎯 <span className="hidden sm:inline">Let&apos;s Pick</span>
        </button>
      </div>
    </div>
  );
}

