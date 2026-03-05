# CLAUDE.md — Rahify (formerly Rahi AI)

## What Is This
AI-powered travel planner at **rahify.com**. Users enter trip details → get itineraries with real places (Google Places fetched FIRST, then AI builds from verified data). Zero hallucination.

## Tech Stack
- **Frontend:** React 18 + Vite + Tailwind CSS v4 + Zustand + React Router v6
- **Backend:** Python 3.12 + FastAPI (separate repo/folder)
- **DB/Auth:** Supabase (PostgreSQL + Google OAuth only)
- **AI:** Groq (Llama 3 70B) → Claude (later, model-agnostic wrapper)
- **Map Rendering:** Leaflet + OpenStreetMap (free, no API key)
- **Place Data:** Google Places API (New) for real place data, photos, ratings
- **Flights:** SerpAPI (Google Flights) with 10-min cache + IATA resolver
- **Geocoding:** Photon (Komoot) — free, worldwide
- **Font:** DM Sans (Google Fonts)
- **Dates:** react-day-picker
- **Animations:** framer-motion
- **Onboarding:** intro.js
- **PDF:** ReportLab (server-side, enhanced with Maps links, phrases, packing)
- **Payments:** LemonSqueezy (planned). Currently email-based credit requests.

## Current State (Post-MVP Build)

### Implemented ✅
- Auth (Google OAuth via Supabase)
- 10-step home page trip input flow
- AI itinerary generation (/generate SSE, Approach A: places first)
- Plan View with tab-based navigation (7 tabs)
- All tabs: Eat, Stay, Go, Trip (timeline), Flight, Costs, Next
- Interactive map (Leaflet + OSM, color-coded markers, route polylines)
- AI Chatbot (context-aware, mutations, bottom sheet mobile / drawer desktop)
- Let's Pick popup → /pick SSE wiring
- Collapsible sidebar + mobile drawer + My Plans + Recent Chats
- Bottom nav bar (mobile: Home, Right Now, New Trip, My Plans)
- Share system (6-char codes, mandatory login, suggest, fork)
- Enhanced PDF (quick ref, Maps links, packing list, phrases, visa)
- Right Now modal (geolocation → nearby places, 3 tabs)
- Flight/Travel tab (SerpAPI + cache + IATA resolver + Skyscanner fallback)
- Map route polylines (flight arc + day routes)
- Currency selector (reusable, searchable, common pinned)
- Onboarding (WelcomeTour on home, PlanTour on /plan/demo with mock data)
- Dark/Light mode (Tailwind + CSS variables)
- mWeb responsive (bottom nav, bottom sheets, touch targets, PWA manifest)
- Profile dropdown (Settings, Tour, Feedback, Credits, Logout)
- Credits: 5 free trips, email g.adarsh043@gmail.com for more (no payment platform yet)

### Not Yet Implemented
- LemonSqueezy payment integration (domain + setup needed)
- Travel Quiz
- Credit card reference in NextTab
- Service worker / offline mode
- SEO meta tags + OG images
- Production deploy (Railway + Vercel)

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

