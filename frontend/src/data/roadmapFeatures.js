// src/data/roadmapFeatures.js
// ──────────────────────────────────────────────────────────────
// Roadmap feature data — single source of truth.
// CLAUDE.md mandate: after every feature ship, move it to 'shipped'
// with a shippedDate. Unfinished 'building' items → back to 'upcoming'.
// Heart counts: localStorage now → Supabase roadmap_hearts table later.
// ──────────────────────────────────────────────────────────────

const roadmapFeatures = {
  // ── SHIPPED ── Features live on rahify.com right now
  shipped: [
    {
      id: 'ship-1',
      emoji: '🗺️',
      title: 'AI Trip Planning',
      description: 'Real places first, then AI builds your itinerary. Zero hallucination.',
      shippedDate: 'Mar 2026',
    },
    {
      id: 'ship-2',
      emoji: '✈️',
      title: 'Real Flight Search',
      description: 'Live flight data with Skyscanner & Google Flights deep links.',
      shippedDate: 'Mar 2026',
    },
    {
      id: 'ship-3',
      emoji: '🌍',
      title: 'Interactive Trip Map',
      description: 'Color-coded markers, route lines, and click-to-explore.',
      shippedDate: 'Mar 2026',
    },
    {
      id: 'ship-4',
      emoji: '🔗',
      title: 'Trip Sharing',
      description: 'Share trips via invite code. Viewers can suggest changes or fork.',
      shippedDate: 'Mar 2026',
    },
    {
      id: 'ship-5',
      emoji: '📄',
      title: 'PDF Trip Export',
      description: 'Branded PDF with itinerary, costs, visa info, and packing list.',
      shippedDate: 'Mar 2026',
    },
    {
      id: 'ship-6',
      emoji: '💬',
      title: 'AI Trip Chat',
      description: 'Modify your plan in natural language — swap places, change pace.',
      shippedDate: 'Mar 2026',
    },
    {
      id: 'ship-7',
      emoji: '💱',
      title: 'Multi-Currency Costs',
      description: '150+ currencies with live exchange rates for trip cost estimates.',
      shippedDate: 'Mar 2026',
    },
    {
      id: 'ship-8',
      emoji: '🧠',
      title: 'Smarter Itineraries',
      description: 'Skeleton + chunked generation with better day flow, day trips, strict duplicate prevention, and robust JSON parsing.',
      shippedDate: 'Mar 2026',
    },
  ],

  // ── BUILDING NOW ── Actively being developed
  building: [
    {
      id: 'build-1',
      emoji: '🧭',
      title: 'Travel Style Quiz',
      description: 'Short quiz that learns your travel style and pre-fills future preferences.',
    },
    {
      id: 'build-2',
      emoji: '🌆',
      title: 'Destination Guides',
      description: 'Curated city guides with local tips, budgets, and best-time-to-visit info.',
    },
  ],

  // ── UP NEXT ── Planned features (from V2 backlog)
  upcoming: [
    {
      id: 'next-1',
      emoji: '👥',
      title: 'Group Trip Editing',
      description: 'Invite friends to the same plan. Everyone can suggest and vote on places.',
      hearts: 0,
    },
    {
      id: 'next-2',
      emoji: '🚆',
      title: 'Multi-City Route Planner',
      description: 'Plan trips across multiple cities with optimized routes between them.',
      hearts: 0,
    },
    {
      id: 'next-3',
      emoji: '💰',
      title: 'Smart Budget Optimizer',
      description: 'Get suggestions to stretch your budget — cheaper stays, free activities.',
      hearts: 0,
    },
    {
      id: 'next-4',
      emoji: '📱',
      title: 'Offline Mode',
      description: 'Access your full itinerary and maps without internet connection.',
      hearts: 0,
    },
    {
      id: 'next-5',
      emoji: '🗓️',
      title: 'Flexible Date Search',
      description: 'Find the cheapest dates to travel — not just fixed dates.',
      hearts: 0,
    },
    {
      id: 'next-6',
      emoji: '🎙️',
      title: 'Voice Commands',
      description: 'Modify your trip by talking — "swap lunch for something vegetarian."',
      hearts: 0,
    },
    {
      id: 'next-7',
      emoji: '🎫',
      title: 'Activity Booking',
      description: 'Book tours and experiences directly from your plan.',
      hearts: 0,
    },
  ],

  // ── EXPLORING ── Ideas from V3-V5 backlog. No path — these float.
  exploring: [
    {
      id: 'explore-1',
      emoji: '🎲',
      title: 'Surprise Me Mode',
      description: 'Set a budget and timeframe — let Rahify pick the destination.',
      hearts: 0,
    },
    {
      id: 'explore-2',
      emoji: '👫',
      title: 'Travel Buddy Matching',
      description: 'Find travelers heading to the same place at the same time.',
      hearts: 0,
    },
    {
      id: 'explore-3',
      emoji: '📊',
      title: 'Trip Wallet & Expense Splitting',
      description: 'Track spending on the go and split costs with your group.',
      hearts: 0,
    },
    {
      id: 'explore-4',
      emoji: '🏗️',
      title: 'White-Label Planning API',
      description: "Let other apps build on Rahify's trip planning engine.",
      hearts: 0,
    },
  ],
};

export default roadmapFeatures;