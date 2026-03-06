from fastapi import HTTPException, Request

from app.config import get_settings
from app.utils.supabase_client import get_supabase


async def get_current_user(request: Request):
  settings = get_settings()

  auth_header = request.headers.get("authorization", "")

  # Always try real token first (even in dev)
  if auth_header.startswith("Bearer "):
      token = auth_header.split(" ")[1]
      try:
          supabase = get_supabase()
          user = supabase.auth.get_user(token)
          return {"id": user.user.id, "email": user.user.email}
      except Exception:
          if settings.env != "development":
              raise HTTPException(status_code=401, detail="Invalid token")

  # Dev fallback — only if no valid token
  if settings.env == "development":
      return {"id": settings.dev_user_id, "email": "test@gmail.com"}

  raise HTTPException(status_code=401, detail="Missing auth token")


