# CLAUDE.md — Rahify (formerly Rahi AI)

## What Is This
AI-powered travel planner at **rahify.com**. Users enter trip details → get itineraries with real places (Google Places fetched FIRST, then AI builds from verified data). Zero hallucination.

## Tech Stack
- **Frontend:** React 18 + Vite + Tailwind CSS v4 + Zustand + React Router v6
- **Backend:** Python 3.12 + FastAPI (separate repo/folder)
- **DB/Auth:** Supabase (PostgreSQL + Google OAuth only)
- **AI:** Groq (Llama 3 70B) → Claude (later, model-agnostic wrapper)
- **Analytics:** PostHog (posthog-js in frontend + PostHog MCP in Cursor)
- **Map Rendering:** Leaflet + OpenStreetMap (free, no API key)
- **Place Data:** Google Places API (New) for real place data, photos, ratings
- **Flights:** SerpAPI (Google Flights) with 10-min cache + IATA resolver
- **Geocoding:** Photon (Komoot) — free, worldwide
- **Font:** DM Sans (Google Fonts)
- **Dates:** react-day-picker
- **Animations:** framer-motion
- **Onboarding:** Custom tour system (TourOverlay, tourRegistry, tourStore)
- **PDF:** ReportLab (server-side, enhanced with Maps links, phrases, packing)
- **Payments:** LemonSqueezy (planned). Currently email-based credit requests.
- **Hosting:** Netlify (frontend) + Railway (backend Docker) + Porkbun (domain)
- **FX Rates:** frankfurter.app (free ECB rates, cached 24h in localStorage)

## Current State (Post-MVP Build)

### Implemented ✅
- Auth (Google OAuth via Supabase)
- 10-step home page trip input flow (public — no login required to explore)
  - Step 3: "Who's coming along?" (Solo/Couple/Friends/Family/Work) — shapes AI vibe
  - Step 2: Flexible dates now includes DurationSlider inline (no more skipped step)
  - All 10 steps always shown, no skip logic
  - Flying pill animation: selection flies from input to prompt box on Next click
  - Prompt preview only updates when pill "lands", not live while typing
  - IATA airport code support in city autocomplete (DFW → Dallas, LAX → Los Angeles)
- AI itinerary generation V2 (/generate SSE, Approach A: places first → multi-phase pipeline)
  - Phase 0: skeleton call designs trip structure only (arrival/departure, rest days, day trips, neighborhoods)
  - Phase 1-N: detail chunks (4-5 days per chunk) with durations, realistic timing buffers, and enforced interest mixing
  - Phase 3: enrichment after itinerary is complete (formula-based costs, transport, AI essentials with per-day dress code)
  - Packed days rule: relaxed=5-6, moderate=6-7, active=8-9 activities per full day (food not counted). Pace is strictly single-select.
  - Food = pit stops (45–60 minutes), max 1 lunch + 1 dinner per day
  - Day trips scaled by trip length, placed mid-trip only
  - Evenings go past 9pm for non-family trips; family trips end by 9pm and never include nightlife
  - Self-check in prompts: LLM validates timing, density, variety, and duplication before responding
  - travel_group (Solo/Couple/Friends/Family/Work) has hard rules that shape the entire itinerary
- Plan View with tab-based navigation (7 tabs)
- All tabs: Eat, Stay, Go, Trip (timeline), Flight, Costs, Next
- Timeline hover tooltips: place photo, rating, category, price, address on hover (smart positioning)
- Timeline rendering: dates parsed manually in local timezone to prevent UTC offsets shifting "Day 1" backwards
- Timeline day alerts: ⓘ icon on day headers for holidays/events/seasonal warnings (LLM-generated day_alert field, hover tooltip)
- Timeline click-to-locate: click activity → geocode via Photon → show on map or open Google Maps
- Interactive map (Leaflet + OSM, color-coded markers, route polylines, MapMessageCard overlay)
- AI Chatbot (context-aware, mutations, bottom sheet mobile / drawer desktop)
  - Friend-like tone, short responses, multi-turn history
  - Syncs is_in_itinerary between trips table and trip_places table
- Let's Pick popup → queues pending changes (no auto-rebuild), persists to DB via /update-picks
- Sidebar: overlay drawer (floating ☰ button, logged-in users only)
- Bottom nav bar (mobile: Home, Right Now, New Trip, My Plans)
- Share system (6-char codes, mandatory login, suggest, fork)
- Enhanced PDF (Rahify branding, trip stats header, quick ref, day-by-day with Maps links, cost table, places list, visa, pre-trip checklist, packing checklist, phrases, emergency contacts)
- Right Now modal (geolocation → nearby places, 3 tabs)
- Flight/Travel tab (SerpAPI + cache + IATA resolver + Skyscanner + Google Flights deep links)
  - Custom header with inline date pickers (pill-based DatePillPicker dropdown)
  - FlightCard dynamically displays both per-person and total price when travelers > 1 (e.g. "$1,200/person · $2,400 total")
  - One-way / Round-trip toggle
  - Smart date defaults: depart = tripStart-1, return = tripEnd
  - Date bounds: Out = max(today, tripStart-5) to tripStart-1. Return = tripEnd to tripEnd+4
  - Best/Cheapest/Fastest badges (computed from SerpAPI tag + price + duration)
  - Deep links update instantly when dates change, include return date for round trips
  - Skyscanner URL: /flights/{from}/{to}/{YYMMDD}/ (+ /{retYYMMDD}/ for round trip)
  - Google Flights URL: natural language query (?q=Flights from X to Y on DATE return DATE)
  - Backend refresh-flights accepts optional { departure_date, return_date } in body
  - Backend tags flights: "tag": "best" (best_flights) or "tag": "other" (other_flights)
  - LazySection hideHeader prop used for flight tab (renders its own custom header)
