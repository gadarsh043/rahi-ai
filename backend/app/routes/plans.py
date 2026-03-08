from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import Response

from app.dependencies import get_current_user
from app.utils.supabase_client import get_supabase
import secrets
import uuid

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

    # Get pending suggestion counts per plan
    for plan in plans:
        sug_resp = (
            supabase.table("trip_suggestions")
            .select("id", count="exact")
            .eq("trip_id", plan["id"])
            .eq("status", "pending")
            .execute()
        )
        count = getattr(sug_resp, "count", None) or 0
        # Backwards-compatible key + explicit pending_suggestions for UI
        plan["suggestion_count"] = count
        plan["pending_suggestions"] = count

    return {"plans": plans}


@router.get("/plans/{trip_id}")
async def get_plan(
    trip_id: str,
    shared: str | None = Query(None),
    user=Depends(get_current_user),
):
    supabase = get_supabase()

    try:
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
    except Exception:
        raise HTTPException(status_code=404, detail="Trip not found")

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


@router.post("/plans/{trip_id}/refresh-flights")
async def refresh_flights(trip_id: str, request: Request, user=Depends(get_current_user)):
    """
    Force-refresh flight search for a trip, respecting the FlightService cache.
    Accepts optional JSON body: { departure_date, return_date }
    """
    from app.services.flight_service import FlightService
    from app.utils.iata_codes import resolve_iata

    # Parse optional body for custom dates
    body = {}
    try:
        body = await request.json()
    except Exception:
        pass

    supabase = get_supabase()

    trip_resp = (
        supabase.table("trips")
        .select("*")
        .eq("id", trip_id)
        .eq("user_id", user["id"])
        .single()
        .execute()
    )
    trip = trip_resp.data
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    transport_data_existing = trip.get("transport_data") or {}
    resolved_origin = resolve_iata(trip.get("origin_city", ""))
    resolved_dest = resolve_iata(trip.get("destination_city", ""))
    origin_code = resolved_origin or transport_data_existing.get("origin_code")
    dest_code = resolved_dest or transport_data_existing.get("destination_code")

    # Use custom dates from request body, fall back to trip dates
    departure_date = body.get("departure_date") or str(trip.get("start_date") or "") or ""
    return_date = body.get("return_date") or str(trip.get("end_date") or "") or None
    adults = trip.get("num_travelers") or 1

    if not origin_code or not dest_code or not departure_date:
        raise HTTPException(
            status_code=400,
            detail="Trip is missing origin/destination codes or dates for flight search.",
        )

    result = await FlightService.search_flights(
        origin_code=origin_code,
        destination_code=dest_code,
        departure_date=departure_date,
        return_date=return_date,
        adults=adults,
    )

    existing_transport = trip.get("transport_data") or {}
    transport_data = {
        **existing_transport,
        "mode": trip.get("transport_mode") or "flight",
        "origin_code": origin_code,
        "destination_code": dest_code,
        "departure_date": departure_date,
        "return_date": return_date,
        **result,
    }

    (
        supabase.table("trips")
        .update({"transport_data": transport_data, "transport_mode": "flight"})
        .eq("id", trip_id)
        .execute()
    )

    return transport_data


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


