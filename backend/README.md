# Rahi AI — Backend

FastAPI backend for AI itinerary generation, Google Places integration, and trip management.

## Quick Start

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# → http://localhost:8000/docs (Swagger UI)
```

## Tech

| Tool | Purpose |
|------|---------|
| Python 3.12 | Runtime |
| FastAPI | Web framework (async, auto-docs) |
| Supabase Python | DB + Auth |
| Groq SDK | LLM (Llama 3 70B) |
| ReportLab | PDF generation |
| Stripe | Payments (India) |

## API Base URL

`http://localhost:8000/v1`

Auth: Supabase JWT in `Authorization: Bearer <token>`

## Key Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/generate` | SSE — full trip generation |
| POST | `/chat` | SSE — modify itinerary via chat |
| POST | `/plans/:id/pick` | SSE — regenerate from "Let's Pick" |
| GET | `/plans` | List user's trips |
| POST | `/plans/:id/save` | Freeze as "My Trip" |
| POST | `/plans/:id/share` | Generate share code |
| POST | `/nearby` | Right Now — nearby places |
| GET | `/plans/:id/pdf` | Download PDF |
| POST | `/credits/checkout` | Stripe checkout session |
| POST | `/webhooks/stripe` | Stripe webhook |

## Environment Variables

Create `backend/.env`:
```
ENV=development
GROQ_API_KEY=gsk_xxxxx
GOOGLE_PLACES_API_KEY=AIza_xxxxx
SERPAPI_KEY=xxxxx
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ_xxxxx
SUPABASE_SERVICE_KEY=eyJ_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
FRONTEND_URL=http://localhost:5173
```

## Not Started Yet

Backend development begins after the frontend home page and plan view are built. This README will be updated with setup instructions at that point.
