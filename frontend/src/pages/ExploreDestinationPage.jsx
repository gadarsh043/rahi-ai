import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Languages, WalletCards, Plane, FileText, BadgeDollarSign } from 'lucide-react';
import destinations from '../data/exploreDestinations';

function useDestination(slug) {
  return useMemo(
    () => destinations.find((d) => d.slug === slug) || null,
    [slug],
  );
}

export default function ExploreDestinationPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const destination = useDestination(slug);

  useEffect(() => {
    if (!destination || !destination.enabled) {
      // For now, send unknown / disabled destinations back to the gallery.
      navigate('/explore', { replace: true });
    }
  }, [destination, navigate]);

  useEffect(() => {
    if (!destination) return;

    const { title, subtitle, heroImage } = destination;
    const pageTitle = title ? `${title} | Rahify` : `Plan Your Trip to ${destination.city} | Rahify`;
    const description = subtitle
      ? `${subtitle} Plan with AI at rahify.com.`
      : `Plan your trip to ${destination.city} with real places, real flights, and real costs.`;

    document.title = pageTitle;

    const setMeta = (selector, attr, value) => {
      const el = document.querySelector(selector);
      if (el && value) el.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', pageTitle);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:image"]', 'content', heroImage || 'https://rahify.com/og-image.png');
    setMeta('meta[name="twitter:title"]', 'content', pageTitle);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setMeta('meta[name="twitter:image"]', 'content', heroImage || 'https://rahify.com/og-image.png');
  }, [destination]);

  if (!destination || !destination.enabled) {
    return null;
  }

  const { city, country, heroImage, title, subtitle, stats, content } = destination;

  const handlePlanClick = () => {
    const destParam = encodeURIComponent(`${city},${country}`);
    navigate(`/new?dest=${destParam}`);
  };

  const heroHasImage = Boolean(heroImage);

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 bg-[var(--bg)]">
      {/* Hero */}
      <section className="relative w-full h-[260px] sm:h-[320px] md:h-[380px] lg:h-[420px] overflow-hidden">
        <div
          className={[
            'absolute inset-0',
            heroHasImage ? 'bg-center bg-cover' : 'bg-gradient-to-br from-brand-400 to-brand-700',
          ].join(' ')}
          style={heroHasImage ? { backgroundImage: `url(${heroImage})` } : undefined}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-black/10" />

        <div className="relative z-10 h-full max-w-5xl mx-auto px-4 flex flex-col justify-end pb-8 sm:pb-10">
          <p className="text-xs sm:text-sm text-white/80 mb-1 sm:mb-2 uppercase tracking-[0.18em]">
            {country}
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg">
            {city}
          </h1>
          {(title || subtitle) && (
            <p className="mt-2 max-w-2xl text-sm sm:text-base text-white/85">
              {subtitle || title}
            </p>
          )}
        </div>
      </section>

      {/* Quick stats */}
      <section className="bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-4 py-4 sm:py-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 text-[11px] sm:text-xs">
            <StatItem icon={Calendar} label="Best time" value={stats?.bestTime} />
            <StatItem icon={Languages} label="Language" value={stats?.language} />
            <StatItem icon={WalletCards} label="Currency" value={stats?.currency} />
            <StatItem icon={BadgeDollarSign} label="Budget" value={stats?.budget} />
            <StatItem icon={Plane} label="Flight from India" value={stats?.flightFromIndia} />
            <StatItem icon={FileText} label="Visa" value={stats?.visa} />
          </div>
        </div>
      </section>

      {/* Content + Rahify section + CTA */}
      <main className="flex-1">
        <section className="px-4 pt-8 pb-10 sm:pt-10 sm:pb-12">
          <div className="max-w-3xl mx-auto">
            {content?.map((paragraph) => (
              <p
                key={paragraph.slice(0, 40)}
                className="mb-4 text-sm sm:text-base leading-relaxed text-[var(--text-secondary)]"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        <section className="px-4 pb-10 sm:pb-12">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-4 sm:mb-5">
              What you get with Rahify
            </h2>
            <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
              <FeatureCard title="Day-by-day itinerary">
                Clean timeline view that shows where you&apos;re going, when, and how long each stop takes.
              </FeatureCard>
              <FeatureCard title="Real restaurant picks">
                Places pulled from Google Places with photos, ratings, and price levels — not invented spots.
              </FeatureCard>
              <FeatureCard title="Hotels that fit your budget">
                Stay options that match your vibe and price range, with links out to real booking sites.
              </FeatureCard>
              <FeatureCard title="Flight search built in">
                Smart flight search via SerpAPI with price comparison and deep links to Skyscanner and Google Flights.
              </FeatureCard>
              <FeatureCard title="Cost breakdown in your currency">
                A clear estimate of how much your trip will cost — per day, per person, in 150+ currencies.
              </FeatureCard>
              <FeatureCard title="Downloadable trip PDF">
                Your full plan as a polished PDF: itinerary, costs, essentials, packing, and local tips.
              </FeatureCard>
            </div>
          </div>
        </section>

        <section className="px-4 pb-10 sm:pb-14">
          <div className="max-w-3xl mx-auto text-center">
            <button
              type="button"
              onClick={handlePlanClick}
              className="inline-flex items-center justify-center px-8 py-3 sm:px-10 sm:py-3.5 rounded-2xl text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-brand-400 to-brand-600 shadow-brand hover:from-brand-500 hover:to-brand-700 active:scale-[0.97] transition-transform transition-colors"
            >
              Plan your {city} trip — it&apos;s free →
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-5xl mx-auto px-4 py-4 text-center text-[11px] sm:text-xs text-[var(--text-muted)]">
          Made with ❤️ by Rahify&nbsp;&nbsp;|&nbsp;&nbsp;
          <a href="https://rahify.com" className="underline-offset-2 hover:underline">
            rahify.com
          </a>
        </div>
      </footer>
    </div>
  );
}

function StatItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-[var(--surface-hover)]/60 border border-[var(--border)] px-3 py-2">
      <div className="mt-0.5">
        <Icon className="w-3.5 h-3.5 text-brand-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
          {label}
        </div>
        <div className="text-[11px] sm:text-xs font-medium text-[var(--text-primary)] truncate">
          {value || '—'}
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, children }) {
  return (
    <div className="h-full rounded-2xl bg-[var(--surface)] border border-[var(--border)] px-4 py-4 sm:px-5 sm:py-5 flex flex-col">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1.5">
        {title}
      </h3>
      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
        {children}
      </p>
    </div>
  );
}