@router.get("/plans/join/{code}")
async def join_trip(code: str):
    """Resolve a share code to a trip id (no auth)."""
    supabase = get_supabase()
    resp = (
        supabase.table("trips")
        .select("id")
        .eq("share_code", code.upper())
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Trip not found")
    return {"trip_id": resp.data["id"]}


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


@router.post("/plans/{trip_id}/fork")
async def fork_trip(trip_id: str, user=Depends(get_current_user)):
    """Copy a shared trip into the requesting user's trips."""
    supabase = get_supabase()

    original = (
        supabase.table("trips").select("*").eq("id", trip_id).single().execute()
    )
    if not original.data:
        raise HTTPException(status_code=404, detail="Trip not found")

    trip = original.data

    new_id = str(uuid.uuid4())
    new_trip = {
        "id": new_id,
        "user_id": user["id"],
        "origin_city": trip["origin_city"],
        "origin_country": trip.get("origin_country"),
        "origin_lat": trip.get("origin_lat"),
        "origin_lng": trip.get("origin_lng"),
        "destination_city": trip["destination_city"],
        "destination_country": trip.get("destination_country"),
        "destination_lat": trip.get("destination_lat"),
        "destination_lng": trip.get("destination_lng"),
        "start_date": trip.get("start_date"),
        "end_date": trip.get("end_date"),
        "num_days": trip.get("num_days"),
        "pace": trip.get("pace"),
        "budget_vibe": trip.get("budget_vibe"),
        "accommodation_type": trip.get("accommodation_type"),
        "travel_preferences": trip.get("travel_preferences"),
        "instructions": trip.get("instructions"),
        "num_travelers": trip.get("num_travelers"),
        "itinerary": trip.get("itinerary"),
        "narrative": trip.get("narrative"),
        "cost_estimate": trip.get("cost_estimate"),
        "transport_mode": trip.get("transport_mode"),
        "transport_data": trip.get("transport_data"),
        "visa_info": trip.get("visa_info"),
        "travel_essentials": trip.get("travel_essentials"),
        "status": "planning",
    }

    supabase.table("trips").insert(new_trip).execute()

    places_resp = (
        supabase.table("trip_places").select("*").eq("trip_id", trip_id).execute()
    )

    for p in places_resp.data or []:
        new_place = dict(p)
        new_place["id"] = str(uuid.uuid4())
        new_place["trip_id"] = new_id
        supabase.table("trip_places").insert(new_place).execute()

    return {"new_trip_id": new_id, "message": "Trip forked!"}


@router.get("/plans/{trip_id}/pdf")
async def download_pdf(trip_id: str, user=Depends(get_current_user)) -> Response:
    """Generate and return trip PDF."""
    from app.services.pdf_service import generate_trip_pdf
    from app.services.essentials_service import get_visa_info, get_travel_essentials

    supabase = get_supabase()

    try:
        trip_resp = (
            supabase.table("trips")
            .select("*")
            .eq("id", trip_id)
            .eq("user_id", user["id"])
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(status_code=404, detail="Trip not found")

    trip = trip_resp.data
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    places_resp = (
        supabase.table("trip_places")
        .select("*")
        .eq("trip_id", trip_id)
        .eq("is_in_itinerary", True)
        .execute()
    )
    places = places_resp.data or []

    visa_info = trip.get("visa_info") or get_visa_info(
        trip.get("origin_country", "") or "",
        trip.get("destination_country", "") or "",
    )
    essentials = trip.get("travel_essentials") or get_travel_essentials(
        trip.get("destination_country", "") or ""
    )

    pdf_bytes = generate_trip_pdf(trip, places, visa_info, essentials)

    filename = f"rahify-{trip.get('origin_city','')}-to-{trip.get('destination_city','')}-{trip.get('num_days','')}days.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/plans/{trip_id}/rebuild")
async def rebuild_itinerary(trip_id: str, user=Depends(get_current_user)):
    from app.services.llm_service import get_llm
    from app.services.places_service import format_places_lean
    from app.prompts.itinerary import ITINERARY_SYSTEM_LEAN, build_itinerary_prompt_lean
    import json

    supabase = get_supabase()
    llm = get_llm()

    trip_resp = (
        supabase.table("trips")
        .select("*")
        .eq("id", trip_id)
        .eq("user_id", user["id"])
        .single()
        .execute()
    )
    trip = trip_resp.data
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    itinerary = trip.get("itinerary", {})
    days = itinerary.get("itinerary", []) if isinstance(itinerary, dict) else []

    places_resp = (
        supabase.table("trip_places")
        .select("*")
        .eq("trip_id", trip_id)
        .eq("is_in_itinerary", True)
        .execute()
    )
    places = places_resp.data or []

    recent_resp = (
        supabase.table("chat_messages")
        .select("itinerary_diff")
        .eq("trip_id", trip_id)
        .eq("role", "assistant")
        .order("created_at", desc=True)
        .limit(10)
        .execute()
    )

    affected_days = set()
    for msg in (recent_resp.data or []):
        diff = msg.get("itinerary_diff") or {}
        for change in diff.get("changes", []) or []:
            if change.get("day_number"):
                affected_days.add(change["day_number"])
            pid = change.get("place_id")
            if pid:
                for day in days:
                    for act in day.get("activities", []) or []:
                        if act.get("place_id") == pid:
                            affected_days.add(day.get("day_number"))

    # PATCH MODE: 1-2 affected days
    if 0 < len(affected_days) <= 2 and days:
        patched_days = list(days)
        patch_success = True

        for day_num in affected_days:
            day_places = [p for p in places if p.get("day_number") == day_num]
            unassigned = [p for p in places if not p.get("day_number")]

            places_text = "\n".join(
                [
                    f"- {p['name']} | {p.get('category','?')} | rating {p.get('rating','N/A')}"
                    for p in day_places
                ]
            )
            if unassigned:
                places_text += "\nUnassigned (include if they fit):\n"
                places_text += "\n".join(
                    [f"- {p['name']} | {p.get('category','?')}" for p in unassigned[:5]]
                )

            prompt = f"""Rewrite Day {day_num} of a {trip.get('num_days')}-day {trip.get('pace','moderate')} trip to {trip.get('destination_city')}.

Places for this day:
{places_text}

JSON only: {{"day_number":{day_num},"title":"Day title","activities":[{{"time":"10:00","type":"food|attraction|hotel|free","title":"Name","detail":"2-3 sentences","place_id":"id"}}]}}"""

            try:
                raw = await llm.json_completion(
                    "Rewrite one day of a travel itinerary. JSON only.", prompt
                )
                new_day = json.loads(raw)
                replaced = False
                for i, d in enumerate(patched_days):
                    if d.get("day_number") == day_num:
                        patched_days[i] = new_day
                        replaced = True
                        break
                if not replaced:
                    patched_days.append(new_day)
            except Exception:
                patch_success = False
                break

        if patch_success:
            new_itinerary = {
                "itinerary": patched_days,
                "narrative": itinerary.get("narrative", "") if isinstance(itinerary, dict) else "",
            }
            supabase.table("trips").update({"itinerary": new_itinerary}).eq("id", trip_id).execute()
            return {
                "itinerary": new_itinerary,
                "message": f"Updated Day {', '.join(str(d) for d in sorted(affected_days))}!",
                "mode": "patch",
            }

    # FULL REGEN MODE
    lean_places = format_places_lean(places, max_per_category=10)
    params = {
        "destination_city": trip["destination_city"],
        "destination_country": trip.get("destination_country", ""),
        "origin_city": trip["origin_city"],
        "num_days": trip["num_days"],
        "pace": trip.get("pace", "moderate"),
        "budget_vibe": trip.get("budget_vibe", "$$"),
        "accommodation_type": trip.get("accommodation_type", "hotel"),
        "preferences": trip.get("travel_preferences", []),
        "dietary": [],
        "instructions": trip.get("instructions", ""),
        "num_travelers": trip.get("num_travelers", 1),
        "start_date": trip.get("start_date"),
        "end_date": trip.get("end_date"),
    }

    prompt = build_itinerary_prompt_lean(lean_places, params)
    response = await llm.json_completion(ITINERARY_SYSTEM_LEAN, prompt)

    try:
        itinerary_data = json.loads(response)
        supabase.table("trips").update({"itinerary": itinerary_data}).eq("id", trip_id).execute()
        return {"itinerary": itinerary_data, "message": "Full itinerary rebuilt!", "mode": "full"}
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse itinerary")

