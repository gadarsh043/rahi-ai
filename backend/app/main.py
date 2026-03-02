from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routes import generate, chat, plans, pick, nearby, user, credits, webhooks

app = FastAPI(title="Rahi AI API", version="1.0.0")

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "env": settings.env}


app.include_router(generate.router, prefix="/v1", tags=["generate"])
app.include_router(chat.router, prefix="/v1", tags=["chat"])
app.include_router(plans.router, prefix="/v1", tags=["plans"])
app.include_router(pick.router, prefix="/v1", tags=["pick"])
app.include_router(nearby.router, prefix="/v1", tags=["nearby"])
app.include_router(user.router, prefix="/v1", tags=["user"])
app.include_router(credits.router, prefix="/v1", tags=["credits"])
app.include_router(webhooks.router, prefix="/v1", tags=["webhooks"])


