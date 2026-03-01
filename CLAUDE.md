# CLAUDE.md — Rahi AI

## What Is This
AI-powered travel planner. Users enter trip details → get itineraries with real places (Google Places fetched FIRST, then AI builds from verified data). Zero hallucination.

## Tech Stack
- **Frontend:** React 18 + Vite + Tailwind CSS v4 + Zustand + React Router v6
- **Backend:** Python 3.12 + FastAPI (separate — don't touch until asked)
- **DB/Auth:** Supabase (PostgreSQL + Google OAuth)
- **AI:** Groq (Llama 3 70B) → Claude (later)
- **Maps:** Google Maps JS API + Google Places API
- **Font:** DM Sans (Google Fonts)
- **Dates:** react-day-picker
- **Animations:** framer-motion

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

/* Base styles */
body {
  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--text-primary);
}

/* Dark mode background with subtle radial gradient (anti-slop) */
.dark body {
  background: #0F172A;
  background-image: radial-gradient(ellipse at 15% 0%, rgba(67, 20, 7, 0.4) 0%, transparent 50%);
}

/* Glassmorphism utility classes */
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

/* Brand glow shadow */
@utility shadow-brand {
  box-shadow: 0 4px 16px rgba(249, 115, 22, 0.25);
}
```

### How to Use Dark Mode
Theme class `.dark` / `.light` on `<html>`. Use Tailwind `dark:` prefix:

```jsx
// ✅ CORRECT
<div className="bg-[var(--surface)] dark:bg-[var(--surface)] border border-[var(--border)]">
  <p className="text-[var(--text-primary)]">Hello</p>
</div>

// ✅ ALSO CORRECT — using glass utilities
<div className="glass dark:glass-dark rounded-2xl p-4">
  <p className="text-[var(--text-primary)]">Hello</p>
</div>

// ✅ Using brand colors
<button className="bg-gradient-to-r from-brand-400 to-brand-600 text-white rounded-xl px-6 py-3 font-semibold shadow-brand hover:from-brand-500 hover:to-brand-700 transition-all">
  Next →
</button>

// ❌ WRONG — no inline styles
<div style={{ background: '#1E293B' }}>
```

### Tailwind Patterns for Common Elements

**Glass card:**
```jsx
<div className="glass dark:glass-dark rounded-2xl p-4">
```

**Solid card (most cards — don't overuse glass):**
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

**Pill toggle (inactive):**
```jsx
<button className="border border-[var(--border)] text-[var(--text-secondary)] rounded-full px-4 py-2 text-sm font-medium hover:border-brand-400 transition-colors">
```

**Pill toggle (active):**
```jsx
<button className="bg-brand-500 text-white border border-brand-500 rounded-full px-4 py-2 text-sm font-semibold">
```

**Text hierarchy:**
```jsx
<h1 className="text-3xl font-extrabold text-[var(--text-primary)]">
<h2 className="text-xl font-bold text-[var(--text-primary)]">
<p className="text-sm text-[var(--text-secondary)]">
<span className="text-xs text-[var(--text-muted)]">
<label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
```

---

## Repo Structure
```
rahi-ai/
├── .cursorrules
├── .gitignore
├── CLAUDE.md
├── PROJECT_SPEC.md
├── MWEB_UI_SPEC.md
├── HOME_PAGE_PROMPTS.md
├── NEXT_STEPS.md
│
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/        ← Button, Modal, Toast, Dropdown, Badge, Loader
│   │   │   ├── layout/        ← TopBar, Sidebar, ThemeToggle, ProfileDropdown
│   │   │   ├── auth/          ← GoogleLoginButton, ProtectedRoute
│   │   │   ├── home/          ← CityAutocomplete, DatePicker, PaceSelector, etc.
│   │   │   ├── plan/          ← PlanView, tabs, ChatInput, MapPanel, etc.
│   │   │   ├── nearby/        ← NearbyModal, NearbyCard
│   │   │   ├── credits/       ← CreditsModal, PlanCard
│   │   │   └── profile/       ← ProfileForm, QuizView, PurchaseHistory
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── PlanPage.jsx
│   │   │   ├── SettingsPage.jsx
│   │   │   └── AuthPage.jsx
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── index.css          ← Tailwind imports + theme + glass utilities
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── README.md
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routes/
│   │   ├── services/
│   │   ├── models/
│   │   ├── prompts/
│   │   └── utils/
│   ├── requirements.txt
│   └── README.md
│
└── supabase/
    └── migrations/