- Map interactions: click-to-focus pattern (PlaceCard/Timeline → focusPlace → MapInfoCard)
  - MapMessageCard for geocode fallback (10s countdown → auto-opens Google Maps, cancel button)
  - Temporary markers for geocoded places via mapMessage state with lat/lng
  - Geocode success: pin on map + address + Google Maps link (no countdown)
  - Geocode failure: MapMessageCard with countdown + auto-open + cancel
- Map route polylines (flight arc + day routes)
- Currency selector (reusable, searchable, common pinned) — only in CostsTab (removed from PlanHeader)
- Real-time currency conversion via frankfurter.app (free ECB rates, cached 24h in localStorage)
- Custom onboarding tour system (replaced intro.js)
  - TourOverlay: scrim + element elevation + styled info card (handwritten font, brand accent bar)
  - TourMenu: feature selection grid (full tour + individual features, NEW badges for unseen)
  - TourPrompt: "First time here?" floating prompt (bottom-right)
  - tourRegistry: declarative step definitions per page (home, form, plan) with priority ordering
  - tourStore: Zustand store with cookie + localStorage + Supabase profile sync for seen tracking
  - Full flow: home → form → plan (/plan/demo) → final step (profile dropdown "Replay Tour") for logged-in users
  - Element elevation: z-index 10001 + ancestor stacking context traversal (preserves fixed/absolute)
  - Scroll: scrollIntoView({ block: 'center', behavior: 'instant' }) + nudge +25% viewport height
  - Info card: bottom-right default, bottom-left when element >65% viewport width, center for text-only
  - Step properties: element, text, clickBefore, cleanupClick, elementIndex, formStep
  - Form sync: formStep property auto-navigates to correct form step during tour
  - Plan demo: /plan/demo disables lazy loading, z-auto on ActionBar/PlanHeader for elevation
  - Chat tour: clickBefore opens real ChatDrawer, cleanupClick closes it on step advance
  - Tab switching: clickBefore clicks tab bar buttons for flight/places steps
  - Retry: up to 3 attempts (500ms apart) for lazy-mounted elements
  - data-tour attributes on key elements for targeting (place-card, flight-section, chat-drawer, etc.)
  - Error boundary stops all tours on crash
  - Home-only tour: works for all users (logged-in or not), never navigates away from `/`, final step spotlights "Sign in to start planning"
  - Full cross-page flow (home → form → plan → final step) only runs for logged-in users and is triggered from TourPrompt or "Replay Tour"
  - TourPrompt on the home page chooses home-only vs full flow based on auth state
  - "Replay Tour" in the profile dropdown always navigates to `/` and then starts the full flow for logged-in users
- Light mode default (Tailwind + CSS variables, theme persisted to localStorage)
- mWeb responsive (bottom nav, bottom sheets, touch targets, PWA manifest)
  - Mobile experience is temporarily gated via `MobileGate` component (< 768px) prompting users to use desktop.
- Profile dropdown (Replay Tour, Settings, Travel Quiz, Feedback, Privacy, Logout)
- Credits: 5 free trips, email adarsh@rahify.com for more (no payment platform yet). Credits deducted after successful trip generation.
- Public home page: new users see full trip form, login required before form filling (/new is ProtectedRoute)
- Login page: minimal, no AI slop, terms/privacy as inline modals (not separate pages)
- Auth flow: Home → login → /new (form) → generate → /plan/new. No sessionStorage form persistence needed.
- React 18 StrictMode guards: useRef(false) on SSE generation, AuthCallback, and other one-shot effects
- Cross-account security: invalid tokens always return 401 (no dev fallback when token is provided)
- GeneratingScreen: fallback facts shown immediately, async fetch for real destination facts
- Credits UI: amber warning banner in PromptBox when 0 credits, "Request more" link in profile dropdown
- Generation error UX: if Supabase save fails during `/generate`, backend emits an `error` SSE (not `done`), and PlanPage shows a full-screen dark overlay with a prominent "Retry" button so users don't miss it
- Public roadmap page (`/roadmap`) with ref-measured SVG zigzag path, four zones (Shipped/Building Now/Up Next/Exploring), heart votes (localStorage), login-gated voting with toast, responsive (zigzag desktop / vertical mobile), no connecting path in Exploring zone

### Deployment (Live)
- **Frontend:** Netlify (static SPA, `frontend/dist`) — rahify.com
- **Backend:** Railway (Docker, FastAPI) — api.rahify.com
- **Domain:** Porkbun (rahify.com), DNS managed via Netlify DNS
- **SPA Redirects:** `frontend/public/_redirects` (`/* /index.html 200`)
- **Catch-all route:** React Router `<Route path="*" element={<Navigate to="/" />} />` for unknown paths
- **Auto-deploy:** Push to master → both Netlify and Railway auto-build + deploy
- **CORS:** Backend `FRONTEND_URL=https://rahify.com`, expose_headers includes Content-Disposition
- **Global exception handler:** Includes CORS headers for allowed origins (fixes PDF download CORS on error)

