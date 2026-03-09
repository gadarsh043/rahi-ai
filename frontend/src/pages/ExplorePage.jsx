import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import destinations from '../data/exploreDestinations';

export default function ExplorePage() {
  const navigate = useNavigate();
  const enabledDestinations = useMemo(
    () => destinations.filter((d) => d.enabled),
    [],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 bg-[var(--bg)]">
      <div className="w-full max-w-6xl mx-auto px-4 py-8 sm:py-10 lg:py-12">
        <header className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Explore Destinations
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[var(--text-secondary)] max-w-xl">
            Plan your perfect trip to any of these destinations — free with Rahify. Start with a real place,
            then let AI handle the details.
          </p>
        </header>

        <section>
          <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-[260px] sm:auto-rows-[280px]">
            {enabledDestinations.map((dest, index) => {
              const isTall = index % 3 === 0;
              return (
                <button
                  key={dest.slug}
                  type="button"
                  onClick={() => navigate(`/explore/${dest.slug}`)}
                  className={[
                    'group relative w-full text-left overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]',
                    'shadow-sm hover:shadow-md transition-shadow',
                    isTall ? 'row-span-2 min-h-[320px]' : 'min-h-[260px]',
                  ].join(' ')}
                >
                  <div className="relative h-full w-full">
                    <div
                      className={[
                        'absolute inset-0',
                        'bg-center bg-cover',
                        dest.heroImage ? '' : 'bg-gradient-to-br from-brand-400 to-brand-700',
                      ].join(' ')}
                      style={dest.heroImage ? { backgroundImage: `url(${dest.heroImage})` } : undefined}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-black/10" />

                    <div className="absolute inset-0 transform transition-transform duration-300 group-hover:scale-105" />

                    <div className="relative z-10 h-full flex flex-col justify-between p-5 sm:p-6">
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/55 text-xs font-medium text-white/90">
                          <span className="text-base leading-none">{dest.emoji}</span>
                          <span className="uppercase tracking-wide text-[10px] sm:text-[11px]">
                            {dest.country}
                          </span>
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-extrabold text-white drop-shadow-md">
                            {dest.city}
                          </h2>
                          {dest.subtitle && (
                            <p className="mt-1 text-xs sm:text-sm text-white/80 line-clamp-2">
                              {dest.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        {dest.stats?.budget && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-[11px] font-medium text-white backdrop-blur-sm border border-white/15">
                            Budget • {dest.stats.budget}
                          </span>
                        )}
                        <span className="text-[11px] text-white/75 ml-auto">
                          View guide →
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