```

**Note on pages:** With Tailwind, no need for separate page folders with .module.scss. Pages are just single `.jsx` files. Components still get their own folders when they have multiple files (e.g., custom hooks), but most are just single `.jsx` files too.

---

## Component Pattern

```jsx
// components/home/PaceSelector.jsx
// No separate CSS file needed — Tailwind classes in JSX

export default function PaceSelector({ value, onChange }) {
  const paces = [
    { id: 'relaxed', emoji: '😎', label: 'Relaxed', desc: 'Take it slow, savor every moment' },
    { id: 'moderate', emoji: '🌿', label: 'Moderate', desc: 'Balance of rest and exploration' },
    { id: 'active', emoji: '🤸', label: 'Active', desc: 'See as much as you can' },
    { id: 'intense', emoji: '🔥', label: 'Intense', desc: 'Non-stop, packed schedule' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-md">
      {paces.map(pace => (
        <button
          key={pace.id}
          onClick={() => onChange(pace.id)}
          className={`
            glass dark:glass-dark rounded-2xl p-5 text-center cursor-pointer
            border-2 transition-all duration-150
            hover:-translate-y-0.5 hover:shadow-lg
            active:scale-[0.97]
            ${value === pace.id
              ? 'border-brand-500 bg-brand-500/8 dark:bg-brand-500/12 shadow-brand'
              : 'border-transparent'
            }
          `}
        >
          <span className="text-3xl block mb-2">{pace.emoji}</span>
          <span className="text-base font-bold text-[var(--text-primary)] block">{pace.label}</span>
          <span className="text-xs text-[var(--text-muted)] mt-1 block">{pace.desc}</span>
        </button>
      ))}
    </div>
  );
}
```

---

## Libraries

| Library | Purpose | Why |
|---------|---------|-----|
| `tailwindcss` + `@tailwindcss/vite` | Styling | Better AI output, faster dev, dark mode built-in |
| `react-day-picker` | Date selection | Dark-mode friendly, customizable, 8KB |
| `framer-motion` | Animations | Spring physics, layout animations, gesture support |
| `zustand` | State | Minimal boilerplate |
| `react-router-dom` | Routing | Standard |

### Date Picker Styling
```jsx
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';

// Wrap in a themed container:
<div className="glass dark:glass-dark rounded-2xl p-4">
  <DayPicker
    mode="range"
    disabled={{ before: new Date() }}  // No past dates!
    classNames={{
      root: 'text-[var(--text-primary)]',
      day: 'rounded-lg hover:bg-brand-500/10',
      selected: 'bg-brand-500 text-white',
      range_middle: 'bg-brand-500/15',
      today: 'font-bold text-brand-500',
    }}
  />
</div>
```

### Framer Motion Patterns
```jsx
import { motion, AnimatePresence } from 'framer-motion';

// Step transitions
<AnimatePresence mode="wait">
  <motion.div
    key={currentStep}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.2 }}
  >
    {stepContent}
  </motion.div>
</AnimatePresence>

// Card press effect
<motion.button
  whileTap={{ scale: 0.97 }}
  whileHover={{ y: -2 }}
  transition={{ type: "spring", stiffness: 400, damping: 25 }}
>

