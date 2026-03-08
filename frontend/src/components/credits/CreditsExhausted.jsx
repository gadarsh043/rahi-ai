export default function CreditsExhausted({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg)] rounded-2xl p-8 max-w-md mx-4 text-center shadow-xl border border-[var(--border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
          You&apos;ve used all 5 free trips!
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          We&apos;re still in beta. Email us to get more free credits while we set up
          payments.
        </p>
        <a
          href="mailto:adarsh@rahify.com?subject=Rahify — Request More Credits&body=Hi! I've used my 5 free trips on Rahify and would love more credits.%0A%0AMy email: %0AHow I'm using Rahify: "
          className="block w-full py-3 px-6 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors mb-3"
        >
          📧 Email for More Credits
        </a>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        >
          Close
        </button>
      </div>
    </div>
  );
}

