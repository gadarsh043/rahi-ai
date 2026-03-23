# Rahify — PROJECT SPEC
### AI-Powered Travel Planning Platform
**Version:** 4.2 — Post-Deployment
**Last Updated:** March 23, 2026
**Author:** Solo Developer (AI-assisted)
**Domain:** rahify.com (live)

---

## Table of Contents
1. [Product Vision](#1-product-vision)
2. [Feature Roadmap (MVP → V2 → V3 → V4 → V5)](#2-feature-roadmap)
3. [Tech Stack](#3-tech-stack)
4. [Architecture Overview](#4-architecture-overview)
5. [Core Generation Flow](#5-core-generation-flow)
6. [Database Schema](#6-database-schema)
7. [API Contracts](#7-api-contracts)
8. [Page-by-Page UI Spec](#8-page-by-page-ui-spec)
9. [Color System & Design Tokens](#9-color-system--design-tokens)
10. [AI Prompt Strategy](#10-ai-prompt-strategy)
11. [Monetization](#11-monetization)
12. [Milestone Breakdown](#12-milestone-breakdown)
13. [External APIs & Costs](#13-external-apis--costs)
14. [Folder Structure](#14-folder-structure)
15. [Styling Architecture (Tailwind CSS v4)](#15-styling-architecture-tailwind-css)
16. [Testing & Dev Environment](#16-testing--dev-environment)
17. [Pro Tool Shortcuts](#17-pro-tool-shortcuts)
18. [V2-V5 Feature Backlog](#18-v2-v5-feature-backlog)
19. [Decision Log](#19-decision-log)

---

## 1. Product Vision

**One-liner:** Enter trip details conversationally → get personalized itineraries with real places, real flights, cost quotes, and a downloadable trip document — all in one flow.

**Core Differentiator:** Approach A — Google Places data is fetched FIRST, then AI builds itineraries from verified, real places only. Zero hallucination. Real photos, ratings, and links from second one.

**Monetization:** Credits (5 free trips one-time → paywall) + Affiliate links. No ads. Ever.

---

## 2. Feature Roadmap

### 🟢 MVP (Weeks 1-8 — LAUNCH)

| # | Feature | Priority |
|---|---------|----------|
| 1 | **Auth — Google OAuth Only** via Supabase. No email/password. Home page is public. Login required only when user clicks "Generate." | P0 |
| 2 | **Home Page — Conversational Trip Input (PUBLIC).** Sequential selectors: origin, dest, dates/flexibility, duration, pace (emoji cards), budget vibe ($/$$/$$$/$$$$), preferences (15 pill toggles), accommodation, passport (country autocomplete), free-text instructions. Each auto-fills prompt. No login wall — new users explore freely. | P0 |
| 3 | **AI Itinerary Generation on `/plan/:id`.** Approach A: fetch real places first → feed to AI → stream day-by-day itinerary. Progressive loading UX. | P0 |
| 4 | **Plan View — Split Panel.** Content LEFT (~55%), Google Map RIGHT (~45%). Tab-based navigation. Three modes in one component: `editing` / `shared` / `saved`. | P0 |
| 5 | **Tab: Where to Eat.** Cards: photo, name, rating, price level, 2-3 line description, "Famous for: {dish}", Google Maps link, affiliate link. | P0 |
| 6 | **Tab: Where to Stay.** Cards: photo, name, rating, price/night, amenities. Filter by type. Booking.com affiliate. | P0 |
| 7 | **Tab: Places to Go.** Cards: photo, name, rating, category, 2-3 line description, "Famous for: {reason}", visit duration, Google Maps link, GetYourGuide affiliate. | P0 |
| 8 | **Tab: About Your Trip.** Day-by-day vertical timeline. Streamed narrative + structured activities with times, places, transport between stops. | P0 |
| 9 | **Tab: Costs & Spending.** Estimated during planning, final on "My Trip." Breakdown: accommodation, food, activities, transport, daily avg, total, per-person. Currency selector (searchable dropdown, common currencies pinned top). | P0 |
| 10 | **Tab: What's Next.** Visa info, passport validity, booking priority, document checklist (checkboxes). **Travel Essentials:** emergency numbers, tipping, power plugs, SIM advice, water safety, timezone, currency info. Credit card reference (hardcoded top 10, checkbox → static tips). | P0 |
| 11 | **Tab: Flight/Travel Details.** AI decides transport mode. Flights via SerpAPI (cached, 10-min refresh cooldown). FlightCard displays per-person and total price for groups > 1. Custom header: "Flights" + [Round trip/One way] + pill-based date pickers + Search. Route + freshness + Refresh on subtitle row. Best/Cheapest/Fastest badges. Deep links: Skyscanner (round-trip URLs) + Google Flights (natural language query). Date defaults: depart=tripStart-1, return=tripEnd. Bounds: Out=max(today,tripStart-5)→tripStart-1, Return=tripEnd→tripEnd+4. Backend refresh-flights accepts custom dates. | P0 |
| 12 | **Interactive Map (Leaflet + OSM).** Right panel. Color-coded markers (🔴eat, 🔵stay, 🟢go, 🟡activity, 🟠cafe, 🩵outdoor). Click → popup. Route polylines on trip tab, flight arc on flight tab. MapMessageCard overlay for geocode fallback (10s countdown → auto-open Google Maps). Temporary markers via mapMessage state. Mobile: full-screen overlay toggled by floating map button. | P0 |
| 13 | **AI Chatbot.** Text input + Send button only. Modify current itinerary. Context-aware to current plan. | P0 |
| 14 | **"Let's Pick" Button.** Opens fullscreen popup: all fetched places by category. Pre-selected = in itinerary. Uncheck to remove, check to add. Google links. "Add Custom" → paste URL + label → AI adjusts. "Let's Pick" and chat are independent actions. | P0 |
| 15 | **Sidebar (Overlay Drawer).** Floating ☰ button (left edge, logged-in only) triggers overlay drawer (280px) with Home, New Trip, Recent Chats, Saved Trips. No collapsed rail. Same overlay on mobile + desktop. Re-fetches plans on open. | P0 |
| 16 | **Existing Plans.** Auto-save every trip. Sidebar lists all trips. Click to reopen `/plan/:id`, continue chat. Badges: "Planning" (orange), "Going ✈️" (green). | P0 |
| 17 | **"My Trip" Page `/trip/:id`.** "Save as My Trip" freezes itinerary. Same PlanView in `saved` mode. PDF download, share code, affiliate links, checklist. Shareable via `?shared=CODE`. | P0 |
| 18 | **Downloadable PDF** (on My Trip only). Itinerary, costs, visa, Travel Essentials (language, emergency, SIM, tips, plugs, timezone, water). | P0 |
| 19 | **Dark/Light Mode.** Visible sun/moon icon in topbar. Persistent via localStorage. | P0 |
| 20 | **Responsive Web + mWeb.** Built together with Tailwind responsive utilities. Native app = later. Currently feature-gated on mobile screens (< 768px) with a `MobileGate` showing "Coming Soon". | P0 |
| 21 | **Onboarding Tutorial.** Custom tour system (TourOverlay, TourPrompt, TourMenu, tourRegistry, tourStore) with brand-styled tooltips. Persisted to localStorage + profile. Home-only tour works for logged-out users; full flow (home → form → plan) runs for logged-in users. Replay from profile dropdown "Replay Tour". | P0 |
| 22 | **SEO Explore Pages.** Public `/explore` gallery and `/explore/:slug` destination landing pages (starting with Paris) backed by static content (`exploreDestinations.js`), optimized meta tags, and structured data for search. | P1 |
| 23 | **Share Trip (Read-Only).** 6-char invite code. Same `/plan/:id?shared=CODE` in read-only mode. Viewer submits suggestions. Viewer can fork. Owner sees suggestion badges per trip (in sidebar + plan header). | P1 |
| 24 | **Entry Rules & Document Checklist.** Part of "What's Next" tab. Based on passport + destination. | P1 |
| 25 | **Currency Selector.** Searchable dropdown. Settings + plan view header. Common currencies (USD, EUR, GBP, INR, AED) pinned top, then alphabetical. Default from passport country. | P1 |
| 26 | **"Right Now" Button.** TopBar button, opens modal overlay. Browser geolocation → Google Places Nearby → 3 filter tabs: 🍽Eat, 📍Go, 🏠Stay. "Open now" filtered. Standalone, not connected to any trip. | P1 |
| 27 | **Credits System.** 5 free trips (one-time, never renews). At 0 → modal with plan cards → Stripe Checkout (India). | P1 |
| 28 | **Travel Quiz.** Profile dropdown item. Short quiz. Results stored, pre-fill preferences. Optional. | P1 |

---

## 3. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React 18 + Vite | Fast, ecosystem |
| **Routing** | React Router v6 | Standard |
| **Styling** | **Tailwind CSS v4** (@tailwindcss/vite plugin) | Best AI output, utility-first, dark mode built-in|
| **Global Styles** | Tailwind @theme + CSS custom properties in index.css | Design tokens, glass utilities, theme vars |
| **State** | Zustand | Minimal boilerplate |
| **Backend** | Python 3.12 + FastAPI | Async, auto docs, AI ecosystem |
| **Database** | Supabase (PostgreSQL) | Free tier: auth, DB, storage |
| **Auth** | Supabase Auth — **Google OAuth only** | No email/password |
| **AI (Launch)** | Groq (Llama-3.1-8B testing, Llama-3.3-70B production) | $0. Retry on rate limit. |
| **AI (Scale)** | Claude Haiku / Sonnet | Model-agnostic swap |
| **Places** | Google Places API (New) | $200 free/mo |
| **Autocomplete** | Photon (Komoot) | Free, worldwide |
| **Flights** | SerpAPI — **cached, 10-min cooldown** | 100 free/mo |
| **Maps** | Leaflet + OpenStreetMap | Free, no API key |
| **PDF** | ReportLab (Python) | Server-side, Rahify-branded |
| **Payments** | LemonSqueezy (planned). Currently email-based credits | adarsh@rahify.com |
| **Storage** | Supabase Storage | Avatars |
| **Frontend Host** | Netlify | Free, with cache-busting `_headers` |
| **Backend Host** | Railway | $5/mo hobby plan |
| **Domain** | Porkbun (rahify.com) | DNS via Netlify |
| **Onboarding** | Custom tour system (TourOverlay, tourRegistry) | Replaced intro.js |
| **Analytics** | PostHog (posthog-js, PostHog MCP) | Product analytics + session replay |
| **Dates** | react-day-picker | Dark-mode calendar |
| **Animations** | framer-motion | Spring physics, gesture support |
| **Icons** | lucide-react | Clean, consistent icon set for UI/SEO pages |
| **FX Rates** | frankfurter.app | Free ECB rates, 24h cache |

**Monthly Cost at Launch: $0-5**

---

## 4. Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                  FRONTEND (React + Vite)                  │
│                  Tailwind CSS v4 · Zustand                │
│                  Hosted on Netlify                        │
│                                                          │
│  Pages: / | /login | /new | /plan/:id | /trip/:id        │
│         /settings | /explore | /explore/:slug | /roadmap  │
│  Auth: Supabase JS Client (Google OAuth)                 │
│  Sidebar: collapsible, chats + saved trips               │
│  TopBar: Right Now · My Plans · Theme · Profile          │
└──────────────────────────┬───────────────────────────────┘
                           │ HTTPS / SSE
                           ▼
┌──────────────────────────────────────────────────────────┐
│               BACKEND (FastAPI + Python)                  │
│               Hosted on Railway                           │
│                                                          │
│  Services:                                               │
│  ├── LLMService (Groq ↔ Claude, 1-line swap)            │
│  ├── PlacesService (Google Nearby Search)                │
│  ├── FlightService (SerpAPI, 10-min cache)               │
│  ├── GeocodeService (Photon)                             │
│  ├── PDFService (ReportLab)                              │
│  └── StripeService (India, checkout + webhooks)          │
│                                                          │
│  Routes:                                                 │
│  POST /generate (SSE) · POST /chat (SSE)                │
│  POST /pick · GET/POST /plans · POST /plans/:id/share   │
│  POST /plans/:id/suggest · GET /plans/:id/suggestions   │
│  POST /plans/:id/save · GET /plans/:id/pdf              │
│  POST /nearby · POST /credits/checkout                   │
│  POST /webhooks/stripe                                   │
└──────────────────────────┬───────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│                SUPABASE (BaaS)                            │
│   Auth (Google OAuth) │ PostgreSQL │ Storage (PDFs)       │
└──────────────────────────────────────────────────────────┘
```

---

## 5. Core Generation Flow (Approach A — Places First, V2 Pipeline)

```
USER HITS "GENERATE"
         │
    ┌────▼─────────────────────────────┐
    │ PHASE 1: DATA FETCH (3–5s)       │
    │ PARALLEL requests:               │
    │ ├─ Geocode destination (Photon)  │
    │ ├─ Google Places Nearby x5–6:    │
    │ │   restaurants, hotels,         │
    │ │   attractions, nightlife,      │
    │ │   cafes, outdoors              │
    │ └─ Result: ~80–100 real places   │
    └────┬─────────────────────────────┘
         │ Route to /plan/:id
    ┌────▼─────────────────────────────┐
    │ PHASE 2: SKELETON (V2)          │
    │ One fast LLM call:              │
    │  - Day types (arrival/full/     │
    │    rest/day_trip/departure)     │
    │  - Neighborhood focus per day   │
    │  - Rest days + day trips scaled │
    │ Emits SSE: `skeleton`           │
    └────┬─────────────────────────────┘
         │
    ┌────▼─────────────────────────────┐
    │ PHASE 3: CHUNKED ITINERARY (V2) │
    │ 2–4 LLM calls, 4–5 days each:   │
    │  - Uses skeleton + places list  │
    │  - Enforces packed days,        │
    │    timing buffers, 3+ interests │
    │    per full day                 │
    │  - No duplicate place_ids       │
    │  - First chunk returns a        │
    │    narrative string             │
    │ Emits SSE:                      │
    │  - `narrative_chunk` (first)    │
    │  - `itinerary_day` /           │
    │    `itinerary_chunk` as days    │
    │    are generated                │
    └────┬─────────────────────────────┘
         │
    ┌────▼─────────────────────────────┐
    │ PHASE 4: ENRICHMENT (parallel)  │
    │ AFTER itinerary is complete:    │
    │  - Cost: formula-based estimate │
    │    from itinerary + price_level │
    │    (no AI call)                 │
    │  - Transport: existing flight/  │
    │    drive logic                  │
    │  - Essentials: one LLM call     │
    │    using the completed          │
    │    itinerary (visa, weather,    │
    │    per-day dress code,          │
    │    seasonal alerts, checklist)  │
    │  - Save full trip to Supabase   │
    │ Emits SSE:                      │
    │  - `cost_estimate`, `transport` │
    │  - `visa_info`,                 │
    │    `travel_essentials`          │
    │  - `done` (after successful     │
    │    save)                        │
    └──────────────────────────────────┘
         │
         ▼ ALL TABS READY — toast
```

### Flight Cache: `fetched_at` check → if <10 min, serve cached. "Refresh" button disabled until cooldown expires. "Prices as of {time}" label.

---

## 6. Database Schema

```sql
-- =====================
-- PROFILES
-- =====================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  passport_country TEXT,
  travel_preferences TEXT[],
  dietary_restrictions TEXT[],
  disability_needs TEXT[],
  preferred_currency TEXT DEFAULT 'USD',
  budget_vibe TEXT DEFAULT '$$',
  trips_remaining INTEGER DEFAULT 5,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  quiz_completed BOOLEAN DEFAULT FALSE,
  quiz_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- TRIPS
-- =====================
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  origin_city TEXT NOT NULL,
  origin_country TEXT,
  origin_lat DOUBLE PRECISION,
  origin_lng DOUBLE PRECISION,
  destination_city TEXT NOT NULL,
  destination_country TEXT,
  destination_lat DOUBLE PRECISION,
  destination_lng DOUBLE PRECISION,
  start_date DATE,
  end_date DATE,
  num_days INTEGER,
  pace TEXT CHECK (pace IN ('relaxed','moderate','active','intense')),
  budget_vibe TEXT CHECK (budget_vibe IN ('$','$$','$$$','$$$$')),
  accommodation_type TEXT,
  travel_preferences TEXT[],
  instructions TEXT,
  num_travelers INTEGER DEFAULT 1,
  raw_places_data JSONB,
  itinerary JSONB,
  narrative TEXT,
  cost_estimate JSONB,
  transport_mode TEXT,
  transport_data JSONB,
  visa_info JSONB,
  travel_essentials JSONB,
  custom_places JSONB,
  excluded_place_ids TEXT[],
  status TEXT DEFAULT 'planning' CHECK (status IN ('generating','planning','saved')),
  share_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trips_user ON public.trips(user_id);
CREATE INDEX idx_trips_share ON public.trips(share_code) WHERE share_code IS NOT NULL;

-- =====================
-- TRIP PLACES
-- =====================
CREATE TABLE public.trip_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  google_place_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  rating DOUBLE PRECISION,
  price_level INTEGER,
  address TEXT,
  photo_url TEXT,
  google_maps_url TEXT,
  opening_hours JSONB,
  description TEXT,
  famous_for TEXT,
  day_number INTEGER,
  time_slot TEXT,
  visit_duration_minutes INTEGER,
  affiliate_url TEXT,
  affiliate_partner TEXT,
  is_in_itinerary BOOLEAN DEFAULT FALSE,
  is_custom BOOLEAN DEFAULT FALSE,
  custom_url TEXT,
  custom_label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_places_trip ON public.trip_places(trip_id);

-- =====================
-- CHAT MESSAGES
-- =====================
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  itinerary_diff JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_trip ON public.chat_messages(trip_id);

-- =====================
-- TRIP SUGGESTIONS
-- =====================
CREATE TABLE public.trip_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  viewer_name TEXT,
  viewer_email TEXT,
  suggestion_text TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- FLIGHT CACHE
-- =====================
CREATE TABLE public.flight_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_code TEXT NOT NULL,
  destination_code TEXT NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE,
  results JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(origin_code, destination_code, departure_date, return_date)
);

CREATE INDEX idx_flight_lookup ON public.flight_cache(origin_code, destination_code, departure_date);

-- =====================
-- CREDIT PURCHASES
-- =====================
CREATE TABLE public.credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  package_name TEXT NOT NULL,
  credits_purchased INTEGER,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'inr',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- ROW LEVEL SECURITY
-- =====================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "own_trips" ON public.trips FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_chats" ON public.chat_messages FOR ALL
  USING (trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid()));
CREATE POLICY "own_purchases" ON public.credit_purchases FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "read_flights" ON public.flight_cache FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "insert_flights" ON public.flight_cache FOR INSERT WITH CHECK (true);
```

---

## 7. API Contracts

Base URL: `https://api.rahify.com/v1`  
Auth: Supabase JWT in `Authorization: Bearer <token>`

### `POST /generate` — SSE Stream

**Request:**
```json
{
  "origin": { "city": "Hyderabad", "country": "IN", "lat": 17.385, "lng": 78.4867 },
  "destination": { "city": "Dallas", "country": "US", "lat": 32.7767, "lng": -96.797 },
  "start_date": "2026-03-12",
  "end_date": "2026-03-19",
  "num_days": 7,
  "pace": "relaxed",
  "budget_vibe": "$$$",
  "accommodation_type": "hotel",
  "preferences": ["food", "history", "sightseeing", "parks"],
  "passport_country": "IN",
  "instructions": "honeymoon trip, vegetarian",
  "dietary": ["vegetarian"],
  "disability": [],
  "num_travelers": 2,
  "currency": "USD"
}
```

**SSE Events (V2 pipeline):**
```
event: status            → { phase, message }
event: places_preview    → { category, count, preview[] }
event: skeleton          → { skeleton: [...] }  // day types, neighborhoods, notes only
event: narrative_chunk   → { text }
event: itinerary_day     → { day }             // single day as soon as each chunk returns
event: itinerary_chunk   → { days: [...] }     // optional, chunk-level payload
event: transport         → { mode, reasoning, flights[], cached, fetched_at, next_refresh }
event: cost_estimate     → { accommodation, food, activities, transport, total, per_person, daily_avg, label: "estimated" }
event: visa_info         → { required, type, domestic_note?, details?, processing_time?, documents_needed?, warnings? }
event: travel_essentials → { weather, dress_code[], practical, seasonal_alerts[], documents_checklist[] }
event: done              → { trip_id, message }
event: error             → { message, retry: true }
```

### `POST /chat` — SSE Stream
```json
{ "trip_id": "uuid", "message": "Replace Terry Black's with a vegetarian spot" }
```
Events: `message_chunk`, `itinerary_update`, `done`

### `POST /plans/:id/pick` — "Let's Pick" → SSE Stream
```json
{
  "trip_id": "uuid",
  "selected_place_ids": ["ChIJ_1", "ChIJ_2"],
  "removed_place_ids": ["ChIJ_4"],
  "custom_additions": [{ "url": "https://...", "label": "hotel", "name": "Boutique Hotel" }]
}
```
Returns SSE with regenerated itinerary.

### `GET /plans` — List Trips
Returns `{ plans: [{ id, origin_city, destination_city, dates, status, share_code, suggestion_count, created_at }] }`

### `POST /plans/:id/save` — Save as "My Trip"
Sets status=saved. Generates PDF. Returns PDF URL.

### `POST /plans/:id/share` — Generate Share Code
Returns `{ share_code, share_url }`

### `GET /plans/:id?shared=CODE` — Shared View (no auth)
Read-only trip data.

### `POST /plans/:id/suggest` — Submit Suggestion (no auth)
```json
{ "viewer_name": "Priya", "suggestion_text": "Add Perot Museum!" }
```

### `GET /plans/:id/suggestions` — Owner Views Suggestions
Returns list with accept/reject.

### `POST /nearby` — Right Now
```json
{ "lat": 32.77, "lng": -96.79, "categories": ["restaurant","attraction","hotel"], "radius_meters": 2000 }
```

### `GET /plans/:id/pdf` — Download PDF
Binary PDF. Available in all modes (editing + saved). Rahify-branded with trip stats, day-by-day itinerary with Maps links, cost breakdown, places list, visa/documents, pre-trip checklist, packing checklist, phrases, emergency contacts.

### `POST /credits/checkout`
```json
{ "package": "30_credits" }
```
Returns `{ checkout_url }` (Stripe India hosted page).

### `POST /webhooks/stripe` — Stripe Webhook
Handles `checkout.session.completed` → updates `trips_remaining`.

---

## 8. Page-by-Page UI Spec

### Global: TopBar

```
┌─────────────────────────────────────────────────────────┐
│  ☰ Logo "Rahify"          📍Right Now  📋My Plans  🌓  👤 │
│  (hamburger on mobile)                                   │
└─────────────────────────────────────────────────────────┘
```

- **Left:** Logo ("Rahify")
- **Right:** Theme toggle (sun/moon, desktop only) · Profile avatar dropdown (or "Sign In" link for logged-out users)
- Profile dropdown: Replay Tour, Settings, Travel Quiz, Give Feedback, Privacy & Terms, Log Out
- No hamburger in TopBar — sidebar has its own floating trigger

### Global: Sidebar (Overlay Drawer)

**Trigger:** Floating ☰ button on the left edge of the screen (vertically centered). Only visible for logged-in users.

**Drawer (280px, slides from left with scrim):**
```
┌──────────────────────┐
│ 🏠 Home              │
│ [  ✨ New Trip  ]     │  ← prominent button
│                      │
│ Recent Chats         │
│ ├ Hyderabad→Dallas   │  5h ago  [🔔2]
│ ├ NYC→London         │  2d ago
│ └ Tokyo→Kyoto        │  1w ago
│                      │
│ Saved Trips          │
│ ├ Paris Honeymoon ✈️ │
│ └ Bali Adventure ✈️  │
│                      │
│                [◀]   │
└──────────────────────┘
```

- No collapsed rail — just the floating ☰ button when closed
- Same overlay behavior on mobile and desktop
- No settings/credits/theme toggle in sidebar (all in profile dropdown)
- Re-fetches plans on open + route change (stays in sync)
- Each trip card shows suggestion badge count (🔔2) if pending
- Click trip → opens `/plan/:id`

### Page 1: Home Page (`/`) — PUBLIC (no login required)

**Layout:** Full-width main content (no inline sidebar)

**Center Content:** No mode tabs. Pure itinerary-focused conversational input.

**"Join a Trip" link:** Shown on the home hero and in the bottom CTA card as an inline link → compact 6-character code field: "Have an invite code? Join a trip →"

**Interactive Selectors (sequential, one at a time, animate in/out):**

| Step | Selector | Type |
|------|----------|------|
| 1 | Where from? | City autocomplete (Photon) |
| 2 | Where to? | City autocomplete (Photon) |
| 3 | When? | Date range picker OR "I'm flexible" toggle |
| 4 | How long? | Duration slider 1-30 days (if flexible) |
| 5 | Pace? | 4 emoji cards: Relaxed 😎, Moderate 🌿, Active 🤸, Intense 🔥 (single select) |
| 6 | Budget vibe? | 4 cards: $ (Budget), $$ (Comfortable), $$$ (Premium), $$$$ (Luxury) |
| 7 | What are you into? | 15 pill toggles (multi-select): Food & Drinks, Nature, History, Museums, Nightlife, Shopping, Hiking, Beaches, Art, Live Music, Parks, Sightseeing, Adventure, Photography, Local Markets |
| 8 | Where to stay? | 3 cards: Hotel, Hostel, Apartment |
| 9 | Passport country? | Country autocomplete (hardcoded 195 countries) |
| 10 | Anything else? | Free text input (honeymoon, dietary, accessibility) |

Each selection → auto-fills prompt text → selector animates out → next appears.

**Prompt Box (fixed bottom):**
```
┌─────────────────────────────────────────────┐
│ I want a relaxed $$$ honeymoon trip from    │
│ Hyderabad to Dallas, 7 days, Mar 12-19...  │
│                                    [Send ➤] │
└─────────────────────────────────────────────┘
```

**First-time user:** Custom onboarding tour triggers via TourOverlay/TourPrompt. Logged-out users see a home-only tour that never leaves `/` and ends on "Sign in to start planning"; logged-in users get the full cross-page flow (home → form → plan demo).

---

### Page 2: Plan View (`/plan/:id`)

**Three modes, ONE component:**
- `editing` — owner, full AI + chat + "Let's Pick"
- `shared` — viewer via `?shared=CODE`, read-only + suggest + fork
- `saved` — frozen "My Trip" with PDF + booking links (URL: `/trip/:id`)

**Layout:**
```
┌──────┬───────────────────────────┬──────────────────────┐
│      │ Header: "HYD→Dallas 7Day" │ Currency · Share · 👤 │
│ Side │ [Eat][Stay][Go][Flight]   │ [Costs][Trip][Next]≡ │
│ bar  ├───────────────────────────┼──────────────────────┤
│      │                           │                      │
│      │   Tab Content Area        │   Google Map          │
│      │   (scrollable)            │   (full height)      │
│      │                           │   Color-coded markers│
│      │                           │                      │
│      ├───────────────────────────┤                      │
│      │ Chat Input  [Let's Pick]  │                      │
│      │ [Type message...] [Send]  │                      │
└──────┴───────────────────────────┴──────────────────────┘
```

**Header Bar:** Trip title (left) · Scrollable tab pills (center) · Share + PDF + Save buttons (right). Currency selector only in CostsTab.

**Tabs:** 🍽Where to Eat · 🏠Where to Stay · 📍Places to Go · ✈️Flight/Travel · 💰Costs · 📋About Your Trip · ➡️What's Next · (overflow ≡ hamburger for more)

**Chat Input (editing mode only):** Text input + Send button + "Let's Pick" button

**"Let's Pick" Popup (fullscreen modal):**
```
┌─────────────────────────────────────────────┐
│ Your Places                          [Done] │
│                                             │
│ Restaurants  Hotels  Attractions  Cafes     │
│ ┌──────────────────────────────────────┐    │
│ │ ☑ Terry Black's ⭐4.7  [Google↗]   │    │
│ │ ☑ Cosmic Café   ⭐4.5  [Google↗]   │    │
│ │ ☐ Mia's TexMex  ⭐4.3  [Google↗]   │    │
│ └──────────────────────────────────────┘    │
│                                             │
│ + Add Custom Place                          │
│ ┌──────────────────────────────────────┐    │
│ │ URL: [________________]              │    │
│ │ Label: [Hotel ▼]  Name: [________]  │    │
│ │                           [+ Add]    │    │
│ └──────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

**Shared Mode Banner:** "Shared by [Name] · View Only" + "Suggest" input + "Fork this trip" button

**Saved Mode (`/trip/:id`) Additions:** "Download PDF" button · Share button · Affiliate links per item · Checklist
**PDF button** available in all modes (editing + saved), visible on mobile + desktop, ghost button style with loading spinner.

**Suggestion Badge:** 🔔 count in sidebar trip card + in plan header → click opens suggestion list with accept/reject per item

**Map Panel:**
- Color-coded markers by category
- Click marker → popup: name, rating, photo, Google Maps link
- Route line when Flight/Travel tab active
- "Follow the Conversation" toggle (auto-pan to current day's area)

---

### Page 3: Settings (`/settings`)
- Edit: name, avatar, passport, preferences, dietary, disability
- Credits: balance display + "Request more" → email adarsh@rahify.com
- Preferred currency (searchable dropdown)
- Dark/light preference
- Travel Quiz link
- Purchase History

---

### Page 4: Explore Destinations (`/explore` and `/explore/:slug`) — PUBLIC

**Goal:** SEO-friendly destination landing pages that showcase popular cities and feed the main trip planner.

- `/explore` — gallery of enabled destinations (e.g. Paris). Cards feel like magazine covers: large hero image/gradient, city + country, budget pill, subtle hover zoom, staggered heights.
- `/explore/:slug` — destination detail page (static content for now, powered by `exploreDestinations.js`):
  - Cinematic hero (image or brand gradient) with big city title and subtitle.
  - Quick stats bar: Best time, Language, Currency, Budget, Flight from India, Visa (using lucide-react icons).
  - 2–4 paragraphs describing “Why {City}?”, max-width centered for a travel-magazine feel.
  - Standard “What you get with Rahify” grid (timeline, restaurants, hotels, flights, costs, PDF).
  - CTA button: “Plan your {City} trip — it’s free →” which links to `/new?dest=City,Country`.
  - Public and crawlable; meta tags and OG tags are updated on mount to reflect the specific destination.

### Page 5: "Right Now" (modal overlay, triggered from TopBar)
- Browser geolocation prompt
- 3 filter tabs: 🍽 Eat, 📍 Go, 🏠 Stay
- Cards: photo, name, distance, rating, "Open now" badge, Google Maps link
- "AI chat coming soon" label
- V2+: connects to active trip on `/trip/:id`

---

### Page 6: Credits Modal (triggered when trips_remaining = 0)
```
┌─────────────────────────────────────────┐
│ You've used all 5 free trips! 🎉        │
│ Upgrade to keep planning.               │
│                                         │
│ ┌─────────┐ ┌─────────┐ ┌───────────┐  │
│ │ Starter │ │  Pro    │ │ Unlimited │  │
│ │ 30 trips│ │100 trips│ │  ∞/month  │  │
│ │ $5.99   │ │ $12.99  │ │ $19.99/mo │  │
│ │ [Buy]   │ │ [Buy]   │ │  [Buy]    │  │
│ └─────────┘ └─────────┘ └───────────┘  │
└─────────────────────────────────────────┘
```

---

### Page 7: Roadmap (`/roadmap`) — PUBLIC

**Access:** URL-only (`/roadmap`). No navigation entry point — discoverable by link or direct URL.

**Layout:** Single scrollable page. Hero + four zones connected by a zigzag SVG path.

**Zones (top to bottom):**
- **🚀 Shipped** — completed features. Muted cards with green checkmark badge, "Shipped {date}" label.
- **🔨 Building Now** — in-progress features. Orange-bordered cards with pulsing dot, glowing path section.
- **💡 Up Next** — planned features. Normal cards with heart button + count. Login required to vote.
- **🔮 Exploring** — ideas under consideration. Faded cards with hearts. No connecting path (cards float).

**Path:** One continuous dashed orange SVG path from Shipped through Building through Up Next. Path fades before Exploring. Computed from real card positions via `useRef` + `ResizeObserver`, not hardcoded. On mobile, replaced by a subtle vertical dashed line.

**Hearts:** Toggle per feature per user. Stored in localStorage (key: `rahify-roadmap-hearts`). Future: Supabase `roadmap_hearts` table with `UNIQUE(feature_id, user_id)`.

**Data:** Static `src/data/roadmapFeatures.js`. Updated as part of the Iteration Learning Protocol after every feature ship.

**No dates** on upcoming features. No version numbers. No pricing/payment features shown.

---

## 9. Color System & Design Tokens

### Brand: Sunset Orange 🧡

Design tokens live in `frontend/src/index.css`:

- Brand palette uses Tailwind’s `brand-*` theme variables (e.g. `brand-500 = #F97316`).
- Light/dark surfaces and text use CSS vars (`--bg`, `--surface`, `--border`, `--text-primary`, etc.) with dark mode controlled by `.dark` on `<html>`.
- Components consume tokens via Tailwind utility classes, e.g. `bg-[var(--surface)]`, `text-[var(--text-primary)]`, `border-[var(--border)]`.

---

## 10. AI Prompt Strategy

### Model-Agnostic Wrapper

```python
# app/services/llm_service.py
class LLMService:
    def __init__(self, provider: str = "groq"):
        self.provider = provider

    async def generate(self, system: str, user: str, max_tokens: int) -> str:
        # Single-call helper used by skeleton/chunk/essentials prompts
        ...

    async def generate_itinerary_stream(self, places, params) -> AsyncGenerator:
        """
        High-level generator used by /generate:
        - Phase 0: skeleton (1 call)
        - Phase 1-N: chunks (2–4 calls)
        - Phase 3: essentials (1 call)
        Yields structured events that the route turns into SSE.
        """
        ...

    async def chat_response(self, context, message, history) -> AsyncGenerator:
        ...
```

### Prompt Files (V2)

Prompts now live in dedicated Python modules so they can be imported and tested directly:

- `app/prompts/itinerary_v2.py`
  - `SKELETON_SYSTEM`
  - `build_skeleton_prompt(params)`
  - `CHUNK_SYSTEM`
  - `build_chunk_prompt(places_text, params, skeleton, chunk_days, context_handoff)`
  - `build_context_handoff(generated_days, places_used)`
  - `get_chunks(num_days, chunk_size=5)`
- `app/prompts/essentials.py`
  - `ESSENTIALS_SYSTEM`
  - `build_essentials_prompt(params, itinerary_summary)`
  - `build_itinerary_summary(itinerary)`
- `app/prompts/chat.py`
  - `CHAT_SYSTEM` (friend tone, hard group rules, modification JSON diff)
  - `CHAT_USER_TEMPLATE`

### Key V2 Prompt Behaviors

1. **Skeleton**: decides day types (arrival/full/rest/day_trip/departure), neighborhoods, rest-day and day-trip placement based on trip length and travel group. No activities yet.
2. **Chunks**: enforce:
   - Packed days: relaxed=5–6, moderate=6–7, active=8–9 non-food activities per full day.
   - Durations on every activity plus realistic 15–30 minute buffers.
   - At least 3 interest categories per full day; no long runs of the same type.
   - One-use `place_id` across the whole trip; chains deduped at fetch time.
3. **Essentials**: runs after itinerary, using real days/activities to generate:
   - Month- and destination-specific weather.
   - Per-day dress code tied to specific activities.
   - Domestic-travel-aware visa section (or simple “carry valid ID” note).
4. **Chat**: updated to respect the same priority rules (instructions → group → pace → budget → interests) and never adds nightlife for family trips.

---

## 11. Monetization

### Credits (Stripe India)

| Package | Credits | Price (USD) | Price (INR approx) |
|---------|---------|-------------|---------------------|
| Free | 5 trips (one-time, never renews) | $0 | ₹0 |
| Starter | 30 trips | $5.99 | ₹499 |
| Pro | 100 trips | $12.99 | ₹1,099 |
| Unlimited Monthly | ∞ | $19.99/mo | ₹1,699/mo |

**Stripe India setup:** PAN + Indian bank account. No GST required under ₹20L annual revenue. Payment link via `user_id` in Stripe metadata → webhook → update `trips_remaining`.

### Affiliates

| Partner | Tab | URL Pattern |
|---------|-----|-------------|
| Booking.com | Stay | `booking.com/searchresults.html?ss={name}+{city}&aid=XXXX` |
| Skyscanner | Flight | `skyscanner.com/transport/flights/{orig}/{dest}/{date}?associateId=XXXX` |
| GetYourGuide | Places | `getyourguide.com/s/?q={activity}+{city}&partner_id=XXXX` |
| RentalCars.com | Transport | `rentalcars.com/search?location={city}&affiliateCode=XXXX` |
| DirectFerries | Transport | Route link with affiliate param |
| Hostelworld | Stay (hostels) | Search URL with affiliate param |
| SafetyWing | What's Next | Referral link |
| Wise | Currency | Referral link |

**Signup now:** Deploy landing page → sign up for Booking.com + Skyscanner (instant/1-2 day approval).

---

## 12. Milestone Breakdown

### Phase 1: Foundation (Week 1-2)
| Task | Days |
|------|------|
| Supabase: tables, RLS, Google OAuth | 1 |
| FastAPI scaffold + Supabase Python client + CORS | 1 |
| React + Vite + Tailwind setup + React Router + Zustand | 1 |
| Tailwind theme tokens + global styles + dark mode system | 0.5 |
| Auth: Google login + protected routes | 1 |
| Profile/Settings page | 1 |
| TopBar component (Right Now, My Plans, Theme, Profile) | 0.5 |
| Collapsible Sidebar (collapsed rail + expanded + mobile drawer) | 1.5 |
| Dark/Light mode (CSS class toggle + localStorage) | 0.5 |
| Onboarding tutorial (intro.js, 5 steps) | 0.5 |
| Landing page (for affiliate signups) | 0.5 |
| Seed script + dev environment setup | 0.5 |

### Phase 2: Core Generation (Week 3-4)
| Task | Days |
|------|------|
| Home page conversational input (all 10 selectors + prompt) | 2.5 |
| Photon city autocomplete component | 0.5 |
| Country autocomplete (hardcoded) | 0.5 |
| Google Places Nearby Search service | 1.5 |
| LLM Service (Groq, model-agnostic wrapper) | 1 |
| `/generate` endpoint (full pipeline, SSE) | 2 |
| Plan View shell (split panel + tabs + sidebar integration) | 1.5 |
| "About Your Trip" tab (streaming + timeline) | 1 |

### Phase 3: Tabs + Map (Week 5-6)
| Task | Days |
|------|------|
| Google Maps embed + color-coded markers + popups | 1.5 |
| Where to Eat tab | 1 |
| Where to Stay tab + type filter | 1 |
| Places to Go tab (2-3 line desc + famous for) | 1 |
| Flight/Travel tab (SerpAPI + cache + modes + affiliates) | 2 |
| Costs & Spending tab + currency selector | 1 |
| What's Next tab (visa + checklist + essentials + CC ref) | 1.5 |

### Phase 4: Chat + Let's Pick + Plans (Week 6-7)
| Task | Days |
|------|------|
| AI Chatbot (modify itinerary, `/chat`, context) | 2.5 |
| Chat UI (messages, streaming, retry) | 1.5 |
| "Let's Pick" popup (categories, select/deselect, custom URL) | 2 |
| `/pick` endpoint (regenerate with selections) | 1 |
| Existing Plans in sidebar + auto-save + continue chat | 1.5 |

### Phase 5: Share + My Trip + PDF (Week 7-8)
| Task | Days |
|------|------|
| "Save as My Trip" (freeze, saved mode, `/trip/:id`) | 1 |
| Share code + shared read-only mode (`?shared=CODE`) | 1.5 |
| Suggestions (submit + owner view + accept/reject + badges) | 1 |
| Fork trip (viewer → own trip) | 1 |
| PDF generation (itinerary + costs + essentials) | 2 |
| "Right Now" modal (geolocation + nearby + 3 tabs) | 1 |

### Phase 6: Monetization + Polish (Week 8+)
| Task | Days |
|------|------|
| Credits system (counter + check at 0 + modal) | 0.5 |
| Stripe India + webhook + plans modal | 1.5 |
| Affiliate links on all buttons | 1 |
| Travel Quiz | 1 |
| "Join Trip" entry (invite code input on home) | 0.5 |
| Loading states, error handling, retry, toasts | 1 |
| Mobile responsive polish (Tailwind responsive utilities) | 1 |
| SEO (meta tags, OG images, sitemap, robots.txt, structured data) | 0.5 |

---

## 13. External APIs & Costs

| API | Free Tier | Monthly Cost |
|-----|-----------|-------------|
| Groq (Llama 3 70B) | Free, rate-limited | $0 |
| Google Places (New) | $200 credit/mo | $0 |
| Google Maps JS | In $200 credit | $0 |
| Photon (Komoot) | Unlimited free | $0 |
| SerpAPI | 100 free/mo (cached) | $0 |
| Supabase | Free tier | $0 |
| Vercel | Free tier | $0 |
| Railway | Free → $5/mo | $0-5 |
| Stripe India | 2% + ₹2/txn | $0 until revenue |
| PostHog Cloud | Generous free tier | $0 (analytics + session replay) |
| **TOTAL** | | **$0-5** |

---

## 14. Folder Structure

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
│   │   ├── sitemap.xml            ← static sitemap (/, /login, /explore, /explore/paris)
│   │   └── robots.txt             ← crawl rules (blocks /plan, /trip, /new, etc.)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/            ← Button, Modal, Toast, Dropdown, Badge, Loader, CurrencySelector
│   │   │   ├── layout/            ← TopBar, Sidebar, BottomNav, ThemeToggle, ProfileDropdown
│   │   │   ├── auth/              ← GoogleLoginButton, ProtectedRoute
│   │   │   ├── onboarding/        ← TourOverlay, TourMenu, TourPrompt, tourRegistry
│   │   │   ├── home/              ← CityAutocomplete, DatePicker, PaceSelector, PromptBox, JoinTrip, etc.
│   │   │   ├── plan/              ← PlanView, PlanHeader, TabBar, ActionBar, MapPanel (+ MapMessageCard),
│   │   │   │                         ChatDrawer, LetsPickPopup, PlaceCard, FlightCard, SharedBanner,
│   │   │   │                         LazySection, SuggestionsBadge, tabs/
│   │   │   ├── nearby/            ← NearbyModal
│   │   │   ├── credits/           ← CreditsExhausted
│   │   │   └── profile/           ← ProfileForm
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── PlanPage.jsx       ← handles /plan/:id, /plan/demo, /trip/:id
│   │   │   ├── SettingsPage.jsx
│   │   │   ├── AuthPage.jsx
│   │   │   ├── ExplorePage.jsx              ← /explore gallery
│   │   │   └── ExploreDestinationPage.jsx   ← /explore/:slug landing pages
│   │   ├── hooks/
│   │   ├── stores/                ← authStore, tripStore, uiStore, tourStore
│   │   ├── services/              ← api.js, supabase.js, posthog.js
│   │   ├── utils/                 ← constants.js, formatCurrency.js, countries.js, affiliateLinks.js
│   │   ├── data/
│   │   │   └── exploreDestinations.js
│   │   ├── index.css              ← Tailwind imports + @theme + glass utilities
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── dependencies.py
│   │   ├── routes/
│   │   │   ├── generate.py
│   │   │   ├── chat.py
│   │   │   ├── plans.py
│   │   │   ├── pick.py
│   │   │   ├── nearby.py
│   │   │   ├── user.py
│   │   │   └── webhooks.py
│   │   ├── services/
│   │   │   ├── llm_service.py
│   │   │   ├── places_service.py
│   │   │   ├── flight_service.py
│   │   │   ├── geocode_service.py
│   │   │   ├── pdf_service.py
│   │   │   ├── cost_service.py
│   │   │   ├── visa_service.py
│   │   │   └── essentials_service.py
│   │   ├── prompts/
│   │   │   ├── itinerary.py
│   │   │   ├── chat.py
│   │   │   └── essentials.py
│   │   └── utils/
│   │       ├── supabase_client.py
│   │       ├── iata_codes.py
│   │       ├── distance.py
│   │       └── cache.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
│
├── docs/
│   ├── PROJECT_SPEC.md
│   └── PROMPTS.md
│
├── package.json          ← root helper (npm run dev starts frontend + backend)
├── .gitignore
└── README.md
```

---

## 15. Styling Architecture (Tailwind CSS v4)

Rahify’s frontend uses **Tailwind CSS v4** (no CSS Modules, no inline `style={{}}`) with:

- `@tailwindcss/vite` configured in `vite.config.js`.
- A single `index.css` that:
  - Imports Tailwind.
  - Defines the design tokens via `@theme` (brand colors, semantic colors, map marker colors, layout constants, typography fonts).
  - Defines light/dark theme variables on `:root` and `.dark`.
  - Adds custom utilities like `glass`, `glass-dark`, `glass-strong`, `glass-strong-dark`, and `shadow-brand`.
- Components styled exclusively with Tailwind utility classes using theme variables (e.g. `bg-[var(--surface)]`, `text-[var(--text-primary)]`, `border-[var(--border)]`).
- Typography and spacing patterns (Hero, Section, Card, Body, Caption, Label) implemented via Tailwind classes described in `CLAUDE.md`.

---

## 16. Testing & Dev Environment

### `.env.development`
```
ENV=development
DEV_USER_ID=test-user-uuid-123
DEV_USER_EMAIL=test@gmail.com
GROQ_API_KEY=gsk_xxxxx
LLM_PROVIDER=groq
GOOGLE_PLACES_API_KEY=AIza_xxxxx
GOOGLE_MAPS_API_KEY=AIza_xxxxx
SERPAPI_KEY=xxxxx
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ_xxxxx
SUPABASE_SERVICE_KEY=eyJ_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
```

### Testing Approaches

| What | How |
|------|-----|
| Backend endpoints | `http://localhost:8000/docs` (FastAPI Swagger) |
| Frontend with fake data | `python scripts/seed.py` → pre-loaded trip |
| Mobile testing | `ngrok http 5173` → test on phone |
| AI prompts | Copy from `PROMPTS.md` → paste in Groq Playground |
| Auth bypass (dev) | `ENV=development` → auto-login as test user |
| Stripe test | Use `sk_test_` key → test card `4242 4242 4242 4242` |

### Seed Script
```bash
python scripts/seed.py --user test@gmail.com --trip "dallas_7day"
# Creates complete trip with places, itinerary, flights, chat history
# Prints: "Open http://localhost:5173/plan/{uuid}"
```

---

## 17. Pro Tool Shortcuts

| Phase | Tool | Time Saved |
|-------|------|-----------|
| UI Design | Figma + Stitch AI | 2-3 days |
| Component gen | v0.dev (convert to Tailwind patterns after) | 2-3 days |
| Auth | Supabase Google OAuth | 3-4 days |
| DB | Supabase dashboard | 2 days |
| API Docs | FastAPI /docs auto | 1 day |
| Coding | Cursor + Claude (feed this spec) | 40%+ faster |
| Onboarding | intro.js library | 1 day |
| PDF | ReportLab | 1 day |
| Deploy | Railway (git push = deploy) | 1 day |
| Payments | Stripe Checkout (hosted) | 2 days |

---

## 18. V2-V5 Feature Backlog

### V2 — 100+ Paying Users (~Month 3-4)
Deep Planning multi-turn, Group editing, Voting, Voice commands, Evolving trip plans, Smart decision helper, "Find cheaper," Mood-based, Coupon codes, Flexible dates, Flight preferences, Walking comfort, Hotel style choices.

### V3 — 1,000+ Users (~Month 5-7)
Community platform, User guides, Trip Wallet, Crowdsourced tips, Local experiences, Sponsored placements, Dynamic pricing, Behavior analytics/ML, Refund center, Budget suggester, Auto budget split, Loyalty program, Social media data, Real-time alerts.

### V4 — 5,000+ Users (~Month 8-12)
Travel matchmaking, One-click group collab, Smart booking assistant, Booking bot, Trip monitoring, Splitwise expenses, iOS app, Android app, Health/fitness integration, Location-based recs.

### V5 — 10,000+ Users / Post-Funding (~Month 12+)
AR previews, Automated booking engine, AI micro-experiences, Multi-destination planner, Support bot, White-label API, Group preference ML.

---

## 19. Decision Log

| Decision | Date |
|----------|------|
| Google OAuth only (no email/password) | Feb 26 |
| Tailwind CSS v4 (no CSS Modules, no inline CSS) | Feb 26 |
| Left collapsible sidebar for chats + plans | Feb 26 |
| TopBar: Right Now · My Plans · Theme · Profile | Feb 26 |
| No floating action buttons | Feb 26 |
| Onboarding: 5-step intro.js spotlight tour | Feb 26 |
| Color: Sunset Orange #F97316 brand, #0F172A dark bg | Feb 26 |
| Pricing: 5 free, 30/$5.99, 100/$12.99, ∞/$19.99/mo | Feb 26 |
| Stripe India (PAN + bank, no GST under ₹20L) | Feb 26 |
| Credits: one-time 5 free, never renews | Feb 26 |
| "Let's Pick" + chat are independent actions | Feb 26 |
| Suggestions scoped per trip, badge in sidebar + header | Feb 26 |
| Right Now: topbar only, modal overlay, standalone | Feb 26 |
| My Plans: visible in topbar | Feb 26 |
| Plan header: profile avatar on right side | Feb 26 |
| Currency: searchable dropdown, common pinned top | Feb 26 |
| Saved mode = `/trip/:id` (same PlanView, `saved` mode) | Feb 26 |
| My Trip shareable via same `?shared=CODE` | Feb 26 |
| Approach A (Places First → AI) | Feb 25 |
| Groq free → Claude when earning | Feb 25 |
| No booking engine (affiliates only) | Feb 25 |
| AI decides transport mode | Feb 25 |
| Progressive loading UX | Feb 25 |
| Budget vibe ($-$$$$) not numbers | Feb 25 |
| Flight cache: 10-min cooldown | Feb 25 |
| No Google Ads, ever | Feb 25 |
| Badges: "Planning" (orange) / "Going ✈️" (green) | Feb 25 |
| Sidebar: overlay drawer only (no collapsed rail), floating button | Mar 1 |
| Flight tab: custom header with pill-based DatePillPicker, not native date inputs | Mar 7 |
| Flight badges: Best/Cheapest/Fastest from SerpAPI tag + computed | Mar 7 |
| Flight deep links: Skyscanner round-trip URLs + Google Flights natural language | Mar 7 |
| Flight date defaults: depart=tripStart-1, return=tripEnd, smart bounds | Mar 7 |
| Map: MapMessageCard for geocode fallback (countdown + auto-open Google Maps) | Mar 7 |
| Map: focusPlace for existing places, setMapMessage for temporary/geocoded | Mar 7 |
| LazySection: hideHeader prop for tabs with custom headers (flight tab) | Mar 7 |
| useScrollSpy: getBoundingClientRect not offsetTop for accurate tab highlight | Mar 7 |
| normalizeTrip: must map every API field explicitly (transportMode, transportData) | Mar 7 |
| Analytics: use PostHog JS SDK + MCP, with app-wide event tracking; disable PostHog in Vite dev and when key missing | Mar 8 |
| Onboarding: home-only tour for logged-out users; full home→form→plan tour only when logged in; TourPrompt/Replay Tour choose flow based on auth | Mar 8 |
| Generation error UX: only emit `done` SSE after successful Supabase save; on save error, emit `error` and show full-screen retry overlay instead of subtle inline button | Mar 8 |
| Suggestions safety: skip Supabase suggestions for non-UUID trip IDs like `demo`, return empty list from backend to avoid 500s | Mar 8 |
| SEO foundation: static sitemap.xml + robots.txt, site-wide meta tags (OG/Twitter), JSON-LD (WebApplication + Organization), and noscript fallback in index.html | Mar 9 |
| SEO explore pages: public `/explore` gallery and `/explore/:slug` (starting with Paris), backed by `exploreDestinations.js` and dynamic per-page meta tags | Mar 9 |

---

*This is a living document. Update after every major decision.*
