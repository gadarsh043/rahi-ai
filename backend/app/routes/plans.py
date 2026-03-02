from fastapi import APIRouter, Depends, HTTPException, Query

from app.dependencies import get_current_user
from app.utils.supabase_client import get_supabase
import secrets

router = APIRouter()


@router.get("/plans")
async def list_plans(user=Depends(get_current_user)):
    supabase = get_supabase()
    resp = (
        supabase.table("trips")
        .select(
            "id, origin_city, destination_city, start_date, end_date, "
            "num_days, status, share_code, created_at"
        )
        .eq("user_id", user["id"])
        .order("created_at", desc=True)
        .execute()
    )

    plans = resp.data or []

    # Get suggestion counts per plan
    for plan in plans:
        sug_resp = (
            supabase.table("trip_suggestions")
            .select("id", count="exact")
            .eq("trip_id", plan["id"])
            .eq("status", "pending")
            .execute()
        )
        plan["suggestion_count"] = getattr(sug_resp, "count", None) or 0

    return {"plans": plans}


@router.get("/plans/{trip_id}")
async def get_plan(
    trip_id: str,
    shared: str | None = Query(None),
    user=Depends(get_current_user),
):
    supabase = get_supabase()

    if shared:
        # Public shared view — no auth check on user_id
        resp = (
            supabase.table("trips")
            .select("*")
            .eq("id", trip_id)
            .eq("share_code", shared)
            .single()
            .execute()
        )
    else:
        resp = (
            supabase.table("trips")
            .select("*")
            .eq("id", trip_id)
            .eq("user_id", user["id"])
            .single()
            .execute()
        )

    if not resp.data:
        raise HTTPException(status_code=404, detail="Trip not found")

    trip = resp.data

    places_resp = (
        supabase.table("trip_places")
        .select("*")
        .eq("trip_id", trip_id)
        .execute()
    )

    chat_resp = (
        supabase.table("chat_messages")
        .select("*")
        .eq("trip_id", trip_id)
        .order("created_at")
        .execute()
    )

    return {
        "trip": trip,
        "places": places_resp.data or [],
        "chat_messages": chat_resp.data or [],
    }


@router.post("/plans/{trip_id}/save")
async def save_plan(trip_id: str, user=Depends(get_current_user)):
    """Freeze plan as 'My Trip'."""
    supabase = get_supabase()
    (
        supabase.table("trips")
        .update({"status": "saved"})
        .eq("id", trip_id)
        .eq("user_id", user["id"])
        .execute()
    )

    # TODO: Generate PDF here (Prompt 7)

    return {"message": "Trip saved!", "trip_id": trip_id}


@router.post("/plans/{trip_id}/share")
async def share_plan(trip_id: str, user=Depends(get_current_user)):
    supabase = get_supabase()

    # Check if already has share code
    resp = (
        supabase.table("trips")
        .select("share_code")
        .eq("id", trip_id)
        .eq("user_id", user["id"])
        .single()
        .execute()
    )

    existing = resp.data or {}
    if existing.get("share_code"):
        code = existing["share_code"]
    else:
        code = secrets.token_urlsafe(6)[:6].upper()
        (
            supabase.table("trips")
            .update({"share_code": code})
            .eq("id", trip_id)
            .execute()
        )

    return {"share_code": code, "share_url": f"/plan/{trip_id}?shared={code}"}


@router.post("/plans/{trip_id}/suggest")
async def suggest(trip_id: str, body: dict):
    """Public endpoint — no auth. Viewer suggests a change."""
    supabase = get_supabase()
    supabase.table("trip_suggestions").insert(
        {
            "trip_id": trip_id,
            "viewer_name": body.get("viewer_name", "Anonymous"),
            "suggestion_text": body["suggestion_text"],
        }
    ).execute()
    return {"message": "Suggestion submitted!"}


@router.get("/plans/{trip_id}/suggestions")
async def get_suggestions(trip_id: str, user=Depends(get_current_user)):
    supabase = get_supabase()
    resp = (
        supabase.table("trip_suggestions")
        .select("*")
        .eq("trip_id", trip_id)
        .order("created_at", desc=True)
        .execute()
    )
    return {"suggestions": resp.data or []}


@router.post("/plans/{trip_id}/suggestions/{suggestion_id}/{action}")
async def handle_suggestion(
    trip_id: str,
    suggestion_id: str,
    action: str,
    user=Depends(get_current_user),
):
    if action not in ("accepted", "rejected"):
        raise HTTPException(
            status_code=400,
            detail="Action must be 'accepted' or 'rejected'",
        )
    supabase = get_supabase()
    (
        supabase.table("trip_suggestions")
        .update({"status": action})
        .eq("id", suggestion_id)
        .execute()
    )
    return {"message": f"Suggestion {action}"}

