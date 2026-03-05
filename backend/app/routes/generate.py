import asyncio
import json
import traceback
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.dependencies import get_current_user
from app.models.trip import TripGenerateRequest
from app.prompts.itinerary import ITINERARY_SYSTEM_LEAN, build_itinerary_prompt_lean
from app.services.cost_service import estimate_costs
from app.services.essentials_service import (
    detect_visa_status,
    get_travel_essentials,
    get_visa_info,
    normalize_country_code,
)
from app.services.geocode_service import geocode_city
from app.services.flight_service import FlightService
from app.services.llm_service import get_llm
from app.services.places_service import fetch_all_categories, format_places_lean
from app.utils.iata_codes import resolve_iata
from app.utils.supabase_client import get_supabase

router = APIRouter()


@router.post("/generate")
async def generate_trip(req: TripGenerateRequest, user=Depends(get_current_user)):
    # Simple credits gate: 5 free trips, then ask user to email for more.
    supabase = get_supabase()
    try:
        profile_resp = (
            supabase.table("profiles")
            .select("trips_remaining")
            .eq("id", user["id"])
            .single()
            .execute()
        )
        profile = profile_resp.data or {}
        trips_remaining = profile.get("trips_remaining")
        if trips_remaining is not None and trips_remaining <= 0:
            raise HTTPException(
                status_code=402,
                detail={
                    "message": "You've used all your free trips! Email g.adarsh043@gmail.com to request more credits.",
                    "type": "credits_exhausted",
                },
            )
    except Exception:
        # If this fails, fall through — we don't want to block generation
        pass

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
    visa_info: dict | None = None
    travel_essentials: dict | None = None

    try:
        # Phase 1: Status
        yield sse_event("status", {"phase": "fetching", "message": "Finding the best places..."})

        # Geocode destination if needed (frontend may not send lat/lng)
        dest_lat = req.destination_lat
        dest_lng = req.destination_lng
        if not dest_lat or not dest_lng:
            geo = await geocode_city(req.destination_city)
            if geo:
                dest_lat = geo["lat"]
                dest_lng = geo["lng"]

        # Basic origin coordinates fallback to request values
        origin_lat = req.origin_lat
        origin_lng = req.origin_lng

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
        lean_places_text = format_places_lean(flat_places, max_per_category=10)
        itinerary_prompt = build_itinerary_prompt_lean(lean_places_text, params)

        full_response = ""
        async for chunk in llm.stream_completion(ITINERARY_SYSTEM_LEAN, itinerary_prompt):
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
            json_response = await llm.json_completion(ITINERARY_SYSTEM_LEAN, itinerary_prompt)
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

        # Phase 4: Transport + Visa + Essentials + Costs
        yield sse_event(
            "status",
            {
                "phase": "enriching",
                "message": "Figuring out flights, visa info, and cost estimates...",
            },
        )

        # Pull optional profile settings (visa status, passport country)
        profile = {}
        try:
            profile_resp = (
                supabase.table("profiles")
                .select("visa_status, passport_country")
                .eq("id", user["id"])
                .single()
                .execute()
            )
            profile = profile_resp.data or {}
        except Exception:
            profile = {}

        visa_status = detect_visa_status(req.instructions) or profile.get("visa_status")
        dest_country = normalize_country_code(req.destination_country or "")
        passport = normalize_country_code(req.passport_country or profile.get("passport_country") or "")
        origin_country = normalize_country_code(req.origin_country or "")

        if req.lives_in_destination is True:
            visa_info = {
                "visa_required": False,
                "note": "You live here — no visa needed!",
                "checklist": [],
                "warnings": [],
            }
        else:
            visa_info = get_visa_info(passport, dest_country, visa_status)
        travel_essentials = get_travel_essentials(dest_country)
        cost_data = estimate_costs(
            destination_country=dest_country,
            num_days=req.num_days,
            budget_vibe=req.budget_vibe,
            accommodation_type=req.accommodation_type,
            num_travelers=req.num_travelers,
            origin_country=origin_country,
            currency=req.currency,
        )

        # Decide transport mode based on distance
        transport_mode = None
        transport_data: dict | None = None

        try:
            if origin_lat is not None and origin_lng is not None and dest_lat and dest_lng:
                # Simple great-circle distance
                from math import atan2, cos, radians, sin, sqrt

                R = 6371.0
                lat1 = radians(origin_lat)
                lat2 = radians(dest_lat)
                dlat = radians(dest_lat - origin_lat)
                dlng = radians(dest_lng - origin_lng)
                a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlng / 2) ** 2
                c = 2 * atan2(sqrt(a), sqrt(1 - a))
                distance_km = R * c

                same_country = origin_country == dest_country and origin_country is not None

                if distance_km > 800:
                    transport_mode = "flight"
                elif distance_km > 300 and not same_country:
                    transport_mode = "flight"
                elif distance_km > 300 and same_country:
                    transport_mode = "flight"
                elif distance_km > 50:
                    transport_mode = "drive"
                else:
                    transport_mode = "drive"

                transport_payload = {
                    "mode": transport_mode,
                    "distance_km": round(distance_km, 1),
                }

                # If we can, attach reasoning
                if transport_mode == "flight":
                    transport_payload["reasoning"] = (
                        f"Approx. {int(distance_km)} km between cities — flying is the most practical option."
                    )
                else:
                    hours = distance_km / 80 if distance_km else 0
                    transport_payload["reasoning"] = (
                        f"Short to medium distance (~{int(distance_km)} km) — driving is a good fit."
                    )

                # If mode is flight and we have basic dates, call FlightService
                if transport_mode == "flight":
                    origin_code = req.origin_iata or resolve_iata(req.origin_city or "")
                    dest_code = req.destination_iata or resolve_iata(req.destination_city or "")
                    departure_date = str(req.start_date) if req.start_date else ""
                    return_date = str(req.end_date) if req.end_date else None

                    if origin_code and dest_code and departure_date:
                        flights_result = await FlightService.search_flights(
                            origin_code=origin_code,
                            destination_code=dest_code,
                            departure_date=departure_date,
                            return_date=return_date,
                            adults=req.num_travelers or 1,
                        )
                        transport_data = {
                            "mode": transport_mode,
                            "origin_code": origin_code,
                            "destination_code": dest_code,
                            "departure_date": departure_date,
                            "return_date": return_date,
                            **flights_result,
                        }
                        transport_payload.update(
                            {
                                "flights": flights_result.get("flights", []),
                                "cached": flights_result.get("cached", False),
                                "fetched_at": flights_result.get("fetched_at"),
                                "next_refresh": flights_result.get("next_refresh"),
                            }
                        )

                yield sse_event("transport", transport_payload)
        except Exception:
            transport_mode = None
            transport_data = None

        yield sse_event("visa_info", visa_info)
        yield sse_event("travel_essentials", travel_essentials)
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
                    "transport_mode": transport_mode,
                    "transport_data": transport_data,
                    "visa_info": visa_info,
                    "travel_essentials": travel_essentials,
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