/* Dark mode colors — using CSS custom properties for theme switching */
:root {
  --bg: #FFFFFF;
  --surface: #F9FAFB;
  --surface-hover: #F3F4F6;
  --border: #E5E7EB;
  --text-primary: #111827;
  --text-secondary: #6B7280;
  --text-muted: #9CA3AF;
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
│   │   └── icons/                 ← PWA icons
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/            ← Button, Modal, Toast, Dropdown, Badge, Loader, CurrencySelector
│   │   │   ├── layout/            ← TopBar, Sidebar, BottomNav, ThemeToggle, ProfileDropdown
│   │   │   ├── auth/              ← GoogleLoginButton, ProtectedRoute
│   │   │   ├── onboarding/        ← WelcomeTour, PlanTour
│   │   │   ├── home/              ← CityAutocomplete, DatePicker, PaceSelector, PromptBox, StepperDots, etc.
│   │   │   ├── plan/              ← PlanView, PlanHeader, TabBar, ActionBar, MapPanel, ChatDrawer,
│   │   │   │                         LetsPickPopup, PlaceCard, FlightCard, SharedBanner, SuggestionsBadge
│   │   │   │   └── sections/      ← EatSection, StaySection, PlacesSection, TripSection, FlightSection, CostsSection, NextSection
│   │   │   ├── nearby/            ← NearbyModal
│   │   │   ├── credits/           ← CreditsExhausted (email CTA, not paywall)
│   │   │   └── profile/           ← ProfileForm
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── PlanPage.jsx       ← handles /plan/:id, /plan/demo, /trip/:id
│   │   │   ├── SettingsPage.jsx
│   │   │   └── AuthPage.jsx
│   │   ├── hooks/
│   │   ├── stores/
│   │   │   ├── authStore.js
│   │   │   ├── tripStore.js
│   │   │   ├── uiStore.js
│   │   │   └── onboardingStore.js
│   │   ├── services/
│   │   │   ├── api.js             ← apiGet, apiPost, apiSSE with error handling
│   │   │   └── supabase.js
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
│   ├── vercel.json                ← SPA rewrites
│   ├── vite.config.js
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── dependencies.py        ← auth middleware (dev bypass in ENV=development only)
│   │   ├── routes/
│   │   │   ├── generate.py        ← /generate SSE (places first → AI)
│   │   │   ├── chat.py            ← /chat SSE (context-aware, mutations)
│   │   │   ├── plans.py           ← CRUD + share + suggest + fork + refresh-flights
│   │   │   ├── pick.py            ← /pick SSE (rebuild from selections)
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
┌──────┬──────────────────────────┬──────────────────────┐
│      │ PlanHeader               │                      │
│ Side │ TabBar (scrollable pills)│                      │
│ bar  ├──────────────────────────┤   MapPanel            │
│      │                          │   (Leaflet + OSM)    │
│      │   Active Tab Content     │   Color-coded markers │
│      │   (scrollable)           │   Route polylines     │
│      │                          │   Click → popup       │
│      ├──────────────────────────┤                      │
│      │ ActionBar                │                      │
│      │ [💬 Chat] [🎯 Let's Pick]│                      │
└──────┴──────────────────────────┴──────────────────────┘
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
│ [💬 Chat] [🎯 Let's Pick]  │  sticky action bar
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

### Three Modes (one PlanView component)
- `editing`: owner, chat + Let's Pick, all interactions
- `shared`: viewer via ?shared=CODE (must be logged in), read-only, suggest + fork
- `saved`: frozen "My Trip" at /trip/:id, PDF download + booking links

### Data Flow
- All trip data in Zustand tripStore
- Sections read from trip.places filtered by category
- Map reads from trip.places + highlights based on active tab
- Chat messages in tripStore.chatMessages
- Chat responses trigger removePlace() / addPlaceToItinerary() / selectFlight()
- After any mutation: refresh trip from API → store updates → UI re-renders

---

## Navigation Architecture

### Desktop
- TopBar: Logo + Right Now + Theme Toggle + Profile Dropdown
- Left Sidebar: collapsible (60px rail ↔ 280px expanded), New Trip, Recent Chats, Saved Trips

### Mobile
- Slim TopBar: ☰ hamburger + "Rahi" logo + avatar (44px)
- Bottom Nav: 🏠 Home · 🔍 Right Now · 📍 New Trip · 📋 My Plans
- Sidebar: overlay drawer (85vw max 320px) with trips + settings + dark mode + logout

---

## Key Decisions Log
- Domain: rahify.com
- Auth: Google OAuth only (no email/password)
- Styling: Tailwind v4 only (no SCSS, no CSS Modules)
- Map: Leaflet + OSM (free) — Google Places for data only
- Payments: LemonSqueezy (planned). Currently email-based credits.
- Credits: 5 free, email developer for more (no paywall modal)
- Share: 6-char invite code + mandatory login (viral loop)
- Chat: context-aware with live itinerary in system prompt
- IATA: 200+ city lookup (not city[:3].upper())
- PDF: Enhanced with maps links, packing, phrases, visa banner
- Onboarding: WelcomeTour (home) + PlanTour (/plan/demo) + replay from profile
- Brand color: Sunset Orange #F97316
- Dark bg: #0F172A with subtle radial gradient

---

## 🚫 UI Anti-Slop Rules

### NEVER
- Purple/blue gradients — our brand is sunset orange
- Glassmorphism on everything — 30% of elevated elements max
- Equal padding everywhere — create hierarchy
- Every button primary — use ghost, outline, subtle variants
- Drop shadow on every card — most need only border
- Inter/Roboto/Arial fonts — DM Sans only
- Linear easing — use ease-out or framer-motion springs
- Centered body text — left-align, center only for heroes
- 300ms on everything — button press 100ms, layout 200ms

### ALWAYS
- ONE dominant element per section (largest, boldest, or most colorful)
- More space between sections than within
- Content max-w-md or max-w-lg, centered
- Brand orange as accent (10-15% of UI), not flooding
- 44×44px minimum touch targets on mobile
- Active/pressed states on mobile (not hover)
- Skeleton loaders instead of spinners
- 100dvh not 100vh for mobile layouts

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
- ✅ glass: autocomplete dropdowns, prompt box, floating bars, modals, map overlays
- ❌ solid: regular cards, list items, sidebar, topbar, form containers

---

## What NOT To Do
- ❌ No SCSS, no CSS Modules, no .module.scss
- ❌ No style={{}} inline props
- ❌ No CSS-in-JS (styled-components, emotion)
- ❌ No UI libraries (MUI, Chakra, shadcn)
- ❌ No external placeholder images — use emoji or colored divs
- ❌ No backend work until asked
- ❌ No purple gradients, no generic blue/white themes
- ❌ Don't modify PROJECT_SPEC.md or MWEB_UI_SPEC.md