// Staggered list
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.05 }}
>
```

---

## 🚫 UI Anti-Slop Rules (CRITICAL)

### Banned Patterns — NEVER Do These

**Layout slop:**
- Perfectly symmetrical everything — real design has intentional asymmetry
- Equal padding on all sides of every element — vary it, create hierarchy
- Every card identical height/width/style — vary visual weight
- Icon + heading + 3 bullets + CTA — the AI landing page formula
- Centered everything — left-align body text, center only for heroes

**Color slop:**
- Purple/blue gradient on white — the #1 AI tell
- Gradient text on everything — once per page max, hero heading only
- Brand orange flooding the page — it's an ACCENT (10-15% of UI)
- Every button is primary color — use ghost, outline, subtle variants
- Rainbow of colors — brand + neutrals + semantic for status only

**Typography slop:**
- Everything 16px — create contrast (30px heading + 13px body)
- Inter or Roboto font — we use DM Sans, period
- Bold on everything — 700+ only for headings and key labels
- ALL CAPS headers everywhere — sparingly if at all

**Component slop:**
- Drop shadow on every card — most cards need only border
- `rounded-full` on containers — full radius for pills/badges only, cards use `rounded-xl`/`rounded-2xl`
- Glassmorphism on EVERY element — 30% of elevated elements max, rest solid
- Hover effects on non-interactive elements
- Plain circle loading spinner — use skeleton loaders

**Interaction slop:**
- Linear easing — use `ease-out` or framer-motion springs
- 300ms on everything — button press 100-150ms, layout 200-250ms
- Only fade animations — combine with translateY for depth

### Enforced Patterns — ALWAYS Do These

**Visual hierarchy per section:**
- ONE dominant element (largest, boldest, or most colorful)
- Supporting elements visually quieter
- Clear reading path for the eye

**Whitespace:**
- More space between sections (`py-8`, `py-12`) than within (`gap-3`, `gap-4`)
- Content should breathe — don't fill every pixel
- `max-w-md` or `max-w-lg` on content, centered — never edge-to-edge text

**Typography rhythm:**
```
Hero heading:    text-3xl font-extrabold
Section heading: text-xl font-bold
Card title:      text-[15px] font-semibold
Body text:       text-sm text-[var(--text-secondary)]
Caption:         text-xs text-[var(--text-muted)]
Tiny label:      text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]
```

**Color usage:**
- Backgrounds: `var(--bg)`, `var(--surface)` — neutral
- Text: primary → secondary → muted hierarchy
- Brand orange: CTAs, active states, selected items, key accents only
- Semantic: success/warning/error for status only

**Glassmorphism — selective use:**
- ✅ Use glass on: autocomplete dropdowns, prompt box, floating bars, modals, map overlays
- ❌ Use solid on: regular cards, list items, sidebar, topbar, form containers

**The Screenshot Test:**
Before finishing any component, ask: "Could someone tell this was AI-generated?" If yes, fix it. Real design has restraint, hierarchy, and one strong decision per screen.

---

## Home Page Architecture

### Flow
Sequential stepper. One step visible at a time. framer-motion AnimatePresence for transitions.

### 10 Steps
| # | Question | Component | Type |
|---|----------|-----------|------|
| 1 | Where from? | CityAutocomplete | Autocomplete + dropdown |
| 2 | Where to? | CityAutocomplete | Autocomplete + dropdown |
| 3 | When? | DatePicker (react-day-picker) | Calendar range + flexible toggle |
| 4 | How long? | DurationSlider | Slider + quick picks (if flexible) |
| 5 | Pace? | PaceSelector | 2×2 emoji cards |
| 6 | Budget vibe? | BudgetVibeSelector | 4 cards in row |
| 7 | Into? | PreferencePills | 15 multi-select pills |
| 8 | Stay? | AccommodationSelector | 3 cards |
| 9 | Passport? | CountryAutocomplete | Autocomplete + grouped dropdown |
| 10 | Anything else? | InstructionsInput | Textarea + quick-add chips |

### Layout
```
┌──────────────────────────────────────────────────────────┐
│  TopBar (56px)                                            │
├────┬─────────────────────────────────────────────────────┤
│    │                                                      │
│ S  │           [Emoji icon — large]                       │
│ i  │           [Question — heading]                       │
│ d  │           [Subtitle — muted]                         │
│ e  │                                                      │
│ b  │           [Selector Component — max-w-md]            │
│ a  │                                                      │
│ r  │           [● ● ● ○ ○ ○ ○ ○ ○ ○]                    │
│    │           [← Back]  [Next →]                         │
│    │                                                      │
│    ├─────────────────────────────────────────────────────┤
│    │  PromptBox — glass, sticky bottom                    │
│    │  "✨ Relaxed $$$ trip from HYD → DAL..." [Send ➤]   │
│    │  "Have an invite code? Join a trip →"               │
└────┴─────────────────────────────────────────────────────┘
```

---

## What NOT To Do
- ❌ No SCSS, no CSS Modules, no `.module.scss` files
- ❌ No `style={{}}` inline props (rare exceptions for truly dynamic values like calculated positions)
- ❌ No CSS-in-JS (styled-components, emotion)
- ❌ No UI component libraries (MUI, Chakra, Ant, shadcn)
- ❌ No external placeholder images — use emoji or colored divs
- ❌ No backend work until asked
- ❌ No Inter, Roboto, Arial, system fonts
- ❌ No purple gradients, no generic blue/white themes
- ❌ Don't modify PROJECT_SPEC.md or MWEB_UI_SPEC.md


## Plan View Architecture

### Layout Structure
```
┌──────┬───────────────────────────┬──────────────────────┐
│      │ PlanHeader                │                      │
│ Side │ TabBar (scrollable pills) │                      │
│ bar  ├───────────────────────────┤   MapPanel            │
│      │                           │   (Leaflet + OSM)    │
│      │   TabContent              │   Color-coded markers │
│      │   (scrollable)            │                      │
│      ├───────────────────────────┤                      │
│      │ ActionBar                 │                      │
│      │ [Chat input] [Let's Pick] │                      │
└──────┴───────────────────────────┴──────────────────────┘
```

- Content panel: flex-1, min-w-0, overflow-y-auto
- Map panel: w-[45%], hidden below lg breakpoint, border-l
- ActionBar: sticky bottom of content panel
- Full height: h-[calc(100vh-56px)] accounting for TopBar

### Three Modes (one PlanView component)
- `editing`: owner, full chat + Let's Pick, all interactions
- `shared`: viewer via ?shared=CODE, read-only, suggest + fork
- `saved`: frozen "My Trip" at /trip/:id, PDF + booking links

### Data Flow
- All trip data lives in Zustand `tripStore`
- Tabs read from `trip.places` filtered by category
- Map reads from `trip.places` filtered by `activeTab`
- Chat messages stored in `tripStore.chatMessages`
- Let's Pick reads/writes `trip.places[].isInItinerary`

### Tab IDs
eat | stay | go | flight | costs | trip | next

### Map Setup (MVP)
Using Leaflet + OpenStreetMap (free), NOT Google Maps JS API.
- react-leaflet for React integration
- Custom divIcon markers with category colors
- Switch to Google Maps later if needed (just swap MapPanel internals)

### Marker Colors
- restaurant: #EF4444 (red)
- hotel: #3B82F6 (blue)
- attraction: #10B981 (green)
- cafe: #F59E0B (amber)
- outdoor: #14B8A6 (teal)

### Component Ownership
```
PlanView/
├── PlanHeader.jsx        — trip title, currency, share
├── TabBar.jsx            — 7 scrollable pill tabs
├── TabContent.jsx        — switch/router for active tab
├── ActionBar.jsx         — chat input + Let's Pick button
├── MapPanel.jsx          — Leaflet map with markers
├── ChatPanel.jsx         — message history + mock AI
├── LetsPickPopup.jsx     — full-screen place curation
├── PlaceCard.jsx         — shared card (eat/stay/go)
├── FlightCard.jsx        — collapsible flight card
├── Timeline.jsx          — day-by-day itinerary
├── CostBreakdown.jsx     — progress bar breakdown
└── tabs/
    ├── EatTab.jsx
    ├── StayTab.jsx
    ├── PlacesTab.jsx
    ├── FlightTab.jsx
    ├── CostsTab.jsx
    ├── TripTab.jsx
    └── NextTab.jsx
```