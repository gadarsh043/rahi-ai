# 📱 Rahify — Mobile Web (mWeb) UI Spec
### Native-Feeling PWA → Capacitor App Pipeline
**Version:** 2.0
**Last Updated:** March 8, 2026
**Status:** Live at rahify.com (responsive from Day 1)

---

## Table of Contents
1. [Strategy — PWA Now, Capacitor Later](#1-strategy)
2. [Breakpoint System & Layout Rules](#2-breakpoints)
3. [Navigation Architecture — Mobile](#3-navigation)
4. [Page-by-Page Mobile Spec](#4-pages)
5. [Component-by-Component Mobile Behavior](#5-components)
6. [Gesture & Interaction Patterns](#6-gestures)
7. [Mobile-Specific SCSS Patterns](#7-scss)
8. [PWA Configuration](#8-pwa)
9. [Capacitor Wrap (V3/V4)](#9-capacitor)
10. [Performance Targets](#10-performance)
11. [Mobile Testing Checklist](#11-testing)

---

## 1. Strategy — PWA Now, Capacitor Later

### Timeline

```
MVP (Now)          V2 (Month 3)        V3/V4 (Month 6+)
─────────────      ──────────────      ─────────────────
PWA                PWA + Push          Capacitor Wrap
manifest.json      Notifications       → App Store
service worker     Offline mode        → Play Store
Add to Home        Background sync     Native APIs
                                       (camera, haptics)
```

### Why This Order
- **PWA costs $0** and takes 2 hours to set up
- Users get app-like experience immediately via "Add to Home Screen"
- **Capacitor wraps your exact React code** — not a rewrite, just a shell
- When you wrap with Capacitor, 95% of your code is unchanged
- Only add Capacitor when you need: App Store presence, push notifications on iOS, native camera/biometrics

### What Users See

| Feature | PWA (Now) | Capacitor (V3+) |
|---------|-----------|-----------------|
| Home screen icon | ✅ | ✅ |
| No browser chrome | ✅ (standalone mode) | ✅ |
| Splash screen | ✅ (basic) | ✅ (native) |
| Offline access | ✅ (cached pages) | ✅ |
| Push notifications | ❌ iOS / ✅ Android | ✅ Both |
| App Store listing | ❌ | ✅ |
| Native haptics | ❌ | ✅ |
| Camera access | ✅ (web API) | ✅ (native) |
| Deep links | ✅ (URL-based) | ✅ (app scheme) |

---

## 2. Breakpoint System & Layout Rules

### SCSS Breakpoints (from _variables.scss)

```scss
$mobile:  480px;   // Small phones
$tablet:  768px;   // iPads, large phones landscape
$desktop: 1024px;  // Laptops
$wide:    1280px;  // Large monitors
```

### Layout Behavior by Breakpoint

| Breakpoint | Sidebar | Map | Navigation | Plan Layout |
|------------|---------|-----|------------|-------------|
| **< 480px** (phone) | Hidden (overlay drawer) | Full-screen toggle | Bottom nav bar | Single column, stacked |
| **480-767px** (large phone) | Hidden (overlay drawer) | Full-screen toggle | Bottom nav bar | Single column, stacked |
| **768-1023px** (tablet) | Collapsed rail | Bottom sheet (40%) | Top tabs + bottom nav | Stacked with peek map |
| **1024px+** (desktop) | Collapsible sidebar | Side panel (45%) | Top tabs | Split panel |

### Critical Rule: Mobile-First
Build mobile layout FIRST, then add complexity with `@include tablet`, `@include desktop`. Never the reverse.

```scss
// ✅ CORRECT — mobile first
.container {
  flex-direction: column;  // mobile default
  
  @include desktop {
    flex-direction: row;   // desktop override
  }
}

// ❌ WRONG — desktop first
.container {
  flex-direction: row;
  
  @include mobile {
    flex-direction: column;
  }
}
```

---

## 3. Navigation Architecture — Mobile

### Desktop vs Mobile Navigation

**Desktop:** TopBar (top) + Collapsible Sidebar (left)  
**Mobile:** Slim TopBar (top) + Bottom Navigation Bar (bottom) + Drawer Sidebar (overlay)

### Mobile TopBar (slimmed down)

```
┌─────────────────────────────────────┐
│  Rahify                       👤    │   44px height
└─────────────────────────────────────┘
```

- **Left:** Logo ("Rahify") — links to home
- **Right:** Profile avatar dropdown (or "Sign In" link for logged-out users)
- **No hamburger in topbar** — sidebar has its own floating ☰ button (left edge, vertically centered, logged-in only)
- **Removed from topbar on mobile:** Right Now, My Plans, Theme toggle — these move to bottom nav or profile dropdown

### Bottom Navigation Bar (mobile only)

```
┌──────────────────────────────────────────┐
│                                          │
│   🏠        🔍         📍        📋      │
│  Home    Right Now   New Trip   My Plans │
│                                          │
└──────────────────────────────────────────┘
```

**4 items max** (iOS/Android convention). More than 5 = confusing.

| Icon | Label | Action |
|------|-------|--------|
| 🏠 | Home | Go to `/` |
| 🔍 | Right Now | Open Right Now bottom sheet |
| 📍 | New Trip | Go to `/` with selectors reset (or quick-start) |
| 📋 | My Plans | Open plans list (bottom sheet or page) |

**Theme toggle:** Moves to sidebar drawer menu  
**Active state:** Filled icon + brand color + label visible. Inactive = outline icon + muted.

### Sidebar Drawer (mobile + desktop — same behavior)

Triggered by floating ☰ button (left edge, vertically centered). Only visible for logged-in users. Slides in from LEFT as full-height overlay (85% width, max 320px). Dark scrim behind.

```
┌─────────────────────────┬──────┐
│ 🏠 Home                 │      │
│ [  ✨ New Trip  ]        │ Scrim│
│                         │(dark)│
│  Recent Chats           │      │
│  ├ HYD→Dallas    5h 🔔2 │      │
│  ├ NYC→London    2d     │      │
│  └ Tokyo→Kyoto   1w     │      │
│                         │      │
│  Saved Trips            │      │
│  ├ Paris Honeymoon ✈️   │      │
│  └ Bali Adventure ✈️    │      │
│                    [◀]  │      │
└─────────────────────────┴──────┘
```

**Behavior:**
- Opens on floating ☰ button tap
- Closes on: scrim tap, collapse button, any navigation
- NO settings/credits/theme/logout in sidebar — those live in profile dropdown
- Re-fetches plans on open + route change (stays in sync)
- Smooth slide animation (250ms ease-out)

---

## 4. Page-by-Page Mobile Spec

### Page 1: Home Page — Mobile (PUBLIC — no login required)

**Desktop:** Full-width centered selectors + bottom prompt (sidebar is overlay, not inline)
**Mobile:** Full-screen conversational flow, no sidebar visible
**Auth:** New users can explore the full form. Login required only on "Generate" tap.

```
┌─────────────────────────────┐
│  ☰  Rahify               👤 │  ← slim topbar
├─────────────────────────────┤
│                             │
│     🌍                      │
│   Where are you             │
│   headed?                   │
│                             │
│  ┌─────────────────────┐    │
│  │ Search destination  │    │  ← full-width autocomplete
│  └─────────────────────┘    │
│                             │
│  Popular:                   │
│  [Paris] [Tokyo] [Bali]     │  ← quick-pick chips
│                             │
│                             │
│                             │
│                             │
├─────────────────────────────┤
│ 🏠    🔍     📍     📋      │  ← bottom nav
└─────────────────────────────┘
```

**Selector Flow (mobile-optimized):**

Each selector takes FULL SCREEN as a step. Not inline — feels like onboarding.

```
Step 1: Where from?        Step 2: Where to?
┌───────────────────┐      ┌───────────────────┐
│    ← Back         │      │    ← Back         │
│                   │      │                   │
│  Where are you    │      │  Where do you     │
│  flying from?     │      │  want to go?      │
│                   │      │                   │
│  ┌─────────────┐  │      │  ┌─────────────┐  │
│  │ Hyderabad   │  │      │  │ Dallas      │  │
│  └─────────────┘  │      │  └─────────────┘  │
│                   │      │                   │
│  📍 Use current   │      │  🔥 Trending:     │
│     location      │      │  Paris · Tokyo    │
│                   │      │  Bali · London    │
│                   │      │                   │
│     [Next →]      │      │     [Next →]      │
└───────────────────┘      └───────────────────┘

Step 5: Pace              Step 7: Interests
┌───────────────────┐     ┌───────────────────┐
│    ← Back         │     │    ← Back         │
│                   │     │                   │
│  What's your      │     │  What are you     │
│  travel pace?     │     │  into?            │
│                   │     │                   │
│  ┌──────┐┌──────┐ │     │  ┌──────┐┌──────┐ │
│  │ 😎   ││ 🌿   │ │     │  │ Food ││Nature│ │
│  │Relax ││Moder │ │     │  │  ✓   ││      │ │
│  └──────┘└──────┘ │     │  └──────┘└──────┘ │
│  ┌──────┐┌──────┐ │     │  ┌──────┐┌──────┐ │
│  │ 🤸   ││ 🔥   │ │     │  │Histo ││Music │ │
│  │Active││Inten │ │     │  │  ✓   ││      │ │
│  └──────┘└──────┘ │     │  └──────┘└──────┘ │
│                   │     │  ... (scrollable)  │
│     [Next →]      │     │     [Next →]      │
└───────────────────┘     └───────────────────┘
```

**Progress indicator:** Dot stepper at top (10 dots, filled = completed)

**Prompt Box (mobile):** Fixed at bottom, above bottom nav. Single line that expands on tap.

```
┌─────────────────────────────┐
│ Relaxed $$$ trip HYD→DAL... │
│                     [Send➤] │
├─────────────────────────────┤
│ 🏠    🔍     📍     📋      │
└─────────────────────────────┘
```

**On tap:** Prompt box expands to full-screen editable text area with "Generate" button.

**Join a Trip (invite code):**  
- Below the primary "Plan My Trip" CTA on the home hero and again in the bottom CTA card, show a small inline text link: "Have an invite code? Join a trip →".  
- Tapping it expands an inline 6-character code input + "Join" button (no full-screen modal or scrim), keeping the experience lightweight on mobile.

---

### Page 2: Plan View — Mobile (THE CRITICAL ONE)

This is where desktop's split-panel layout completely transforms.

**Desktop:** Left content (55%) + Right map (45%) side by side  
**Mobile:** Full-width stacked — content with toggle-able map

#### Mobile Plan View Layout

```
┌─────────────────────────────┐
│  ← HYD→Dallas 7D    💱 🔗  │  ← plan header (compact)
├─────────────────────────────┤
│ [Eat][Stay][Go][✈️][💰]≡    │  ← horizontally scrollable tabs
├─────────────────────────────┤
│                             │
│  ┌─────────────────────┐   │
│  │ 📸 Terry Black's    │   │
│  │ ⭐ 4.7 · $$ · BBQ   │   │
│  │ Famous for: brisket  │   │
│  │ [Maps↗] [Book↗]     │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │ 📸 Cosmic Café      │   │
│  │ ⭐ 4.5 · $ · Eclectic│   │
│  └─────────────────────┘   │
│                             │
│        (scrollable)         │
│                             │
├─────────────────────────────┤
│ [💬 Chat    ] [🎯Let's Pick]│  ← sticky bottom action bar
├─────────────────────────────┤
│ 🗺️ Map                      │  ← map toggle (floating or in bar)
└─────────────────────────────┘
```

#### The Map Problem (Mobile) — Solved with Bottom Sheet

On desktop, map is always visible (right panel). On mobile, you can't show both.

**Solution: Floating Map Button + Full-Screen Map with Bottom Sheet**

```
Default View (content):        Map Mode (toggled):
┌───────────────────┐          ┌───────────────────┐
│  Header + Tabs    │          │  Header    [✕ Map] │
├───────────────────┤          ├───────────────────┤
│                   │          │                   │
│  Tab Content      │          │   GOOGLE MAP      │
│  (full width)     │          │   (full screen)   │
│                   │          │   Color markers   │
│                   │          │                   │
│                   │          ├───────────────────┤
│                   │          │ ━━━ (drag handle) │
│                   │          │ Terry Black's ⭐4.7│  ← bottom sheet
│                   │          │ Cosmic Café  ⭐4.5│     (peek mode)
├───────────────────┤          │ (swipe up = full) │
│ [Chat][Let'sPick] │          └───────────────────┘
│       [🗺️ Map]    │
└───────────────────┘
```

**Map Toggle Button:** Floating action button (bottom-right, 56px circle, brand color) with 🗺️ icon. Tapping opens full-screen map overlay.

**Map Bottom Sheet (3 states):**
- **Peek (30%)** — shows 2-3 place cards from current tab, drag handle visible
- **Half (50%)** — scrollable list of all places on map
- **Full (90%)** — full list, map shrinks to mini preview at top
- **Swipe down from peek** → closes map, returns to content

This is the native-app pattern used by Google Maps, Uber, Apple Maps.

#### Tab Bar (Mobile)

Horizontally scrollable pill tabs. Not a dropdown, not stacked.

```
┌─────────────────────────────────────────────────┐
│ [🍽Eat] [🏠Stay] [📍Go] [✈️Flight] [💰Cost] [📋Trip] [➡️Next] │
│  ←── swipe to scroll ──→                        │
└─────────────────────────────────────────────────┘
```

- Active tab: brand color pill, bold text
- Inactive: transparent, secondary text
- First 4 visible by default, scroll to reveal rest
- Optional: swipe LEFT/RIGHT on content area to switch tabs

#### Chat — Mobile

**Not inline.** Opens as a **bottom sheet** (slides up from bottom).

```
Default:                       Chat Open:
┌───────────────────┐          ┌───────────────────┐
│  Plan Content     │          │  Plan Content     │
│                   │          │  (dimmed behind)  │
│                   │          ├───────────────────┤
│                   │          │ ━━━ (drag handle) │
│                   │          │                   │
│                   │          │ 🤖 Sure! I swapped │
│                   │          │ Terry Black's for │
│                   │          │ Kalachandji's...  │
├───────────────────┤          │                   │
│ [💬 Chat   ][🎯]  │          │ 👤 Replace BBQ    │
│       [🗺️]        │          │ with vegetarian   │
└───────────────────┘          ├───────────────────┤
                               │ [Type here...][➤] │
                               └───────────────────┘
```

**Chat bottom sheet states:**
- **Closed** — just the button bar visible
- **Peek (40%)** — shows last 2-3 messages + input
- **Full (85%)** — full chat history, scrollable
- Keyboard pushes sheet up (no content hiding behind keyboard)

#### Let's Pick — Mobile

Full-screen modal (slides up from bottom, covers everything).

```
┌─────────────────────────────┐
│  Your Places          [Done]│
├─────────────────────────────┤
│ [Restaurants][Hotels][Attra]│  ← scrollable category tabs
├─────────────────────────────┤
│                             │
│  ☑ Terry Black's  ⭐4.7 ↗  │
│  ☑ Cosmic Café    ⭐4.5 ↗  │
│  ☐ Mia's TexMex   ⭐4.3 ↗  │
│  ☑ Pepe's Tacos   ⭐4.6 ↗  │
│                             │
│     (scrollable list)       │
│                             │
├─────────────────────────────┤
│  + Add Custom Place         │
│  ┌───────────────────────┐  │
│  │ URL: [_____________]  │  │
│  │ Type: [Hotel ▼]      │  │
│  │ Name: [_____________] │  │
│  │           [+ Add]     │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

---

### Page 3: Settings — Mobile

Full-screen page. Sections in card groups (iOS Settings style).

```
┌─────────────────────────────┐
│  ← Settings                 │
├─────────────────────────────┤
│                             │
│  ┌─────────────────────┐   │
│  │ 👤 Profile           │   │
│  │  Name: Rahify User   │   │
│  │  Passport: India  ▶  │   │
│  │  Currency: INR    ▶  │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │ 🎨 Preferences       │   │
│  │  Dark Mode     [🔘]  │   │
│  │  Dietary       ▶     │   │
│  │  Accessibility ▶     │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │ 💳 Credits: 3 left   │   │
│  │  [Buy More Credits]  │   │
│  │  Purchase History ▶  │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │ 🎯 Travel Quiz    ▶  │   │
│  │ 📝 Feedback       ▶  │   │
│  │ 📄 Privacy/Terms  ▶  │   │
│  │ 🚪 Log Out           │   │
│  └─────────────────────┘   │
│                             │
└─────────────────────────────┘
```

---

### Page 4: Explore Destinations — Mobile (`/explore` and `/explore/:slug`)

**/explore gallery:**
- Full-width page under the slim TopBar (no sidebar).
- Warm cream background (`var(--bg)`) and a simple header: "Explore Destinations" + short subtitle.
- Grid of destination cards:
  - 1 column on small phones, 2 on tablets, 3 on desktop.
  - Cards feel like mini magazine covers: large hero image or brand gradient, big city name, small country label, and a budget pill.
  - Subtle hover/tap feedback: light shadow + tiny image zoom (no wild animations).
  - Tappable area = the whole card; tap → `/explore/{slug}`.

**/explore/:slug detail:**
- Cinematic hero block (image or gradient) with city title + subtitle over a dark gradient.
- Quick stats row under hero (Best time, Language, Currency, Budget, Flight, Visa) laid out as 2×3 grid on phones.
- Content section: 2–4 paragraphs, `max-w-md`/`max-w-lg`, left-aligned — feels like a travel magazine article, not a blog with lots of headings.
- "What you get with Rahify" grid and CTA button identical to desktop, but stacked for mobile with generous spacing.
- CTA button full-width on small screens: "Plan your {city} trip — it’s free →" navigates to `/new?dest=City,Country`.
- Footer stays simple and low-profile at the bottom.

### Page 5: "Right Now" — Mobile

Bottom sheet (not modal). Slides up from bottom nav tap.

```
┌─────────────────────────────┐
│                             │
│  (current screen dimmed)    │
│                             │
├─────────────────────────────┤
│  ━━━ (drag handle)          │
│  📍 Right Now — Near You    │
│                             │
│  [🍽 Eat] [📍 Go] [🏠 Stay] │
│                             │
│  ┌─────────────────────┐   │
│  │ 📸  Cosmic Café      │   │
│  │ ⭐ 4.5 · 0.3mi · Open│   │
│  │ [Directions ↗]       │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │ 📸  Perot Museum     │   │
│  │ ⭐ 4.8 · 1.2mi · Open│   │
│  │ [Directions ↗]       │   │
│  └─────────────────────┘   │
│                             │
└─────────────────────────────┘
```

---

### Page 5: Credits Modal — Mobile

Full-screen bottom sheet. Cards stack vertically (not side-by-side).

```
┌─────────────────────────────┐
│  ━━━                        │
│  You've used all 5 trips! 🎉│
│  Upgrade to keep planning.  │
│                             │
│  ┌─────────────────────┐   │
│  │ ⭐ Starter           │   │
│  │ 30 trips · $5.99     │   │
│  │ $0.20/trip            │   │
│  │      [Buy Now]        │   │ ← highlighted as "Most Popular"
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │ 🚀 Pro               │   │
│  │ 100 trips · $12.99   │   │
│  │ $0.13/trip            │   │
│  │      [Buy Now]        │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │ ♾️ Unlimited Monthly  │   │
│  │ ∞ trips · $19.99/mo  │   │
│  │      [Buy Now]        │   │
│  └─────────────────────┘   │
└─────────────────────────────┘
```

---

## 5. Component-by-Component Mobile Behavior

### Place Cards

**Desktop:** Horizontal (photo left, content right)  
**Mobile:** Vertical (photo top, content below) OR compact horizontal

```scss
// PlaceCard.module.scss
.card {
  display: flex;
  flex-direction: column;           // mobile: stacked
  gap: $space-3;
  padding: $space-3;

  @include desktop {
    flex-direction: row;            // desktop: side by side
    gap: $space-4;
    padding: $space-4;
  }
}

.photo {
  width: 100%;
  height: 160px;                    // mobile: full width banner
  border-radius: $radius-md;
  object-fit: cover;

  @include desktop {
    width: 120px;
    height: 120px;                  // desktop: thumbnail
  }
}
```

**Compact variant (for lists):**
```
┌──────────────────────────┐
│  📸│ Terry Black's  ⭐4.7 │
│    │ $$ · BBQ · 0.3mi    │
│    │ Famous for: brisket  │
└──────────────────────────┘
  60px    rest of width
```

### Flight Cards

**Desktop:** Full detail row
**Mobile:** Compact card with expandable details

Flight tab has custom header (LazySection `hideHeader` used):
```
Row 1: Flights  [Round trip|One way]  [Out Mar 16 ▾] → [Return Mar 22 ▾]  [Search]
Row 2: Dallas → Seattle    Prices as of 5 min ago (Refresh)
```

Date pickers use pill-based `DatePillPicker` dropdown (not native `<input type="date">`).
Date defaults: depart = tripStart-1, return = tripEnd.
Date bounds: Out = max(today, tripStart-5) → tripStart-1. Return = tripEnd → tripEnd+4.

```
Collapsed:                     Expanded (tap):
┌────────────────────────┐     ┌────────────────────────┐
│ [logo] 5:02PM - 9:30PM │     │ [logo] 5:02PM - 9:30PM │
│ AA · AA302 · 4h28m · 1 │     │ AA · AA302 · 4h28m     │
│ stop        $847 [Best]│     │ 1 stop (DOH) · 18h 15m │
└────────────────────────┘     │                        │
                               │ 5:02PM ---- 9:30PM     │
                               │  DFW    4h28m   SEA    │
                               │        1 stop          │
                               │                        │
                               │ Mar 16 · via DOH       │
                               │ 142 kg CO2             │
                               │                        │
                               │ Book on Skyscanner ↗   │
                               └────────────────────────┘
```

Badges: Best (orange), Cheapest (green), Fastest (blue) — computed from SerpAPI tag + price + duration.
Deep links: Skyscanner (round-trip includes return date) + Google Flights (natural language query).

### Timeline (About Your Trip tab)

**Desktop:** Full timeline with left time column  
**Mobile:** Compact timeline, time badges inline

```
Desktop:                       Mobile:
┌─────┬──────────────┐        ┌────────────────────────┐
│     │ Day 1 — Arrival│       │ 📅 Day 1 — Arrival     │
│     │               │        ├────────────────────────┤
│9:00 │ ✈️ Arrive DFW │        │ 9:00  ✈️ Arrive DFW    │
│     │   Terminal E   │        │       Terminal E       │
│     │               │        │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│11:00│ 🏠 Check in    │        │ 11:00 🏠 Check in      │
│     │   Hotel Adolphus│       │       Hotel Adolphus   │
│     │               │        │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│12:30│ 🍽 Lunch       │        │ 12:30 🍽 Lunch         │
│     │   Terry Black's│        │       Terry Black's   │
└─────┴──────────────┘        └────────────────────────┘
```

### Cost Breakdown

**Desktop:** Table/grid layout  
**Mobile:** Stacked cards with progress bars

```
┌─────────────────────────────┐
│  💰 Trip Cost Estimate       │
│  Total: $3,240 (2 people)   │
│  Per person: $1,620         │
├─────────────────────────────┤
│  🏠 Accommodation    $1,400 │
│  ████████████████░░░░  43%  │
│                             │
│  🍽 Food             $560   │
│  ██████░░░░░░░░░░░░░  17%  │
│                             │
│  📍 Activities       $380   │
│  █████░░░░░░░░░░░░░░  12%  │
│                             │
│  ✈️ Flights          $900   │
│  ███████████░░░░░░░░  28%  │
│                             │
│  Daily avg: $463            │
└─────────────────────────────┘
```

### Currency Selector

**Desktop:** Searchable dropdown inline in header  
**Mobile:** Full-screen bottom sheet with search

```
┌─────────────────────────────┐
│  ━━━                        │
│  Select Currency             │
│  ┌─────────────────────┐   │
│  │ 🔍 Search...         │   │
│  └─────────────────────┘   │
│                             │
│  Common                     │
│  ○ USD — US Dollar          │
│  ● INR — Indian Rupee  ✓   │
│  ○ EUR — Euro               │
│  ○ GBP — British Pound     │
│  ○ AED — UAE Dirham         │
│                             │
│  All Currencies             │
│  ○ AUD — Australian Dollar  │
│  ○ BRL — Brazilian Real     │
│  ○ CAD — Canadian Dollar    │
│  ... (scrollable)           │
└─────────────────────────────┘
```

### Shared Banner

```
┌─────────────────────────────┐
│ 👤 Shared by Priya · View Only │
│ [💡 Suggest] [🔀 Fork Trip]  │
└─────────────────────────────┘
```

Full-width, sticky below header. "Suggest" opens bottom sheet input.

### Onboarding Tour — Mobile

**Brand-styled tooltips** (glassmorphism, brand orange accent stripe, gradient buttons). Persisted to localStorage so it only shows once. Replay from profile dropdown "Replay Tour".

**4 steps (not 5 — skip sidebar step on mobile since it's hidden):**

1. **Welcome** → Full-screen welcome card
2. **Selectors** → Spotlight on first question with tooltip
3. **Bottom Nav** → Spotlight on bottom bar
4. **Generate** → Spotlight on prompt box + send button

Use touch-friendly tooltips (larger, positioned above/below element, not overlapping).

Additional behavior:
- Uses the same custom TourOverlay/TourPrompt/TourMenu system as desktop (no intro.js).
- Persisted to localStorage + Supabase profile so it only shows once by default.
- Logged-out users only see a home-only tour that never navigates away from `/` and ends on "Sign in to start planning".
- Logged-in users can get the full cross-page tour: home → form (`/new`) → plan demo (`/plan/demo`) → final step in the profile dropdown.
- TourPrompt on the home page chooses home-only vs full flow based on auth state.
- "Replay Tour" in the profile dropdown always starts the full flow from the home page for logged-in users.

---

## 6. Gesture & Interaction Patterns

### Native-Feeling Gestures to Implement

| Gesture | Where | Action |
|---------|-------|--------|
| **Swipe right from left edge** | Anywhere | Open sidebar drawer |
| **Swipe left on drawer** | Sidebar open | Close sidebar |
| **Swipe left/right on tab content** | Plan View | Switch tabs |
| **Swipe down on bottom sheet** | Any bottom sheet | Collapse / close |
| **Swipe up on bottom sheet handle** | Any bottom sheet | Expand |
| **Pull down on content** | Plan View | Refresh trip data |
| **Long press on place card** | Place lists | Quick action menu (directions, add/remove) |
| **Tap + hold on map marker** | Map view | Preview popup |

### Bottom Sheet Physics

Use `framer-motion` or a lightweight library for natural feel:

```
Sheet snap points:
  - 0%   → Closed (hidden below viewport)
  - 30%  → Peek (handle + preview)
  - 50%  → Half (scrollable content)
  - 85%  → Full (near full-screen)
  - 100% → Never (always show status bar)

Spring config: { damping: 30, stiffness: 300 }
Velocity threshold: 500px/s → snap to next point
```

### Micro-Animations (native feel)

| Element | Animation | Duration |
|---------|-----------|----------|
| Page transitions | Slide left/right (not fade) | 250ms |
| Bottom sheet | Spring physics | 300ms |
| Tab switch | Content crossfade | 150ms |
| Card tap | Scale down to 0.98, release | 100ms |
| Button press | Scale 0.95 + slight darken | 100ms |
| Toast notification | Slide down from top | 200ms |
| Loading skeleton | Shimmer left-to-right | 1.5s loop |
| Place card appear | Fade-up + stagger (50ms each) | 300ms |

### Touch Targets

**Minimum 44×44px** for all tappable elements (Apple HIG). This means:

```scss
// ✅ Mobile-safe button
.button {
  min-height: 44px;
  min-width: 44px;
  padding: $space-3 $space-4;
}

// ✅ Mobile-safe link/icon
.iconButton {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

// ❌ TOO SMALL — will frustrate users
.tinyButton {
  padding: 4px 8px;  // Results in ~28px height
}
```

---

## 7. Mobile-Specific SCSS Patterns

### New Mixins for Mobile (add to `_mixins.scss`)

```scss
// Safe area (notch devices — iPhone X+)
@mixin safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

@mixin safe-area-top {
  padding-top: env(safe-area-inset-top, 0px);
}

// Bottom navigation bar
@mixin bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 100;
  @include safe-area-bottom;
  @include bg-surface;
  border-top: 1px solid $light-border;

  @include dark {
    border-top-color: $dark-border;
  }

  @include desktop {
    display: none;  // hide on desktop
  }
}

// Bottom sheet container
@mixin bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: $light-bg;
  border-radius: $radius-xl $radius-xl 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  z-index: 200;
  @include safe-area-bottom;
  
  @include dark {
    background: $dark-surface;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
  }
}

// Drag handle (top of bottom sheets)
@mixin drag-handle {
  width: 36px;
  height: 4px;
  background: $light-text-muted;
  border-radius: $radius-full;
  margin: $space-2 auto $space-3;

  @include dark {
    background: $dark-text-muted;
  }
}

// Full-screen mobile modal
@mixin mobile-fullscreen {
  @include mobile {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 300;
    border-radius: 0;
  }
}

// Hide on mobile, show on desktop
@mixin desktop-only {
  display: none;
  @include desktop { display: block; }
}

// Show on mobile, hide on desktop
@mixin mobile-only {
  display: block;
  @include desktop { display: none; }
}

// Prevent content shift when keyboard opens
@mixin keyboard-aware {
  @include mobile {
    // Use visual viewport API
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
  }
}

// Tap highlight removal (native feel)
@mixin no-tap-highlight {
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  user-select: none;
}

// Momentum scroll (iOS)
@mixin momentum-scroll {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

// Touch target enforcement
@mixin touch-target {
  min-height: 44px;
  min-width: 44px;
}
```

### Page Layout Pattern — Mobile vs Desktop

```scss
// PlanView.module.scss

.layout {
  display: flex;
  flex-direction: column;        // mobile: stacked
  height: 100vh;
  height: 100dvh;               // dynamic viewport (accounts for mobile browser chrome)

  @include desktop {
    flex-direction: row;          // desktop: side by side
  }
}

.content {
  flex: 1;
  overflow-y: auto;
  @include momentum-scroll;
  padding-bottom: 120px;         // space for bottom nav + action bar

  @include desktop {
    width: $content-panel-width;
    padding-bottom: 0;
  }
}

.mapPanel {
  display: none;                  // mobile: hidden by default

  @include desktop {
    display: block;
    width: $map-panel-width;
    height: 100%;
    position: sticky;
    top: $topbar-height;
  }
}

// Mobile map = full-screen overlay (toggled by button)
.mapOverlay {
  @include mobile-fullscreen;
  display: none;

  &.active {
    display: block;
  }

  @include desktop {
    display: none !important;     // never show overlay on desktop
  }
}

.actionBar {
  position: fixed;
  bottom: 56px;                   // above bottom nav
  left: 0;
  right: 0;
  padding: $space-2 $space-4;
  display: flex;
  gap: $space-2;
  @include bg-surface;
  @include safe-area-bottom;
  border-top: 1px solid $light-border;

  @include desktop {
    position: static;
    border-top: none;
  }
}
```

### Content Padding Safety

```scss
// Account for fixed elements on mobile
.pageContent {
  padding-top: 44px;             // topbar (mobile height)
  padding-bottom: calc(56px + 52px + env(safe-area-inset-bottom));
  // 56px bottom nav + 52px action bar + safe area

  @include desktop {
    padding-top: $topbar-height;
    padding-bottom: 0;
  }
}
```

---

## 8. PWA Configuration

### manifest.json

```json
{
  "name": "Rahify — Travel Planner",
  "short_name": "Rahify",
  "description": "AI-powered travel planning. Real places, real flights, zero hallucination.",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0F172A",
  "theme_color": "#F97316",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/mobile-home.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ],
  "categories": ["travel", "lifestyle"],
  "lang": "en",
  "dir": "ltr"
}
```

### Service Worker (basic — Vite PWA plugin)

```bash
npm install vite-plugin-pwa -D
```

```javascript
// vite.config.js — add to plugins
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        // ... manifest.json contents above
      },
      workbox: {
        // Cache strategy
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.rahify\.com\/v1\//,
            handler: 'NetworkFirst',          // API calls: try network, fall back to cache
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 }, // 1 hour
            },
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',            // Images: serve from cache
            options: {
              cacheName: 'image-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 days
            },
          },
        ],
      },
    }),
  ],
});
```

### Meta Tags (index.html)

```html
<head>
  <!-- PWA -->
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#F97316">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Rahify">
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png">
  
  <!-- Splash screens (iOS) -->
  <link rel="apple-touch-startup-image" href="/splash/splash-1170x2532.png"
        media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)">
  
  <!-- Prevent zoom on input focus (iOS) -->
  <meta name="format-detection" content="telephone=no">
  
  <!-- Safe area CSS -->
  <style>
    :root {
      --sat: env(safe-area-inset-top);
      --sab: env(safe-area-inset-bottom);
      --sal: env(safe-area-inset-left);
      --sar: env(safe-area-inset-right);
    }
  </style>