### Generation Pipeline V2 — High Level
- Approach A is still **places first**, but now runs as a 3-phase pipeline:
  - **Phase 0 — Skeleton:** one fast call that returns only the day-by-day trip shape (arrival, full, rest, day_trip, departure) with neighborhoods and notes.
  - **Phase 1-N — Chunks:** 2–4 chunk calls (4–5 days each) that fill in activities using ONLY fetched Google Places. Each chunk sees a context handoff so restaurants and key places are never reused.
  - **Phase 3 — Enrichment:** runs after all days are generated: formula-based cost estimation (no LLM), transport, and AI-powered essentials that read the completed itinerary.
- `/generate` now streams SSE events progressively:
  - `status`, `places_preview`, `skeleton`, `narrative_chunk`, `itinerary_day`/`itinerary_chunk`, `cost_estimate`, `transport`, `visa_info`, `travel_essentials`, `done`, `error`.
  - Frontend shows day-by-day loading (“Generating days 6–10...”) instead of waiting for a single giant response.

### Not Yet Implemented
- LemonSqueezy payment integration
- Travel Quiz
- Credit card reference in NextTab
- Service worker / offline mode
- PDF future goal: match reference PDF quality (hotel comparison tables, restaurant detail tables, route overview diagram, senior-friendly notes, health/safety section with detailed medical info, booking reference quick table). See Future_Reference.pdf for target.

---

## Styling: Tailwind CSS v4

We use Tailwind v4 with the Vite plugin. NO SCSS. NO CSS Modules. NO inline style={} objects.

### Setup
```bash
npm install -D tailwindcss @tailwindcss/vite
```

```js
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

```css
/* src/index.css — import Tailwind + custom theme */
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&display=swap');

@theme {
  /* Brand */
  --color-brand-50: #FFF7ED;
  --color-brand-100: #FFEDD5;
  --color-brand-200: #FED7AA;
  --color-brand-300: #FDBA74;
  --color-brand-400: #FB923C;
  --color-brand-500: #F97316;
  --color-brand-600: #EA580C;
  --color-brand-700: #C2410C;
  --color-brand-800: #9A3412;
  --color-brand-900: #7C2D12;
  --color-brand-950: #431407;

  /* Semantic */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;

  /* Map markers */
  --color-marker-eat: #EF4444;
  --color-marker-stay: #3B82F6;
  --color-marker-go: #10B981;
  --color-marker-activity: #8B5CF6;
  --color-marker-cafe: #F59E0B;
  --color-marker-outdoor: #14B8A6;

  /* Layout */
  --sidebar-collapsed: 60px;
  --sidebar-expanded: 280px;
  --topbar-height: 56px;

  /* Typography */
  --font-sans: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}

/* Theme colors — light mode default */
:root {
  --bg: #FDF8F4;
  --surface: #FFFFFF;
  --surface-hover: #FFF7ED;
  --border: #EDE3D7;
  --text-primary: #1E293B;
  --text-secondary: #64748B;
  --text-muted: #94A3B8;
}

.dark {
  --bg: #0F172A;
  --surface: #1E293B;
  --surface-hover: #334155;
  --border: #334155;
  --text-primary: #F8FAFC;
  --text-secondary: #94A3B8;
  --text-muted: #64748B;
}

body {
  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--text-primary);
}

/* Light mode: warm cream with subtle orange radial */
:root body, .light body {
  background: #FDF8F4;
  background-image: radial-gradient(ellipse at 50% -20%, rgba(249, 115, 22, 0.08) 0%, transparent 60%);
}

.dark body {
  background: #0F172A;
  background-image: radial-gradient(ellipse at 15% 0%, rgba(67, 20, 7, 0.4) 0%, transparent 50%);
}

