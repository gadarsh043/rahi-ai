/* Shared mini mockup components for landing page feature cards */

export function MiniTripPreview() {
  const DAY = [
    { time: '9:00 AM', place: 'Senso-ji Temple', dot: 'bg-emerald-500' },
    { time: '12:30 PM', place: 'Tsukiji Outer Market', dot: 'bg-red-500' },
    { time: '2:30 PM', place: 'teamLab Borderless', dot: 'bg-violet-500' },
    { time: '6:00 PM', place: 'Shibuya Crossing', dot: 'bg-emerald-500' },
    { time: '8:30 PM', place: 'Gonpachi Nishi-Azabu', dot: 'bg-red-500' },
  ];

  return (
    <div className="w-[300px] sm:w-[320px] md:w-[340px] bg-[var(--surface)] rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.12)] border border-[var(--border)] overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[15px] font-bold text-[var(--text-primary)]">Tokyo, Japan</p>
            <p className="text-xs text-[var(--text-muted)]">5 days &middot; Dec 15&ndash;20</p>
          </div>
          <span className="text-2xl">{'\u{1F1EF}\u{1F1F5}'}</span>
        </div>
        <div className="flex gap-1.5 mt-3">
          {['Trip', 'Eat', 'Stay', 'Go', '\u2708\uFE0F'].map((tab, i) => (
            <span
              key={tab}
              className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                i === 0 ? 'bg-brand-500 text-white' : 'bg-[var(--bg)] text-[var(--text-muted)]'
              }`}
            >
              {tab}
            </span>
          ))}
        </div>
      </div>
      <div className="px-5 pt-2 pb-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Day 1 &middot; Culture & Street Food
        </p>
      </div>
      <div className="px-5 pb-5 space-y-2.5">
        {DAY.map((item) => (
          <div key={item.place} className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full ${item.dot} shrink-0`} />
            <span className="text-[11px] text-[var(--text-muted)] w-[52px] shrink-0 font-medium">{item.time}</span>
            <span className="text-xs font-medium text-[var(--text-primary)]">{item.place}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MiniItinerary() {
  return (
    <div className="bg-[var(--bg)] rounded-xl p-3 w-full">
      {[
        { t: '9 AM', n: 'Senso-ji Temple', c: 'bg-emerald-500' },
        { t: '12 PM', n: 'Tsukiji Market', c: 'bg-red-500' },
        { t: '3 PM', n: 'teamLab Borderless', c: 'bg-violet-500' },
        { t: '7 PM', n: 'Shibuya Crossing', c: 'bg-emerald-500' },
      ].map((i) => (
        <div key={i.n} className="flex items-center gap-2 py-1">
          <span className={`w-1.5 h-1.5 rounded-full ${i.c}`} />
          <span className="text-[10px] text-[var(--text-muted)] w-9 shrink-0">{i.t}</span>
          <span className="text-[10px] font-medium text-[var(--text-primary)]">{i.n}</span>
        </div>
      ))}
    </div>
  );
}

export function MiniChat() {
  return (
    <div className="bg-[var(--bg)] rounded-xl p-3 space-y-2 w-full">
      <div className="flex justify-end">
        <div className="bg-brand-500 text-white text-[10px] px-2.5 py-1.5 rounded-lg rounded-br-sm max-w-[160px] leading-relaxed">
          Swap hotel for beachside?
        </div>
      </div>
      <div className="flex justify-start">
        <div className="bg-[var(--surface)] text-[var(--text-secondary)] text-[10px] px-2.5 py-1.5 rounded-lg rounded-bl-sm max-w-[180px] leading-relaxed border border-[var(--border)]">
          Done! Swapped to Seaside Resort Kamakura &mdash; 4.6&#9733;, beach walkable.
        </div>
      </div>
    </div>
  );
}

export function MiniMap() {
  return (
    <div className="bg-[var(--bg)] rounded-xl w-full h-24 relative overflow-hidden">
      <div className="absolute w-2 h-2 rounded-full bg-emerald-500" style={{ top: '25%', left: '30%' }} />
      <div className="absolute w-2 h-2 rounded-full bg-red-500" style={{ top: '50%', left: '55%' }} />
      <div className="absolute w-2 h-2 rounded-full bg-violet-500" style={{ top: '35%', left: '72%' }} />
      <div className="absolute w-2 h-2 rounded-full bg-blue-500" style={{ top: '65%', left: '42%' }} />
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline points="30,25 55,50 72,35 42,65" fill="none" stroke="rgba(249,115,22,0.35)" strokeWidth="1" strokeDasharray="3,2" />
      </svg>
    </div>
  );
}

export function MiniFlight() {
  return (
    <div className="bg-[var(--bg)] rounded-xl p-3 w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-[var(--text-primary)]">JFK</span>
        <div className="flex-1 mx-2 border-t border-dashed border-[var(--text-muted)] relative">
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px]">{'\u2708\uFE0F'}</span>
        </div>
        <span className="text-[10px] font-bold text-[var(--text-primary)]">NRT</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-[9px] text-[var(--text-muted)]">14h 20m &middot; 1 stop</span>
        <span className="text-xs font-bold text-brand-500">$487</span>
      </div>
    </div>
  );
}

export function MiniShare() {
  return (
    <div className="bg-[var(--bg)] rounded-xl p-3 w-full text-center">
      <p className="text-[10px] text-[var(--text-muted)] mb-1.5">Share code</p>
      <div className="font-mono text-lg font-bold tracking-[0.2em] text-brand-500">X7K2M9</div>
      <p className="text-[9px] text-[var(--text-muted)] mt-1.5">Friends can view, suggest, or fork</p>
    </div>
  );
}

export function MiniPDF() {
  return (
    <div className="bg-[var(--bg)] rounded-xl p-3 w-full">
      <div className="bg-white dark:bg-[var(--surface)] rounded-lg p-2.5 border border-[var(--border)] shadow-sm">
        <div className="h-1.5 w-20 bg-[var(--text-primary)] rounded-full mb-2" />
        <div className="space-y-1">
          <div className="h-0.5 w-full bg-[var(--border)] rounded-full" />
          <div className="h-0.5 w-3/4 bg-[var(--border)] rounded-full" />
          <div className="h-0.5 w-full bg-[var(--border)] rounded-full" />
          <div className="h-0.5 w-2/3 bg-[var(--border)] rounded-full" />
        </div>
      </div>
      <p className="text-[9px] text-[var(--text-muted)] mt-2 text-center">Maps links &middot; Packing &middot; Phrases</p>
    </div>
  );
}

export const FEATURES = [
  { title: 'Real Places, Zero Guessing', desc: 'Every restaurant, hotel, and attraction comes from Google Places with real ratings, photos, and addresses.', Mockup: MiniItinerary },
  { title: 'Chat to Customize', desc: "Don't like something? Tell the AI. It swaps hotels, adds day trips, and adjusts your plan instantly.", Mockup: MiniChat },
  { title: 'Interactive Map', desc: 'Color-coded markers for food, stays, and activities. Route lines for each day. Click any marker for details.', Mockup: MiniMap },
  { title: 'Flights & Costs', desc: 'Real flight prices, daily cost breakdowns, and visa info \u2014 all built into your plan.', Mockup: MiniFlight },
  { title: 'Share & Collaborate', desc: 'Generate a 6-char invite code. Friends can view your trip, suggest changes, or fork their own version.', Mockup: MiniShare },
  { title: 'PDF Trip Guide', desc: 'Download a PDF with your full itinerary, Google Maps links, packing list, and local phrases.', Mockup: MiniPDF },
];

export const HOW_IT_WORKS = [
  { step: '1', title: 'Tell us your trip', desc: 'Answer 10 quick questions \u2014 destination, dates, pace, budget. No sign up needed.' },
  { step: '2', title: 'We build it', desc: 'Real places are fetched from Google to fill a personalized day-by-day itinerary.' },
  { step: '3', title: 'Make it yours', desc: 'Chat with AI to swap places, add day trips, and tweak every detail.' },
  { step: '4', title: 'Go explore', desc: 'Save your trip, download the PDF, and share with travel buddies.' },
];

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
};
