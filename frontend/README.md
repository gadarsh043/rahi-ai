# Rahi AI — Frontend

AI-powered travel planning platform. React + Vite + Tailwind CSS.

## Quick Start

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

## Tech

| Tool | Purpose |
|------|---------|
| React 18 | UI framework |
| Vite | Build tool |
| Tailwind CSS |
| Zustand | State management |
| React Router v6 | Routing |
| DM Sans | Font (Google Fonts) |

## Key Decisions

- **Tailwind.** All styling via Tailwind.
- **UI libraries.** Every component built from scratch.
- **Dark mode default.** Theme class `.dark`/`.light` on `<html>`, toggled via `useTheme` hook, persisted in localStorage.
- **Desktop first for now.** Mobile responsive comes after desktop is solid.

## Folder Logic

```
src/
  components/   → Reusable pieces, grouped by feature area
  pages/        → Route-level components (HomePage, PlanPage, etc.)
  hooks/        → Custom React hooks
  stores/       → Zustand stores
  services/     → API calls, Supabase client
  utils/        → Constants, helpers, mock data
  styles/       → Tailwind
```

## Scripts

```bash
npm run dev      # Dev server (port 5173)
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
```

## Environment Variables

Create `frontend/.env`:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ_xxxxx
VITE_GOOGLE_MAPS_API_KEY=AIza_xxxxx
VITE_API_URL=http://localhost:8000/v1
```
