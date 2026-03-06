import { motion } from 'framer-motion';

const FEATURES = [
  {
    icon: '🗺️',
    title: 'Real Places, Zero Guessing',
    desc: 'Map places with zero guessing with real places and attractions vetted by data.',
  },
  {
    icon: '💬',
    title: 'Chat to Customize',
    desc: 'Chat with AI to swap hotels, attractions and refine details instantly.',
  },
  {
    icon: '✈️',
    title: 'Flights & Costs Included',
    desc: 'Flights & costs included, wrap your plane and budget plans together.',
  },
  {
    icon: '📍',
    title: 'Interactive Map',
    desc: 'Interactive map to visualize your current travel route seamlessly.',
  },
  {
    icon: '🔗',
    title: 'Share & Collaborate',
    desc: 'Share and collaborate with your travel companions in real-time.',
  },
  {
    icon: '📄',
    title: 'PDF Trip Guide',
    desc: 'Download a PDF trip guide for your tickets and expert offline access.',
  },
];

const HOW_IT_WORKS = [
  { step: '1', title: 'Tell us your trip', desc: 'Answer 10 quick questions in your travel survey to outline your style and trip needs.' },
  { step: '2', title: 'We build it', desc: 'Real places are fetched to fill a personalized day-by-day itinerary just for you.' },
  { step: '3', title: 'Make it yours', desc: 'Chat, swap places, and save up in your trip a personalized itinerary you can customize.' },
  { step: '4', title: 'Go explore', desc: 'Save your trip, download the PDF, and share with travel buddies.' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
};

export default function LandingSection({ onStart }) {
  return (
    <div className="w-full">
      {/* Hero — full-bleed background image */}
      <section className="relative overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center rdp-disabled-opacity"
          aria-hidden style={{ opacity: 0.4 }}
        >
          <img
            src="/home-page.png"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        {/* Gradient overlay for readability */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#FDF8F4]/80 via-[#FDF8F4]/40 to-transparent" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-56 md:pt-24 md:pb-72 lg:pb-80">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[var(--text-primary)] leading-[1.1] tracking-tight">
              Plan trips with{' '}
              <span className="text-brand-500 border-b-[4px] border-brand-500">
                real places
              </span>
              ,
              <br />
              not guesswork
            </h1>
            <p className="mt-5 text-base md:text-lg text-gray-700 max-w-xl leading-relaxed font-medium">
              Tell us where you want to go. We fetch real restaurants, hotels, and
              attractions — then AI builds a personalized day-by-day itinerary you
              can chat with, customize, and share.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-start gap-4">
              <button
                type="button"
                onClick={onStart}
                className="bg-brand-500 hover:bg-brand-600 text-white rounded-xl px-8 py-3.5 text-base font-semibold shadow-[0_4px_20px_-2px_rgba(249,115,22,0.5)] hover:-translate-y-0.5 active:scale-[0.97] transition-all cursor-pointer"
              >
                Plan My Trip
              </button>
              <a
                href="#how-it-works"
                className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] hover:text-brand-500 transition-colors py-3"
              >
                See how it works
                <span className="text-xs">↓</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works — glass card overlapping hero */}
      <section id="how-it-works" className="relative z-20 px-4 mb-20">
        <motion.div
          className="max-w-5xl mx-auto bg-white/95 dark:bg-[var(--surface)]/95 backdrop-blur-sm rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] p-8 md:p-12 -mt-40"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeUp}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] text-center mb-12">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div
                key={item.step}
                className="text-center"
                custom={i}
                variants={fadeUp}
              >
                <div className="w-10 h-10 rounded-full bg-brand-500 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4 shadow-md">
                  {item.step}
                </div>
                <h3 className="font-bold text-[var(--text-primary)] mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 md:py-20">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={fadeUp}
          >
            Features
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                className="bg-white dark:bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-7 hover:shadow-md transition-shadow"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-30px' }}
                custom={i}
                variants={fadeUp}
              >
                <span className="text-2xl mb-4 block">{f.icon}</span>
                <h3 className="font-bold text-[var(--text-primary)] mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Free to start */}
      <section className="px-4 py-20 text-center">
        <motion.div
          className="max-w-3xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeUp}
        >
          <span className="text-3xl mb-4 block">💳</span>
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-4">
            Free to start
          </h2>
          <p className="text-[var(--text-secondary)] max-w-lg mx-auto leading-relaxed mb-6">
            Every account gets 5 free trips — full itineraries with real places,
            flights, costs, and PDF export. No credit card required.
          </p>
          <div className="inline-block bg-white dark:bg-[var(--surface)] border border-[var(--border)] rounded-full px-6 py-2.5 text-sm text-[var(--text-secondary)] shadow-sm">
            Need more? Email us for additional credits — no paywall, just ask.
          </div>
        </motion.div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-16 md:py-20">
        <motion.div
          className="max-w-3xl mx-auto bg-white dark:bg-[var(--surface)] rounded-3xl p-10 md:p-14 text-center shadow-lg border border-[var(--border)]"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeUp}
        >
          <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] mb-4">
            Ready to plan your next adventure?
          </h2>
          <p className="text-[var(--text-secondary)] mb-8 font-medium">
            10 questions. Real places. Your perfect itinerary in minutes.
          </p>
          <button
            type="button"
            onClick={onStart}
            className="bg-brand-500 hover:bg-brand-600 text-white rounded-xl px-8 py-3 font-semibold active:scale-[0.97] transition-all cursor-pointer"
          >
            Plan My Trip
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-[var(--text-muted)] text-sm">
        <p>&copy; {new Date().getFullYear()} Rahify Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
