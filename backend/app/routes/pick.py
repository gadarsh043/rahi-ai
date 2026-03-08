from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.dependencies import get_current_user
from app.models.trip import PickRequest
from app.prompts.itinerary import ITINERARY_SYSTEM, build_itinerary_prompt
from app.services.llm_service import get_llm
from app.utils.supabase_client import get_supabase
import json

router = APIRouter()


@router.post("/plans/{trip_id}/update-picks")
async def update_picks(trip_id: str, req: PickRequest, user=Depends(get_current_user)):
    """Persist place selection changes to DB without rebuilding the itinerary."""
    supabase = get_supabase()

    # Verify ownership
    trip_resp = (
        supabase.table("trips")
        .select("user_id")
        .eq("id", trip_id)
        .single()
        .execute()
    )
    if not trip_resp.data or trip_resp.data.get("user_id") != user.get("id"):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Not your trip")

    for pid in req.selected_place_ids:
        (
            supabase.table("trip_places")
            .update({"is_in_itinerary": True})
            .eq("trip_id", trip_id)
            .eq("google_place_id", pid)
            .execute()
        )

    for pid in req.removed_place_ids:
        (
            supabase.table("trip_places")
            .update({"is_in_itinerary": False, "day_number": None, "time_slot": None})
            .eq("trip_id", trip_id)
            .eq("google_place_id", pid)
            .execute()
        )

    return {"ok": True, "updated": len(req.selected_place_ids) + len(req.removed_place_ids)}


@router.post("/plans/{trip_id}/pick")
async def pick_places(trip_id: str, req: PickRequest, user=Depends(get_current_user)):
    return StreamingResponse(
        pick_stream(trip_id, req, user),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


async def pick_stream(trip_id: str, req: PickRequest, user: dict):
    llm = get_llm()
    supabase = get_supabase()

    # Update selected/removed places in DB
    for pid in req.selected_place_ids:
        (
            supabase.table("trip_places")
            .update({"is_in_itinerary": True})
            .eq("trip_id", trip_id)
            .eq("google_place_id", pid)
            .execute()
        )

    for pid in req.removed_place_ids:
        (
            supabase.table("trip_places")
            .update(
                {
                    "is_in_itinerary": False,
                    "day_number": None,
                    "time_slot": None,
                }
            )
            .eq("trip_id", trip_id)
            .eq("google_place_id", pid)
            .execute()
        )

    yield (
        "event: status\n"
        f"data: {json.dumps({'message': 'Rebuilding your itinerary...'})}\n\n"
    )

    # Get updated places
    places_resp = (
        supabase.table("trip_places")
        .select("*")
        .eq("trip_id", trip_id)
        .eq("is_in_itinerary", True)
        .execute()
    )
    selected_places = places_resp.data or []

    trip_resp = (
        supabase.table("trips")
        .select("*")
        .eq("id", trip_id)
        .single()
        .execute()
    )
    trip = trip_resp.data

    params = {
        "destination_city": trip["destination_city"],
        "destination_country": trip.get("destination_country", ""),
        "origin_city": trip["origin_city"],
        "num_days": trip["num_days"],
        "pace": trip["pace"],
        "budget_vibe": trip["budget_vibe"],
        "accommodation_type": trip.get("accommodation_type", "hotel"),
        "preferences": trip.get("travel_preferences", []),
        "dietary": [],
        "instructions": trip.get("instructions", ""),
        "num_travelers": trip.get("num_travelers", 1),
        "start_date": trip.get("start_date"),
        "end_date": trip.get("end_date"),
    }

    prompt = build_itinerary_prompt(selected_places, params)
    response = await llm.json_completion(ITINERARY_SYSTEM, prompt)

    try:
        itinerary_data = json.loads(response)
        (
            supabase.table("trips")
            .update({"itinerary": itinerary_data})
            .eq("id", trip_id)
            .execute()
        )
        yield (
            "event: itinerary\n"
            f"data: {json.dumps({'trip_id': trip_id, 'days': itinerary_data.get('itinerary', [])})}\n\n"
        )
    except Exception:  # noqa: BLE001
        yield (
            "event: error\n"
            f"data: {json.dumps({'message': 'Failed to regenerate itinerary'})}\n\n"
        )

    yield f"event: done\ndata: {json.dumps({'trip_id': trip_id})}\n\n"

