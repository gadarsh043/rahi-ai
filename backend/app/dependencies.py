from fastapi import HTTPException, Request

from app.config import get_settings
from app.utils.supabase_client import get_supabase


async def get_current_user(request: Request):
  settings = get_settings()

  if settings.env == "development":
      return {"id": settings.dev_user_id, "email": "test@gmail.com"}

  auth_header = request.headers.get("authorization", "")
  if not auth_header.startswith("Bearer "):
      raise HTTPException(status_code=401, detail="Missing auth token")

  token = auth_header.split(" ")[1]
  try:
      supabase = get_supabase()
      user = supabase.auth.get_user(token)
      return {"id": user.user.id, "email": user.user.email}
  except Exception:
      raise HTTPException(status_code=401, detail="Invalid token")


