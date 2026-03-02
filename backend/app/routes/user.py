from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.utils.supabase_client import get_supabase

router = APIRouter()


@router.get("/user/profile")
async def get_profile(user=Depends(get_current_user)):
    supabase = get_supabase()
    try:
        resp = (
            supabase.table("profiles")
            .select("id, passport_country, visa_status, email")
            .eq("id", user["id"])
            .single()
            .execute()
        )
        return {"profile": resp.data or {}}
    except Exception:
        return {"profile": {}}


@router.post("/user/profile")
async def update_profile(body: dict, user=Depends(get_current_user)):
    supabase = get_supabase()

    payload = {
        "id": user["id"],
        "passport_country": body.get("passport_country"),
        "visa_status": body.get("visa_status"),
    }

    try:
        # Prefer update when row exists
        (
            supabase.table("profiles")
            .update(
                {
                    "passport_country": payload["passport_country"],
                    "visa_status": payload["visa_status"],
                }
            )
            .eq("id", user["id"])
            .execute()
        )
    except Exception:
        # Fallback: insert minimal row (may require email depending on schema)
        try:
            supabase.table("profiles").insert(payload).execute()
        except Exception:
            pass

    return {"ok": True, "profile": payload}

