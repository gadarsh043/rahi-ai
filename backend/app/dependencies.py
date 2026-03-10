from fastapi import HTTPException, Request

from app.config import get_settings
from app.utils.supabase_client import get_supabase


async def get_current_user(request: Request):
  settings = get_settings()

  auth_header = request.headers.get("authorization", "")

  if auth_header.startswith("Bearer "):
      token = auth_header.split(" ")[1]
      try:
          supabase = get_supabase()
          user = supabase.auth.get_user(token)
          return {"id": user.user.id, "email": user.user.email}
      except Exception:
          # Token was provided but invalid — always reject, even in dev
          raise HTTPException(status_code=401, detail="Invalid or expired token")

  # Dev fallback — only when NO auth header is sent at all
  if settings.env == "development":
      return {"id": settings.dev_user_id, "email": "test@gmail.com"}

  raise HTTPException(status_code=401, detail="Missing auth token")


async def get_optional_user(request: Request):
  """
  Optional user dependency for endpoints that work for both logged-in and
  logged-out users.

  - If there is no Authorization header → return None.
  - If a header is present → delegate to get_current_user, but swallow
    auth errors and return None instead of raising 401.
  """
  auth_header = request.headers.get("authorization", "")

  if not auth_header:
      return None

  try:
      return await get_current_user(request)
  except HTTPException:
      return None