/* Glassmorphism utilities */
@utility glass {
  background: rgba(249, 250, 251, 0.7);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

@utility glass-dark {
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

@utility glass-strong {
  background: rgba(249, 250, 251, 0.85);
  backdrop-filter: blur(24px) saturate(200%);
  -webkit-backdrop-filter: blur(24px) saturate(200%);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

@utility glass-strong-dark {
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(24px) saturate(200%);
  -webkit-backdrop-filter: blur(24px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

@utility shadow-brand {
  box-shadow: 0 4px 16px rgba(249, 115, 22, 0.25);
}
```

### How to Use Dark Mode
Theme class `.dark` / `.light` on `<html>`. Use CSS variables:

```jsx
// ✅ CORRECT
<div className="bg-[var(--surface)] border border-[var(--border)]">
  <p className="text-[var(--text-primary)]">Hello</p>
</div>

// ✅ Glass utilities (selective use — 30% of elevated elements max)
<div className="glass dark:glass-dark rounded-2xl p-4">

// ✅ Brand colors
<button className="bg-gradient-to-r from-brand-400 to-brand-600 text-white rounded-xl px-6 py-3 font-semibold shadow-brand">

// ❌ WRONG — no inline styles
<div style={{ background: '#1E293B' }}>
```

### Tailwind Patterns

**Solid card (default — most cards):**
```jsx
<div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 hover:shadow-md transition-shadow">
```

**Primary button:**
```jsx
<button className="bg-gradient-to-r from-brand-400 to-brand-600 text-white rounded-xl px-6 py-3 font-semibold shadow-brand hover:from-brand-500 hover:to-brand-700 active:scale-[0.97] transition-all">
```

**Ghost button:**
```jsx
<button className="border border-[var(--border)] text-[var(--text-secondary)] rounded-xl px-5 py-2.5 font-medium hover:bg-[var(--surface-hover)] transition-colors">
```

**Pill (inactive / active):**
```jsx
<button className="border border-[var(--border)] text-[var(--text-secondary)] rounded-full px-4 py-2 text-sm font-medium">
<button className="bg-brand-500 text-white border border-brand-500 rounded-full px-4 py-2 text-sm font-semibold">
```

**Typography:**
```
Hero:      text-3xl font-extrabold text-[var(--text-primary)]
Section:   text-xl font-bold text-[var(--text-primary)]
Card:      text-[15px] font-semibold text-[var(--text-primary)]
Body:      text-sm text-[var(--text-secondary)]
Caption:   text-xs text-[var(--text-muted)]
Label:     text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]
```

---

## Repo Structure
```
rahify/
├── CLAUDE.md
├── PROJECT_SPEC.md
├── MWEB_UI_SPEC.md
│
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   ├── manifest.json          ← PWA config
│   │   ├── icons/                 ← PWA icons
│   │   ├── sitemap.xml            ← SEO sitemap (home, login, explore, destinations)
│   │   └── robots.txt             ← SEO crawl rules (blocks /plan, /trip, /new, etc.)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/            ← Button, Modal, Toast, Dropdown, Badge, Loader, CurrencySelector
│   │   │   ├── layout/            ← TopBar, Sidebar, BottomNav, ThemeToggle, ProfileDropdown
│   │   │   ├── auth/              ← GoogleLoginButton, ProtectedRoute
│   │   │   ├── onboarding/        ← TourOverlay, TourMenu, TourPrompt, tourRegistry
│   │   │   ├── home/              ← CityAutocomplete, DatePicker, PaceSelector, PromptBox, StepperDots, etc.
│   │   │   ├── plan/              ← PlanView, PlanHeader, TabBar, ActionBar, MapPanel (+ MapMessageCard),
│   │   │   │                         ChatDrawer, LetsPickPopup, PlaceCard, FlightCard (badges), SharedBanner,
│   │   │   │                         LazySection (hideHeader), SuggestionsBadge
│   │   │   │   └── tabs/          ← EatTab, StayTab, PlacesTab, TripTab (Timeline), FlightTab (DatePillPicker), CostsTab, NextTab
│   │   │   ├── nearby/            ← NearbyModal
│   │   │   ├── credits/           ← CreditsExhausted (email CTA, not paywall)
│   │   │   └── profile/           ← ProfileForm
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── PlanPage.jsx       ← handles /plan/:id, /plan/demo, /trip/:id
│   │   │   ├── SettingsPage.jsx
│   │   │   ├── AuthPage.jsx
│   │   │   ├── ExplorePage.jsx              ← /explore SEO gallery
│   │   │   ├── ExploreDestinationPage.jsx   ← /explore/:slug SEO landing pages
│   │   │   └── RoadmapPage.jsx              ← /roadmap public roadmap (URL-only)
│   │   ├── hooks/
│   │   ├── stores/
│   │   │   ├── authStore.js
│   │   │   ├── tripStore.js
│   │   │   ├── uiStore.js
│   │   │   └── tourStore.js       ← tour state, seen tracking (cookie + localStorage + Supabase)
│   │   ├── services/
│   │   │   ├── api.js             ← apiGet, apiPost, apiSSE with error handling
│   │   │   └── supabase.js
│   │   ├── data/
│   │   │   ├── exploreDestinations.js ← static SEO content for /explore/:slug
│   │   │   └── roadmapFeatures.js     ← shipped/building/upcoming/exploring (updated per Iteration Learning Protocol)
│   │   ├── utils/
│   │   │   ├── constants.js
│   │   │   ├── formatCurrency.js
│   │   │   ├── countries.js
│   │   │   ├── affiliateLinks.js
│   │   │   └── mockTripData.js    ← demo trip for onboarding
│   │   ├── index.css              ← Tailwind imports + theme + glass utilities
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   │   └── _redirects             ← Netlify SPA redirects
│   ├── vite.config.js
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── dependencies.py        ← auth middleware (real token first, dev fallback only if no token)
│   │   ├── routes/
│   │   │   ├── generate.py        ← /generate SSE (places first → AI)
│   │   │   ├── chat.py            ← /chat SSE (context-aware, mutations)
│   │   │   ├── plans.py           ← CRUD + share + suggest + fork + refresh-flights
│   │   │   ├── pick.py            ← /pick SSE (rebuild from selections) + /update-picks (persist without rebuild)
│   │   │   ├── nearby.py          ← /nearby (geolocation → Google Places)
│   │   │   ├── user.py            ← profile CRUD
│   │   │   └── webhooks.py        ← future payment webhooks
│   │   ├── services/
│   │   │   ├── llm_service.py     ← model-agnostic (Groq ↔ Claude)
│   │   │   ├── places_service.py  ← Google Places Nearby Search
│   │   │   ├── flight_service.py  ← SerpAPI + cache + IATA resolution
│   │   │   ├── geocode_service.py ← Photon
│   │   │   ├── pdf_service.py     ← Enhanced ReportLab PDF
│   │   │   ├── cost_service.py    ← Formula-based cost estimation
│   │   │   ├── visa_service.py    ← Static visa/essentials data
│   │   │   └── essentials_service.py
│   │   ├── prompts/
│   │   │   ├── itinerary.py       ← generation prompt (no duplicate places rule)
│   │   │   ├── chat.py            ← chat prompt (trip-context-aware, concise rules)
│   │   │   └── essentials.py
│   │   └── utils/
│   │       ├── supabase_client.py
│   │       ├── iata_codes.py      ← 200+ city → IATA airport code lookup
│   │       ├── distance.py        ← haversine
│   │       └── cache.py
│   ├── requirements.txt
│   └── Dockerfile
│
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql
```

---

## Plan View Architecture

### Pattern: Tab-Based Navigation
7 sections accessible via horizontally scrollable tab pills. Click tab → shows that section's content. Map panel on desktop right side, floating toggle on mobile.

### Layout — Desktop
```
[☰]  ┌──────────────────────────┬──────────────────────┐
     │ PlanHeader               │                      │
     │ TabBar (scrollable pills)│                      │
     ├──────────────────────────┤   MapPanel            │
     │                          │   (Leaflet + OSM)    │
     │   Active Tab Content     │   Color-coded markers │
     │   (scrollable)           │   Route polylines     │
     │                          │   Click → popup       │
     ├──────────────────────────┤                      │
     │ ActionBar                │                      │
     │ [💬 Chat][🎯 Pick][🔄 Rebuild]│                      │
     └──────────────────────────┴──────────────────────┘
Floating ☰ opens overlay sidebar drawer (not inline)
```

### Layout — Mobile
```
┌────────────────────────────┐
│ ← Origin→Dest 7D    💱 🔗 │  compact header
├────────────────────────────┤
│ [Eat][Stay][Go][✈️][💰]→   │  scrollable tabs
├────────────────────────────┤
│                            │
│   Full-width tab content   │
│   (scrollable)             │
│                            │
├────────────────────────────┤
│ [💬][🎯 Pick][🔄 Rebuild]  │  sticky action bar
├────────────────────────────┤
│ 🏠  🔍  📍  📋             │  bottom nav
└────────────────────────────┘
[🗺️] floating map button (bottom-right)
```

### Chat
- **Desktop:** Right drawer (400px, slides from right, overlays map)
- **Mobile:** Bottom sheet (slides up, 85vh, scrim behind)
- Chat MUTATES trip state (remove/add places, select flights)
- Context-aware: system prompt includes live itinerary snapshot + trip dates
- Triggered by ActionBar button

### Map
- Leaflet + OpenStreetMap (free)
- Color-coded markers: eat=#EF4444, stay=#3B82F6, go=#10B981, activity=#8B5CF6, cafe=#F59E0B, outdoor=#14B8A6
- Flight tab: dashed orange arc (origin → destination)
- Trip tab: colored day-route polylines connecting activities
- Mobile: full-screen overlay toggled by floating 🗺️ button
- MapMessageCard: overlay notification on map (z-[1000] to appear above Leaflet panes)
  - Used for geocode success (pin + address) and failure (countdown + auto-open Google Maps)
  - Temporary markers rendered via mapMessage state with lat/lng coordinates
  - Cancel button to abort countdown and close card
- focusPlace: store action that sets selectedMarkerId, mapCenter, mapZoom, and shows map on mobile
- setMapMessage: store action that sets mapMessage, clears selectedMarkerId, shows map, optionally sets mapCenter/mapZoom

### Three Modes (one PlanView component)
- `editing`: owner, chat + Let's Pick, all interactions
- `shared`: viewer via ?shared=CODE (must be logged in), read-only, suggest + fork
- `saved`: frozen "My Trip" at /trip/:id, PDF download + booking links

### Data Flow
- All trip data in Zustand tripStore
- Sections read from trip.places filtered by category
- Map reads from trip.places + highlights based on active tab
- Chat messages in tripStore.chatMessages
- Chat responses trigger removePlace() / addPlaceToItinerary() / selectFlight() + addPendingChange()
- Let's Pick "Done" triggers removePlace() / addPlaceToItinerary() + addPendingChange() (no auto-rebuild)
- Rebuild button (third ActionBar button) appears when pendingChanges > 0 — calls POST /plans/:id/rebuild
- After rebuild: refresh trip from API → store updates → UI re-renders
- normalizeTrip (PlanPage.jsx): must explicitly map EVERY field from API response — missing fields silently dropped
  - Must include transportMode, transportData for flight deep links to work
- useScrollSpy: uses getBoundingClientRect() relative to scroll container (not el.offsetTop which is relative to offsetParent)

---

## Navigation Architecture

### Desktop
- TopBar: Logo + Theme Toggle + Profile Dropdown (or "Sign In" for logged-out users)
- Sidebar: floating ☰ button (left, vertically centered) → overlay drawer (280px) with Home, New Trip, Recent Chats, Saved Trips
- Sidebar only visible for logged-in users
- No collapsed rail — just the floating button

### Mobile
- Slim TopBar: "Rahify" logo + avatar (or "Sign In") (44px)
- Bottom Nav: 🏠 Home · 🔍 Right Now · 📍 New Trip · 📋 My Plans
- Sidebar: same overlay drawer as desktop (85vw max 320px), triggered by floating ☰ button

---

## Key Decisions Log
- Domain: rahify.com
- Auth: Google OAuth only (no email/password). Login deferred — home page is public.
- Styling: Tailwind v4 only (no SCSS, no CSS Modules)
- Map: Leaflet + OSM (free) — Google Places for data only
- Payments: LemonSqueezy (planned). Currently email-based credits.
- Credits: 5 free, email adarsh@rahify.com for more (no paywall modal). Deducted in generate_stream after successful DB save. Frontend refreshes profile on generation done event.
- Share: 6-char invite code + mandatory login (viral loop)
- Chat: context-aware with live itinerary in system prompt
- IATA: 200+ city lookup (not city[:3].upper())
- PDF: Rahify-branded, trip stats header, quick ref, day-by-day with Maps links, costs, places, visa, pre-trip checklist, packing, phrases, emergency contacts. Filename: rahify-{origin}-to-{dest}-{days}days.pdf
- Onboarding: Custom tour system (replaced intro.js). tourRegistry defines steps per page, TourOverlay renders scrim + elevation + info card. Persisted via cookie + localStorage + Supabase profile.tours_seen. Replay from profile dropdown.
- Onboarding elevation: z-index 10001 on target + all ancestor stacking contexts. Preserves fixed/absolute positioning (only static elements get position:relative).
- Onboarding scroll: always scrollIntoView + 25% nudge (no inView guard). Skipped for clickBefore steps (tab switch handles its own scroll).
- Onboarding cleanup: cleanupClick property for steps that open drawers (e.g., ChatDrawer) — clicks a different element to close vs re-clicking the opener.
- Onboarding demo page: /plan/demo disables lazy loading (forceVisible), uses z-auto on ActionBar/PlanHeader to avoid stacking context traps.
- PlanHeader ghost buttons: Currency, Share, Save Trip all use consistent ghost button style (border, rounded-xl, text-sm font-medium, same padding)
- Sidebar: overlay drawer only (no inline sidebar, no collapsed rail). Floating ☰ button. Logged-in users only.
- Sidebar redundancy: no settings/credits/theme in sidebar — all in profile dropdown or topbar
- Sidebar sync: re-fetches plans on open + route change
- Backend auth: real token used first even in dev mode (no hardcoded dev_user_id bypass when token present)
- Brand color: Sunset Orange #F97316
- Light bg: warm cream #FDF8F4 with subtle orange radial (default)
- Dark bg: #0F172A with subtle radial gradient
- Theme default: light mode (one-time localStorage migration from dark→light via `rahify-theme-v2` flag)
- TripFormPage: floating white card on warm background, centered content, warm gradient wash on left
- TripFormPage: flying pill animation on Next (value flies from input to prompt box)
- TripFormPage: prompt preview updates only on pill land, not live
- Form step 3: "Who's coming along?" (travelGroup: solo/couple/friends/family/work)
- City autocomplete: Photon API layers=city,locality,district,county + IATA code lookup (100+ airports)
- Auth flow: /new wrapped in ProtectedRoute → login required before form. No sessionStorage form persistence needed. Home → login → /new → generate → /plan/new
- AuthCallback: sets user in authStore BEFORE navigating + useRef guard to prevent StrictMode double-fire losing redirect
- React 18 StrictMode pattern: useRef(false) guard on one-shot effects (SSE generation, AuthCallback, etc.) to prevent double-fire
- Backend auth security: invalid tokens ALWAYS return 401 regardless of environment. Dev fallback only when NO auth header sent at all.
- Currency conversion: frankfurter.app (free ECB rates), cached 24h in localStorage. CurrencySelector only in CostsTab (removed from PlanHeader).
- Login page: terms/privacy open as modals on same page (no navigation away)
- Itinerary prompt V2: friend tone, packed days, food as filler, day trips + rest days scaled by trip length, self-check before responding, multi-phase skeleton → chunks → essentials
- Chat classifier: question/hypothetical guard routes "if I want to add...", "how does...", "can I..." to LLM instead of regex. Prevents misclassification of exploratory messages as commands.
- Chat prompt: friend who's been there, 1-3 sentences, specific tips, multi-turn history
- Rebuild as third button: ActionBar always shows Chat + Let's Pick. Rebuild appears as third button when pendingChanges > 0. User can do multiple Let's Pick + Chat actions, then rebuild once.
- Let's Pick no auto-rebuild: "Done" queues changes as pending, persists selection to DB via POST /update-picks, shows toast with count. User clicks Rebuild when ready.
- Day alerts: LLM generates optional `day_alert` field per itinerary day for holidays/events/seasonal concerns. Shown as ⓘ hover tooltip on Timeline day headers.
- Flight tab: custom header layout — Row 1: "Flights" + [Round trip|One way] + date pills + Search. Row 2: route + freshness + Refresh button
- Flight date pickers: pill-based DatePillPicker dropdown (not native `<input type="date">`), brand-500 selected state, click-outside-to-close
- Flight date defaults: depart = tripStart-1 (arrive day before trip), return = tripEnd. Bounds: depart max(today, tripStart-5)→tripStart-1, return tripEnd→tripEnd+4
- Flight badges: Best (from SerpAPI tag), Cheapest (lowest price), Fastest (shortest duration) — orange/green/blue pills
- Flight deep links: Skyscanner (/flights/dfw/sea/260310/260317/) + Google Flights (?q=Flights from Dallas to Seattle on 2026-03-10 return 2026-03-17)
- System Prompts: Prompts containing literal JSON examples strictly use Python `f-strings` rather than `.format()` to prevent string interpolation crashes.
- LLM JSON Parsing: `generate_stream` strictly asserts `skeleton` output isn't empty after `_safe_json_loads` silently captures errors, so the graceful `json_completion` fallback actually triggers on bad JSON.
- Geocode fallback UX: MapMessageCard on map with 10s countdown → auto-opens Google Maps, cancel button. Replaces invisible toast.
- Map interactions: PlaceCard/Timeline click → focusPlace (existing places) or setMapMessage (geocoded/temporary)
- LazySection: hideHeader prop for tabs that render their own header (e.g., flight tab)
- useScrollSpy: getBoundingClientRect() relative to container, not offsetTop (which is relative to offsetParent)
- normalizeTrip: must explicitly include every API field — transportMode, transportData added for flight deep links
- window.open in setInterval: blocked by popup blockers. Provide <a> tag as fallback for user-initiated navigation
- Leaflet z-index: internal panes use 200-600. Custom overlays need z-[1000] to appear above map layers
- Deployment: Netlify (frontend SPA) + Railway (backend Docker). NOT Vercel — SSE streaming needs persistent connections, not serverless.
- Domain: rahify.com (Porkbun) → DNS managed by Netlify. api.rahify.com CNAME → Railway.
- SPA redirects: `frontend/public/_redirects` for Netlify. React Router `path="*"` catch-all → redirect to `/`.
- Global exception handler: must include CORS headers for allowed origins (plain JSONResponse bypasses CORS middleware).
- PDF download: available in all modes (editing + saved), visible on mobile + desktop, ghost button style. Loading spinner while generating.
- PDF branding: Rahify (not Rahi AI). Orange accent bars, brand-colored day headers, trip stats row, pre-trip checklist, emergency contacts, packing by category.
- Backend API title: "Rahify API" (not "Rahi AI API")
- expose_headers: Content-Disposition added to CORS middleware for PDF filename.
 - Railway config: `railway_cname` is an optional `Settings` field so Railway's injected env var doesn't break Pydantic validation.
 - Suggestions safety: `/plans/{trip_id}/suggestions` short-circuits to an empty list for non-UUID IDs (e.g., `/plan/demo`), and the frontend skips suggestions fetch entirely when `tripId === 'demo'`.
 - PostHog dev behavior: analytics are disabled in local Vite dev (`import.meta.env.DEV`) and when `VITE_POSTHOG_KEY` is unset, to avoid noisy local data and adblock errors.
 - Explore SEO pages: `/explore` gallery and `/explore/:slug` landing pages (starting with Paris) are public and crawlable, powered by `exploreDestinations.js` and lucide-react icons.
 - SEO foundation: static sitemap.xml + robots.txt, site-wide meta tags, Open Graph + Twitter tags, JSON-LD (WebApplication + Organization), and a `<noscript>` fallback in `index.html`. Prerendering is deferred until the build pipeline supports puppeteer.
 - Roadmap page: public at /roadmap, URL-only access (no nav entry). Ref-measured SVG zigzag path, four zones (Shipped/Building/Up Next/Exploring), heart votes per feature (localStorage → Supabase later). No dates on upcoming features. | Mar 9
 - Roadmap data: static `src/data/roadmapFeatures.js`, updated as part of Iteration Learning Protocol. No payment/pricing features shown. | Mar 9
 - Roadmap path: single SVG with `useRef` + `ResizeObserver` measuring real card positions. Individual SVG segments between cards look choppy — always use one continuous path. | Mar 9
- Generation pipeline V2: skeleton + chunked itinerary generation + post-itinerary essentials, with formula-based cost estimation and domestic travel detection. | Mar 11
- Dietary filtering: EatTab soft-filters obviously incompatible restaurants (e.g., BBQ for vegetarians) on the frontend, using simple keyword heuristics over Google Places text. | Mar 11

---

## 🚫 UI Anti-Slop Rules

The #1 goal is a **human-feeling** website. Every pixel should feel like a real designer made it, not an AI template. If something looks like it came from a chatbot prompt → it's wrong.

### NEVER — Visual
- Purple/blue gradients — our brand is sunset orange
- Glassmorphism on everything — 30% of elevated elements max
- Equal padding everywhere — create hierarchy with uneven whitespace
- Every button primary — use ghost, outline, subtle variants; most buttons should be secondary
- Drop shadow on every card — most need only a subtle border or nothing
- Inter/Roboto/Arial fonts — DM Sans only
- Linear easing — use ease-out or framer-motion springs
- 300ms on everything — button press 100ms, layout 200ms, page transitions 200ms

### NEVER — AI Slop Patterns (these instantly look fake)
- Gradient text on everything — reserve gradient text for ONE hero element per page max
- Rounded-full pill buttons everywhere — mix rounded-xl and rounded-full contextually
- Emoji before every label — emojis are accents, not mandatory prefixes; skip them when text is clear enough
- "✨ Generate ✨" / sparkle emoji spam — one sparkle max, never wrap text in emoji brackets
- Shadow-brand on non-primary elements — the orange glow is for CTA buttons only
- Uniform card grids with identical styling — vary card sizes, layouts, and emphasis
- "bg-gradient-to-r from-brand-400 to-brand-600" on more than 2 elements per page — gradients lose impact when overused
- Perfect symmetry everywhere — real designs have intentional asymmetry and visual weight shifts
- All text centered — center only heroes, step questions, and CTAs. Body text, card content, list items → left-aligned
- Every section having a heading + subtitle + cards in a grid — vary layouts (some sections are just text, some are a single callout, some are horizontal scrolls)
- Decorative elements that serve no purpose — no floating dots, no random shapes, no "pattern overlays"
- Overusing uppercase tracking-wider labels — one or two per page max, not on every sub-section
- Generic placeholder copy ("Get started today!", "Your journey begins here") — write specific, useful copy or leave it empty
- Wrapping every action in a card with border + rounded-xl + shadow — some actions are just inline links or plain text buttons
- Using brand-50/brand-100 as background on more than 2 elements per page — the warm tint loses meaning when everything has it
- Nesting rounded corners inside rounded corners (pill inside card inside card) — one level of rounding max per visual block

### NEVER — Interaction Slop
- Hover effects on mobile — use active:scale-[0.97] or active:opacity-80 instead
- Spinners for < 2s loads — use skeleton shimmer or nothing
- Loading states that block the whole page — load content incrementally
- Tooltips on mobile — no hover, no tooltips. Use inline hints or bottom sheets
- Modals for simple choices — use inline expansion or bottom sheets on mobile

### ALWAYS — Human Feel
- ONE dominant element per section (largest, boldest, or most colorful) — everything else defers
- More space between sections than within them
- Uneven rhythm — not every section has the same structure. Some are tight, some breathe
- Content max-w-md or max-w-lg for readability
- Brand orange as accent (10-15% of UI surface area) — it should feel special, not wallpaper
- 44×44px minimum touch targets on mobile
- Active/pressed states on mobile (not hover)
- Skeleton loaders instead of spinners for data fetches
- 100dvh not 100vh for mobile layouts
- Real visual hierarchy — squint at the page: can you tell what matters in 2 seconds?
- Subtle borders over shadows — shadows are expensive visually; use them only on elevated/floating things
- White space is a feature — if it feels cramped, add space. If it feels empty, that's often correct
- Button labels should be verbs or clear actions ("Save Trip", "Next", "Change") not vague ("Submit", "OK", "Continue")
- Empty states should feel helpful, not sad — guide the user to the next action
- Transitions should be fast and purposeful — if you can't explain why something animates, remove the animation

### Typography Rhythm
```
Hero:      text-3xl font-extrabold
Section:   text-xl font-bold
Card:      text-[15px] font-semibold
Body:      text-sm text-[var(--text-secondary)]
Caption:   text-xs text-[var(--text-muted)]
Label:     text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]
```

### Glassmorphism — Selective
- ✅ glass: autocomplete dropdowns, floating bars, modals, map overlays
- ❌ solid: regular cards, list items, sidebar, topbar, form containers, settings pages

### Color Budget Per Page (light mode)
- Background: warm cream `#FDF8F4` — 70%+ of visible area
- White `#FFFFFF` — cards, inputs, surfaces — 20%
- Brand orange — buttons, active states, accents — 5-10%
- Text grays — the remaining contrast
- If a page looks "very orange" → you've overshot. Pull back.

---

## What NOT To Do
- ❌ No SCSS, no CSS Modules, no .module.scss
- ❌ No style={{}} inline props
- ❌ No CSS-in-JS (styled-components, emotion)
- ❌ No UI libraries (MUI, Chakra, shadcn)
- ❌ No external placeholder images — use emoji or colored divs
- ❌ No backend work until asked
- ❌ No purple gradients, no generic blue/white themes

---

## Iteration Learning Protocol

After every set of changes, Claude MUST:

1. **Update CLAUDE.md** — Reflect new architecture, decisions, and patterns in the relevant sections (Current State, Navigation Architecture, Key Decisions Log, etc.)
2. **Update PROJECT_SPEC.md** — Keep the project spec in sync with actual implementation (auth flow, sidebar behavior, onboarding, navigation patterns)
3. **Update MWEB_UI_SPEC.md** — Keep the mobile spec in sync (navigation changes, sidebar drawer behavior, topbar changes)
4. **Update .cursorrules** — Keep the rules in sync with the ongoing project
5. **Update README.md** — Keep readme in sync with all changes for any new devloper during onboard
6. **Learn from bugs** — When a bug is found and fixed, document the root cause pattern so it's not repeated:
   - State persistence issues → always persist critical UI state to localStorage
   - Auth leaks → always use real token first, dev fallback only as last resort
   - Redundant UI → single source of truth for each action (settings, theme, credits, logout)
   - Stale data → re-fetch when component becomes visible, not just on mount
7. **Update memory** — Write patterns and fixes to auto-memory so future sessions benefit
8. **Update Roadmap** — After every feature ship, update `src/data/roadmapFeatures.js`:
   - Move the shipped feature from its current category to `shipped` with a `shippedDate` (month + year)
   - Move any unfinished `building` items back to `upcoming`
   - Promote the next 1-2 highest-priority `upcoming` items to `building`
   - This is mandatory, same priority as updating specs

This is mandatory. Specs that drift from implementation cause confusion and regressions.