</head>
```

### viewport-fit=cover

This is CRITICAL for notch devices. Without it, your app won't extend behind the notch, leaving ugly white bars.

### "Add to Home Screen" Prompt

```jsx
// hooks/useInstallPrompt.js
import { useState, useEffect } from 'react';

export function useInstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
    
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === 'accepted') setIsInstalled(true);
    setPrompt(null);
  };

  return { canInstall: !!prompt, isInstalled, install };
}
```

Show install banner after 2nd visit or after first trip generated:
```
┌─────────────────────────────────────┐
│ 📲 Add Rahify to your home screen   ✕│
│    for quick access       [Install] │
└─────────────────────────────────────┘
```

---

## 9. Capacitor Wrap (V3/V4 — When Ready)

### When to Do This

| Signal | Action |
|--------|--------|
| 500+ mobile users | Start Capacitor setup |
| Users asking "is there an app?" | Time to submit to stores |
| Need push notifications on iOS | Capacitor required |
| Need native camera/biometrics | Capacitor required |

### Setup (2 days of work)

```bash
# Install
npm install @capacitor/core @capacitor/cli
npx cap init "Rahify" "com.rahify.app"

# Add platforms
npx cap add ios
npx cap add android

# Build web → copy to native projects
npm run build
npx cap sync

