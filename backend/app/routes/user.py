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
            .select("id, passport_country, visa_status, email, tours_seen, trips_remaining, preferred_currency")
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

    update_data = {}
    if body.get("passport_country") is not None:
        update_data["passport_country"] = body["passport_country"]
    if body.get("visa_status") is not None:
        update_data["visa_status"] = body["visa_status"]
    if body.get("tours_seen") is not None:
        update_data["tours_seen"] = body["tours_seen"]
    if body.get("onboarding_completed") is not None:
        update_data["onboarding_completed"] = body["onboarding_completed"]
    if body.get("quiz_data") is not None:
        update_data["quiz_data"] = body["quiz_data"]

    if not update_data:
        return {"ok": True, "profile": {}}

    try:
        resp = (
            supabase.table("profiles")
            .update(update_data)
            .eq("id", user["id"])
            .select()
            .single()
            .execute()
        )
        return {"ok": True, "profile": resp.data or update_data}
    except Exception:
        # Fallback: insert minimal row
        try:
            supabase.table("profiles").insert(
                {"id": user["id"], **update_data}
            ).execute()
        except Exception:
            pass
        return {"ok": True, "profile": update_data}

