import asyncio
import json
import traceback
import uuid

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.dependencies import get_current_user
from app.models.trip import TripGenerateRequest
from app.prompts.essentials import ESSENTIALS_SYSTEM, build_essentials_prompt
from app.prompts.itinerary import ITINERARY_SYSTEM, build_itinerary_prompt
from app.services.geocode_service import geocode_city
from app.services.llm_service import get_llm
from app.services.places_service import fetch_all_categories
from app.utils.supabase_client import get_supabase

router = APIRouter()


@router.post("/generate")
async def generate_trip(req: TripGenerateRequest, user=Depends(get_current_user)):
    return StreamingResponse(
        generate_stream(req, user),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


def sse_event(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


async def generate_stream(req: TripGenerateRequest, user: dict):
    trip_id = str(uuid.uuid4())
    llm = get_llm()
    supabase = get_supabase()

    itinerary_data: dict | None = None
    cost_data: dict | None = None
    essentials_data: dict | None = None

    try:
        # Phase 1: Status
        yield sse_event("status", {"phase": "fetching", "message": "Finding the best places..."})

        # Geocode if needed (frontend may not send lat/lng)
        dest_lat = req.destination_lat
        dest_lng = req.destination_lng
        if not dest_lat or not dest_lng:
            geo = await geocode_city(req.destination_city)
            if geo:
                dest_lat = geo["lat"]
                dest_lng = geo["lng"]

        # Phase 2: Fetch places (parallel)
        all_places = await fetch_all_categories(dest_lat, dest_lng)

        # Flatten all places into one list
        flat_places: list[dict] = []
        for cat, places in all_places.items():
            for p in places:
                flat_places.append(p)

        # Send previews per category
        for cat, places in all_places.items():
            if places:
                previews = [
                    {"name": p["name"], "rating": p.get("rating"), "photo_url": p.get("photo_url")}
                    for p in places[:3]
                ]
                yield sse_event(
                    "places_preview",
                    {"category": cat, "count": len(places), "preview": previews},
                )

        yield sse_event(
            "status",
            {
                "phase": "planning",
                "message": f"Found {len(flat_places)} places! Crafting your itinerary...",
            },
        )

        # Phase 3: Generate itinerary via LLM (stream chunks)
        params = req.model_dump()
        itinerary_prompt = build_itinerary_prompt(flat_places, params)

        full_response = ""
        async for chunk in llm.stream_completion(ITINERARY_SYSTEM, itinerary_prompt):
            full_response += chunk
            yield sse_event("narrative_chunk", {"text": chunk})

        # Parse itinerary JSON from response
        try:
            json_start = full_response.find("{")
            json_end = full_response.rfind("}") + 1
            if json_start >= 0 and json_end > json_start:
                itinerary_data = json.loads(full_response[json_start:json_end])
        except json.JSONDecodeError:
            itinerary_data = None

        if itinerary_data is None:
            # Fallback: request JSON separately
            json_response = await llm.json_completion(ITINERARY_SYSTEM, itinerary_prompt)
            try:
                itinerary_data = json.loads(json_response)
            except Exception:
                itinerary_data = {"itinerary": [], "narrative": ""}

        yield sse_event(
            "itinerary",
            {
                "trip_id": trip_id,
                "days": itinerary_data.get("itinerary", []),
                "narrative": itinerary_data.get("narrative", ""),
            },
        )

        # Phase 4: Essentials + Cost (parallel)
        yield sse_event(
            "status",
            {"phase": "enriching", "message": "Getting visa info and cost estimates..."},
        )

        essentials_prompt = build_essentials_prompt(params)

        cost_system = (
            'You are a travel cost estimator. Based on the destination, duration, budget level, and '
            'accommodation type, estimate costs. Respond in JSON only: '
            '{"accommodation":{"total":N,"per_night":N,"nights":N},'
            '"food":{"total":N,"per_day":N},'
            '"activities":{"total":N},'
            '"flights":{"total":N},'
            '"local_transport":{"total":N},'
            '"total":N,"per_person":N,"daily_avg":N,"currency":"USD"}'
        )
        cost_prompt = (
            f"Estimate trip costs: {req.num_days} days in {req.destination_city}, "
            f"{req.budget_vibe} budget, {req.accommodation_type}, {req.num_travelers} travelers, "
            f"currency {req.currency}."
        )

        essentials_task = llm.json_completion(ESSENTIALS_SYSTEM, essentials_prompt)
        cost_task = llm.json_completion(cost_system, cost_prompt)

        essentials_raw, cost_raw = await asyncio.gather(
            essentials_task, cost_task, return_exceptions=True
        )

        if isinstance(essentials_raw, str):
            try:
                essentials_data = json.loads(essentials_raw)
            except Exception:
                essentials_data = {}
        else:
            essentials_data = {}

        yield sse_event("visa_info", essentials_data.get("visa_info", {}) if essentials_data else {})
        yield sse_event(
            "travel_essentials",
            essentials_data.get("travel_essentials", {}) if essentials_data else {},
        )

        if isinstance(cost_raw, str):
            try:
                cost_data = json.loads(cost_raw)
            except Exception:
                cost_data = {"total": 0}
        else:
            cost_data = {"total": 0}

        if isinstance(cost_data, dict):
            cost_data["label"] = "estimated"

        yield sse_event("cost_estimate", cost_data)

        # Phase 5: Save to Supabase
        try:
            supabase.table("trips").insert(
                {
                    "id": trip_id,
                    "user_id": user["id"],
                    "origin_city": req.origin_city,
                    "origin_country": req.origin_country,
                    "origin_lat": req.origin_lat,
                    "origin_lng": req.origin_lng,
                    "destination_city": req.destination_city,
                    "destination_country": req.destination_country,
                    "destination_lat": dest_lat,
                    "destination_lng": dest_lng,
                    "start_date": str(req.start_date) if req.start_date else None,
                    "end_date": str(req.end_date) if req.end_date else None,
                    "num_days": req.num_days,
                    "pace": req.pace,
                    "budget_vibe": req.budget_vibe,
                    "accommodation_type": req.accommodation_type,
                    "travel_preferences": req.preferences,
                    "instructions": req.instructions,
                    "num_travelers": req.num_travelers,
                    "raw_places_data": {"places": flat_places},
                    "itinerary": itinerary_data,
                    "cost_estimate": cost_data,
                    "status": "planning",
                }
            ).execute()

            for p in flat_places:
                supabase.table("trip_places").insert(
                    {
                        "trip_id": trip_id,
                        "google_place_id": p["google_place_id"],
                        "name": p["name"],
                        "category": p["category"],
                        "lat": p.get("lat"),
                        "lng": p.get("lng"),
                        "rating": p.get("rating"),
                        "price_level": p.get("price_level"),
                        "address": p.get("address"),
                        "photo_url": p.get("photo_url"),
                        "google_maps_url": p.get("google_maps_url"),
                        "is_in_itinerary": False,
                    }
                ).execute()
        except Exception as e:
            print(f"Supabase save error: {e}")

        yield sse_event("done", {"trip_id": trip_id, "message": "Your trip is ready!"})

    except Exception as e:
        traceback.print_exc()
        yield sse_event("error", {"message": str(e), "retry": True})

