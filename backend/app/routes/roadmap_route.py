# app/routes/roadmap.py
# Two endpoints: GET /roadmap/hearts (public) and POST /roadmap/hearts/{feature_id} (auth, toggle)

from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user, get_optional_user
from app.utils.supabase_client import get_supabase

router = APIRouter(prefix="/roadmap", tags=["roadmap"])


@router.get("/hearts")
async def get_heart_counts(user=Depends(get_optional_user)):
    """
    Public endpoint. Returns:
    - counts: { "next-1": 12, "next-2": 5, ... } (all feature heart totals)
    - user_hearts: ["next-1", "explore-2", ...] (features this user has hearted, empty if not logged in)
    """
    supabase = get_supabase()

    # Aggregate counts per feature_id
    # Supabase doesn't support GROUP BY via client, so fetch all and count in Python.
    # With <1000 hearts this is instant. If you hit 10k+ hearts, add a DB function.
    result = supabase.table("roadmap_hearts").select("feature_id").execute()
    rows = result.data or []

    counts = {}
    for row in rows:
        fid = row["feature_id"]
        counts[fid] = counts.get(fid, 0) + 1

    # User's own hearts (if logged in)
    user_hearts = []
    if user:
        user_result = (
            supabase.table("roadmap_hearts")
            .select("feature_id")
            .eq("user_id", user["id"])
            .execute()
        )
        user_hearts = [r["feature_id"] for r in (user_result.data or [])]

    return {"counts": counts, "user_hearts": user_hearts}


@router.post("/hearts/{feature_id}")
async def toggle_heart(feature_id: str, user=Depends(get_current_user)):
    """
    Auth required. Toggles heart on a feature:
    - If not hearted → insert (heart)
    - If already hearted → delete (unheart)
    Returns: { "hearted": true/false, "count": 13 }
    """
    supabase = get_supabase()
    user_id = user["id"]

    # Check if already hearted
    existing = (
        supabase.table("roadmap_hearts")
        .select("id")
        .eq("feature_id", feature_id)
        .eq("user_id", user_id)
        .execute()
    )

    if existing.data and len(existing.data) > 0:
        # Unheart — delete the row
        supabase.table("roadmap_hearts").delete().eq(
            "feature_id", feature_id
        ).eq("user_id", user_id).execute()
        hearted = False
    else:
        # Heart — insert
        supabase.table("roadmap_hearts").insert(
            {"feature_id": feature_id, "user_id": user_id}
        ).execute()
        hearted = True

    # Get updated count for this feature
    count_result = (
        supabase.table("roadmap_hearts")
        .select("id", count="exact")
        .eq("feature_id", feature_id)
        .execute()
    )
    count = count_result.count if count_result.count is not None else 0

    return {"hearted": hearted, "count": count}
