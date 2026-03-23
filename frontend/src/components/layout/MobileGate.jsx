export default function MobileGate() {
  return (
    <div className="min-h-screen bg-[#FFFDF9] flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-extrabold tracking-tight text-brand-500 mb-6">
        Rahify.
      </h1>
      <p className="text-lg font-medium text-[var(--text-primary)] mb-2">
        We're optimizing for mobile, use desktop for now.
      </p>
      <p className="text-sm text-[var(--text-secondary)] mb-8 max-w-sm">
        Rahify works best on desktop right now. Mobile experience coming soon!
      </p>
      <a
        href="https://rahify.com"
        className="text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors"
      >
        Go to rahify.com
      </a>
    </div>
  );
}