# Open in Xcode / Android Studio
npx cap open ios
npx cap open android
```

### capacitor.config.ts

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rahify.app',
  appName: 'Rahify',
  webDir: 'dist',
  server: {
    // In dev, point to Vite dev server
    url: 'http://localhost:5173',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#0F172A',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0F172A',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
```

### Native APIs You'll Add

| Plugin | What For | When |
|--------|----------|------|
| `@capacitor/push-notifications` | Trip reminders, suggestions | V3 |
| `@capacitor/haptics` | Button feedback, tab switches | V3 |
| `@capacitor/share` | Native share sheet for trips | V3 |
| `@capacitor/camera` | Upload travel photos (V4) | V4 |
| `@capacitor/geolocation` | Better location for Right Now | V3 |
| `@capacitor/app` | Deep links, back button handling | V3 |

### App Store Requirements

| Platform | Fee | Time | Notes |
|----------|-----|------|-------|
| **Apple App Store** | $99/year | 1-2 week review | Need screenshots, privacy policy, DUNS number |
| **Google Play Store** | $25 one-time | 1-3 day review | Need screenshots, privacy policy |

### What Changes in Code: Almost Nothing

```jsx
// Detect if running in Capacitor
import { Capacitor } from '@capacitor/core';

if (Capacitor.isNativePlatform()) {
  // Use native haptics
  import('@capacitor/haptics').then(({ Haptics }) => {
    Haptics.impact({ style: 'light' });
  });
} else {
  // PWA fallback — no haptics, graceful degrade
}
```

