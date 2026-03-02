export default function ErrorFallback({ onRetry }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">😵‍💫</div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          Oops, something broke
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Don&apos;t worry — your trips are safe. This is a temporary glitch.
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
          >
            Try Again
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            window.location.href = '/';
          }}
          className="block mx-auto mt-3 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}

