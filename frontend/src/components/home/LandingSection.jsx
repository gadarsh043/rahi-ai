import { motion } from 'framer-motion';
import { MiniTripPreview, FEATURES, HOW_IT_WORKS, fadeUp } from './FeatureMockups';

const DESTINATIONS = [
  { city: 'Tokyo', flag: '\u{1F1EF}\u{1F1F5}' },
  { city: 'Paris', flag: '\u{1F1EB}\u{1F1F7}' },
  { city: 'Bali', flag: '\u{1F1EE}\u{1F1E9}' },
  { city: 'New York', flag: '\u{1F1FA}\u{1F1F8}' },
  { city: 'Barcelona', flag: '\u{1F1EA}\u{1F1F8}' },
  { city: 'Dubai', flag: '\u{1F1E6}\u{1F1EA}' },
  { city: 'London', flag: '\u{1F1EC}\u{1F1E7}' },
  { city: 'Rome', flag: '\u{1F1EE}\u{1F1F9}' },
  { city: 'Maldives', flag: '\u{1F1F2}\u{1F1FB}' },
  { city: 'Seoul', flag: '\u{1F1F0}\u{1F1F7}' },
  { city: 'Bangkok', flag: '\u{1F1F9}\u{1F1ED}' },
  { city: 'Cape Town', flag: '\u{1F1FF}\u{1F1E6}' },
];

function BentoFeatures() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[
        { slice: [0, 2], wideIdx: 0 },
        { slice: [2, 4], wideIdx: 1 },
        { slice: [4, 6], wideIdx: 0 },
      ].map(({ slice, wideIdx }, rowIdx) =>
        FEATURES.slice(...slice).map((f, i) => (
          <motion.div
            key={f.title}
            className={`${i === wideIdx ? 'md:col-span-2' : ''} bg-white dark:bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 md:p-8 hover:shadow-md transition-shadow`}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-30px' }}
            custom={rowIdx * 2 + i}
            variants={fadeUp}
          >
            {i === wideIdx ? (
              <div className="flex flex-col md:flex-row gap-5">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{f.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
                </div>
                <div className="md:w-56 shrink-0"><f.Mockup /></div>
              </div>
            ) : (
              <>
                <h3 className="font-bold text-[var(--text-primary)] mb-1.5">{f.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">{f.desc}</p>
                <f.Mockup />
              </>
            )}
          </motion.div>
        ))
      )}
    </div>
  );
}

export default function LandingSection({ onStart }) {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" aria-hidden style={{ opacity: 0.35 }}>
          <img src="/home-page.png" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute inset-0 bg-gradient-to-b from-[#FDF8F4]/85 via-[#FDF8F4]/50 to-transparent" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-56 md:pt-24 md:pb-72">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
            <motion.div
              className="flex-1 text-center lg:text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-500 mb-4">AI travel planner</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[var(--text-primary)] leading-[1.1] tracking-tight">
                Your next trip,<br />planned with <span className="text-brand-500">real places</span>
              </h1>
              <p className="mt-5 text-base md:text-lg text-gray-700 max-w-xl leading-relaxed font-medium mx-auto lg:mx-0">
                Tell us where you're going. We fetch verified restaurants, hotels, and attractions —
                then build a day-by-day itinerary you can customize with AI chat.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4">
                <button type="button" onClick={onStart} className="bg-brand-500 hover:bg-brand-600 text-white rounded-xl px-8 py-3.5 text-base font-semibold shadow-[0_4px_20px_-2px_rgba(249,115,22,0.5)] hover:-translate-y-0.5 active:scale-[0.97] transition-all cursor-pointer">
                  Plan My Trip
                </button>
                <span className="text-sm text-[var(--text-muted)]">Free &middot; No sign up to start</span>
              </div>
            </motion.div>
            <motion.div className="shrink-0 relative" initial={{ opacity: 0, y: 20, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: -2 }} transition={{ duration: 0.7, delay: 0.3 }}>
              <div className="absolute -inset-10 bg-brand-500/[0.05] rounded-full blur-3xl pointer-events-none" />
              <MiniTripPreview />
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works — overlapping */}
      <section className="relative z-20 px-4 mb-20">
        <motion.div className="max-w-5xl mx-auto bg-white/95 dark:bg-[var(--surface)]/95 backdrop-blur-sm rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] p-8 md:p-12 -mt-40" initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={fadeUp}>
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] text-center mb-12">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div key={item.step} className="text-center" custom={i} variants={fadeUp}>
                <div className="w-10 h-10 rounded-full bg-brand-500 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4 shadow-md">{item.step}</div>
                <h3 className="font-bold text-[var(--text-primary)] mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features — bento */}
      <section className="px-4 py-16 md:py-20">
        <div className="max-w-5xl mx-auto">
          <motion.h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] text-center mb-14" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            Everything you need in one plan
          </motion.h2>
          <BentoFeatures />
        </div>
      </section>

      {/* CTA — destination carousel */}
      <section className="px-4 py-16 md:py-20">
        <motion.div
          className="max-w-3xl mx-auto bg-white dark:bg-[var(--surface)] rounded-3xl p-10 md:p-14 text-center shadow-lg border border-[var(--border)]"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] mb-3">
            Where do you want to go?
          </h2>
          <p className="text-[var(--text-secondary)] mb-6 font-medium">
            Hundreds of destinations. Real places. Your itinerary in minutes.
          </p>

          {/* Infinite carousel */}
          <div className="overflow-hidden -mx-10 md:-mx-14 mb-8">
            <div className="flex gap-2.5 animate-[marquee_30s_linear_infinite] w-max hover:[animation-play-state:paused]">
              {[...DESTINATIONS, ...DESTINATIONS].map((d, i) => (
                <div
                  key={`${d.city}-${i}`}
                  className="shrink-0 flex items-center gap-2 border border-[var(--border)] rounded-full px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg)]"
                >
                  <span>{d.flag}</span>
                  <span className="whitespace-nowrap">{d.city}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onStart}
            className="bg-brand-500 hover:bg-brand-600 text-white rounded-xl px-8 py-3 font-semibold active:scale-[0.97] transition-all cursor-pointer"
          >
            Plan My Trip
          </button>
          <p className="mt-4 text-xs text-[var(--text-muted)]">5 free trips &middot; No credit card required</p>
        </motion.div>
      </section>

      <footer className="py-8 text-center text-[var(--text-muted)] text-sm">
        <p>&copy; {new Date().getFullYear()} Rahify. All rights reserved.</p>
      </footer>
    </div>
  );
}
