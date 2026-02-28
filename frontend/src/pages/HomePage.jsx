export default function HomePage() {
  return (
    <div className="flex flex-1 min-h-0 min-w-0">
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="text-center max-w-lg">
          <span className="text-5xl block mb-4">🌍</span>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent dark:from-brand-400 dark:to-white">
            Where to next?
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Plan your perfect trip with AI.
          </p>
        </div>
      </div>
    </div>
  );
}