Your entire React + SCSS codebase stays the same. Capacitor just wraps it.

---

## 10. Performance Targets — Mobile

| Metric | Target | Why |
|--------|--------|-----|
| **First Contentful Paint** | < 1.5s | Users on 4G expect fast |
| **Largest Contentful Paint** | < 2.5s | Core Web Vital |
| **Time to Interactive** | < 3.0s | Can tap something in 3s |
| **Bundle size (gzipped)** | < 200KB initial | Exclude map + heavy libs from initial |
| **Image loading** | Lazy load all | Only load visible photos |
| **Font loading** | `font-display: swap` | Show content before fonts load |
| **Offline** | Cached shell + last trip | Service worker handles |

### Key Optimizations

```javascript
// Lazy load heavy components
const MapPanel = lazy(() => import('./MapPanel/MapPanel'));
const LetsPickPopup = lazy(() => import('./LetsPickPopup/LetsPickPopup'));
const PDFViewer = lazy(() => import('./PDFViewer'));

// Lazy load Google Maps (only when map tab or button tapped)
const loadGoogleMaps = () => {
  if (!window.google) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${KEY}&libraries=places`;
    document.head.appendChild(script);
  }
};
```

### Image Strategy

```scss
// Use responsive images
.placePhoto {
  // Mobile: smaller images (save bandwidth)
  background-image: url('photo_url&maxwidth=400');
  
  @include desktop {
    // Desktop: larger images
    background-image: url('photo_url&maxwidth=800');
  }
}
```

Google Places Photos API supports `maxwidth` param — use 400px for mobile, 800px for desktop.

---

## 11. Mobile Testing Checklist

### Pre-Launch Mobile QA

**Layout & Responsiveness**
- [ ] 375px width (iPhone SE — smallest common phone)
- [ ] 390px width (iPhone 14/15)
- [ ] 430px width (iPhone 14 Pro Max)
- [ ] 360px width (Android standard)
- [ ] 768px width (iPad portrait)
- [ ] Landscape orientation doesn't break
- [ ] Notch/Dynamic Island doesn't overlap content
- [ ] Bottom nav doesn't overlap home indicator (safe area)

**Interactions**
- [ ] All buttons meet 44×44px touch target
- [ ] Sidebar drawer opens/closes smoothly
- [ ] Bottom sheets snap to correct positions
- [ ] Tab swiping works
- [ ] Map toggle opens/closes correctly
- [ ] Chat bottom sheet keyboard handling
- [ ] No horizontal scroll (content fits viewport)
- [ ] Pull-to-refresh works
- [ ] Scroll momentum feels natural

**Forms & Input**
- [ ] Autocomplete dropdown doesn't go behind keyboard
- [ ] Input focus doesn't zoom page (font-size ≥ 16px on inputs)
- [ ] Date picker works on iOS + Android
- [ ] Country selector searchable on mobile
- [ ] Prompt box doesn't get hidden by keyboard

**Performance**
- [ ] Page loads in < 3s on 4G
- [ ] Images lazy load
- [ ] Map loads only when needed
- [ ] No jank during scroll
- [ ] Smooth page transitions

**PWA**
- [ ] manifest.json valid (test in Chrome DevTools → Application)
- [ ] Service worker registers
- [ ] "Add to Home Screen" prompt works
- [ ] App opens in standalone mode (no browser chrome)
- [ ] Splash screen shows
- [ ] Status bar color matches theme
- [ ] Works offline (shows cached content or graceful error)

**Device Testing**
- [ ] iPhone (Safari) — test PWA install
- [ ] Android (Chrome) — test PWA install
- [ ] iPad (Safari) — tablet layout
- [ ] Low-end Android (performance)

### Testing Method

```bash
# Local mobile testing
ngrok http 5173
# → Copy HTTPS URL → open on phone
# → Can also test PWA install on HTTPS

# Chrome DevTools
# → Toggle device toolbar (Cmd+Shift+M)
# → Test each breakpoint
# → Throttle network to "Fast 3G"
```

---

## Quick Reference: Desktop → Mobile Mapping

| Desktop Component | Mobile Equivalent |
|-------------------|-------------------|
| Sidebar (collapsible) | Drawer overlay (swipe from left) |
| TopBar (full) | Slim topbar + bottom nav |
| Split panel (55/45) | Stacked (content + map toggle) |
| Map (side panel) | Full-screen overlay + bottom sheet |
| Chat (inline) | Bottom sheet (slides up) |
| Modal (centered) | Bottom sheet or full-screen |
| Dropdown | Bottom sheet with options |
| Tab bar (top) | Horizontally scrollable pills |
| Table layout | Stacked cards |
| Hover effects | Active/pressed states |
| Right-click | Long press |
| Tooltip | Toast or inline hint |

---

*Build mobile-first. Desktop is the override, not the default. Every SCSS file starts with the mobile layout, then adds `@include desktop { }` for larger screens.*
