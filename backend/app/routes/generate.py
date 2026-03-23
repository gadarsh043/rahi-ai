import asyncio
import json
import traceback
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.dependencies import get_current_user
from app.models.trip import TripGenerateRequest
from app.prompts.itinerary_v2 import (
    CHUNK_SYSTEM,
    SKELETON_SYSTEM,
    build_chunk_prompt,
    build_context_handoff,
    build_skeleton_prompt,
    get_chunks,
)
from app.prompts.essentials import (
    ESSENTIALS_SYSTEM,
    build_essentials_prompt,
    build_itinerary_summary,
)
from app.services.cost_service import estimate_trip_cost
from app.services.essentials_service import (
    detect_visa_status,
    get_travel_essentials,
    get_visa_info,
    is_domestic_travel,
    normalize_country_code,
)
from app.services.geocode_service import geocode_city
from app.services.flight_service import FlightService
from app.services.llm_service import get_llm
from app.services.places_service import (
    deduplicate_places,
    fetch_all_categories,
    format_places_lean,
    sort_places_by_budget,
)
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
                    "message": "You've used all your free trips! Email adarsh@rahify.com to request more credits.",
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

    # Accumulators used across phases
    all_days: list[dict] = []
    narrative: str = ""
    cost_data: dict | None = None
    visa_info: dict | None = None
    travel_essentials: dict | None = None
    transport_mode: str | None = None
    transport_data: dict | None = None

    try:
        # Pace validation and mapping
        valid_paces = {'relaxed', 'moderate', 'active', 'intense'}
        raw_pace = (req.pace or "").lower()
        if raw_pace not in valid_paces:
            if "relaxed" in raw_pace and "active" in raw_pace:
                req.pace = "moderate"
            elif "active" in raw_pace or "intense" in raw_pace:
                req.pace = "active"
            elif "relaxed" in raw_pace:
                req.pace = "relaxed"
            else:
                req.pace = "moderate"

        # ── Phase 0: Initial status ──
        yield sse_event(
            "status",
            {"phase": "fetching", "message": "Finding real places for your trip..."},
        )

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

        # ── Phase 1: Fetch places, then deduplicate + sort for AI ──
        all_places = await fetch_all_categories(dest_lat, dest_lng)

        # Flatten all places into one list for storage and cost estimation
        flat_places: list[dict] = []
        for cat, places in all_places.items():
            for p in places:
                flat_places.append(p)

        # Send previews per category (existing SSE event)
        for cat, places in all_places.items():
            if places:
                previews = [
                    {
                        "name": p["name"],
                        "rating": p.get("rating"),
                        "photo_url": p.get("photo_url"),
                    }
                    for p in places[:3]
                ]
                yield sse_event(
                    "places_preview",
                    {"category": cat, "count": len(places), "preview": previews},
                )

        # Deduplicate and budget-sort for the AI prompt only
        deduped_places = deduplicate_places(flat_places)
        budget_vibe = req.budget_vibe or "$$"
        sorted_places_for_ai = sort_places_by_budget(deduped_places, budget_vibe)

        # Compact text for the LLM prompts
        places_text_for_ai = format_places_lean(sorted_places_for_ai, max_per_category=10)

        yield sse_event(
            "status",
            {
                "phase": "planning",
                "message": f"Found {len(flat_places)} places. Designing your trip shape...",
            },
        )

        # ── Phase 2: Skeleton generation ──
        params = req.model_dump()

        def _safe_json_loads(text: str) -> dict:
            """Best-effort JSON parsing that tolerates markdown fences."""
            try:
                # Strip markdown fences if present
                cleaned = text.strip()
                if cleaned.startswith("```"):
                    cleaned = cleaned.strip("`")
                    # After stripping backticks, try to find first brace
                start = cleaned.find("{")
                end = cleaned.rfind("}") + 1
                if start != -1 and end > start:
                    cleaned = cleaned[start:end]
                return json.loads(cleaned)
            except Exception:
                return {}

        try:
            skeleton_raw = await llm.generate(
                system=SKELETON_SYSTEM,
                user=build_skeleton_prompt(params),
                max_tokens=800,
            )
            skeleton_parsed = _safe_json_loads(skeleton_raw)
            skeleton = skeleton_parsed.get("skeleton", []) or []
            if not skeleton:
                raise ValueError("Initial generation returned invalid or empty JSON")
        except Exception:
            # Fallback: try JSON mode once
            try:
                skeleton_json = await llm.json_completion(
                    SKELETON_SYSTEM, build_skeleton_prompt(params)
                )
                skeleton_parsed = _safe_json_loads(skeleton_json)
                skeleton = skeleton_parsed.get("skeleton", []) or []
            except Exception:
                skeleton = []

        if not skeleton:
            raise RuntimeError("Failed to generate trip skeleton.")

        # New SSE event: skeleton
        yield sse_event("skeleton", {"skeleton": skeleton})

        # ── Phase 3: Chunked itinerary generation ──
        yield sse_event(
            "status",
            {"phase": "generating", "message": "Planning your day-by-day itinerary..."},
        )

        num_days = params.get("num_days") or req.num_days or 1
        chunks = get_chunks(num_days, chunk_size=5)

        all_places_used_for_context: list[dict] = []
        context_handoff = ""

        for chunk_index, chunk_days in enumerate(chunks):
            # Status update per chunk (existing status event)
            yield sse_event(
                "status",
                {
                    "phase": "generating",
                    "message": f"Planning days {min(chunk_days)}-{max(chunk_days)}...",
                },
            )

            # Retry each chunk once on failure
            chunk_result: dict = {}
            last_error: Exception | None = None
            for attempt in range(2):
                try:
                    chunk_raw = await llm.generate(
                        system=CHUNK_SYSTEM,
                        user=build_chunk_prompt(
                            places_text=places_text_for_ai,
                            params=params,
                            skeleton=skeleton,
                            chunk_days=chunk_days,
                            context_handoff=context_handoff,
                        ),
                        max_tokens=3500,
                    )
                    chunk_result = _safe_json_loads(chunk_raw)
                    if chunk_result.get("itinerary"):
                        break
                except Exception as e:
                    last_error = e
                    await asyncio.sleep(0.5)

            if not chunk_result.get("itinerary"):
                # If a chunk still fails after retry, emit error with partial itinerary
                if last_error:
                    traceback.print_exc()
                yield sse_event(
                    "error",
                    {
                        "message": "We had trouble planning part of your trip. "
                        "Some days may be missing — please try again.",
                        "retry": True,
                    },
                )
                break

            chunk_days_data = chunk_result.get("itinerary", []) or []

            # Narrative only comes from the first chunk (existing narrative_chunk event)
            if chunk_index == 0:
                narrative = chunk_result.get("narrative", "") or ""
                if narrative:
                    yield sse_event("narrative_chunk", {"text": narrative})

            # Accumulate and emit this chunk (new itinerary_chunk event)
            all_days.extend(chunk_days_data)
            yield sse_event(
                "itinerary_chunk",
                {
                    "chunk_index": chunk_index,
                    "days": chunk_days_data,
                },
            )

            # Build context handoff for the next chunk to avoid repeats
            for day in chunk_days_data:
                for act in day.get("activities", []) or []:
                    pid = act.get("place_id")
                    if pid:
                        all_places_used_for_context.append(
                            {
                                "title": act.get("title", ""),
                                "place_id": pid,
                                "type": act.get("type", "free"),
                            }
                        )

            context_handoff = build_context_handoff(
                generated_days=chunk_days_data,
                places_used=all_places_used_for_context,
            )

        # Emit combined itinerary for backward compatibility (existing event)
        yield sse_event(
            "itinerary",
            {
                "trip_id": trip_id,
                "days": all_days,
                "narrative": narrative,
            },
        )

        # ── Phase 4: Cost estimation (formula-based, no AI) ──
        places_lookup = {p.get("google_place_id"): p for p in flat_places}
        cost_data = estimate_trip_cost(
            itinerary=all_days,
            places_lookup=places_lookup,
            num_travelers=req.num_travelers or 1,
            num_days=num_days,
        )
        yield sse_event("cost_estimate", cost_data)

        # ── Phase 5: Transport (existing logic, unchanged) ──
        # Normalize countries for distance / domestic checks
        dest_country = normalize_country_code(req.destination_country or "")
        origin_country = normalize_country_code(req.origin_country or "")

        try:
            if (
                origin_lat is not None
                and origin_lng is not None
                and dest_lat
                and dest_lng
            ):
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

                same_country = is_domestic_travel(origin_country, dest_country)

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
                    dest_code = req.destination_iata or resolve_iata(
                        req.destination_city or ""
                    )
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
            traceback.print_exc()
            transport_mode = None
            transport_data = None

        # ── Phase 6: Essentials AI call (after itinerary) ──
        yield sse_event(
            "status",
            {"phase": "essentials", "message": "Preparing travel tips and essentials..."},
        )

        # Static fallback in case LLM essentials fail
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
        passport = normalize_country_code(
            req.passport_country or profile.get("passport_country") or ""
        )

        if req.lives_in_destination is True:
            visa_fallback = {
                "visa_required": False,
                "note": "You live here — no visa needed!",
                "checklist": [],
                "warnings": [],
            }
        elif is_domestic_travel(origin_country, dest_country):
            visa_fallback = {
                "visa_required": False,
                "note": "Domestic travel. Carry valid government ID and booking confirmations.",
                "checklist": [],
                "warnings": [],
            }
        else:
            visa_fallback = get_visa_info(passport, dest_country, visa_status)
        travel_essentials_fallback = get_travel_essentials(dest_country)

        essentials_data: dict = {}
        try:
            itinerary_summary = build_itinerary_summary(all_days)
            essentials_raw = await llm.generate(
                system=ESSENTIALS_SYSTEM,
                user=build_essentials_prompt(params, itinerary_summary),
                max_tokens=2000,
            )
            essentials_data = _safe_json_loads(essentials_raw)
            if not essentials_data:
                raise RuntimeError("Empty essentials response")
        except Exception:
            traceback.print_exc()
            essentials_data = {}

        # Final visa_info + travel_essentials payloads (SSE + DB)
        if essentials_data.get("visa"):
            visa_info = essentials_data.get("visa") or {}
        else:
            visa_info = visa_fallback

        travel_essentials = essentials_data or travel_essentials_fallback

        yield sse_event("visa_info", visa_info)
        yield sse_event("travel_essentials", travel_essentials)

        # ── Phase 7: Save to Supabase ──
        try:
            itinerary_payload = {
                "itinerary": all_days,
                "narrative": narrative,
            }

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
                    "itinerary": itinerary_payload,
                    "cost_estimate": cost_data,
                    "transport_mode": transport_mode,
                    "transport_data": transport_data,
                    "visa_info": visa_info,
                    "travel_essentials": travel_essentials,
                    "status": "planning",
                }
            ).execute()

            # Build a map of place_ids used in the itinerary (with day/time)
            itin_place_map: dict[str, dict] = {}
            for day in all_days:
                day_num = day.get("day_number")
                for act in day.get("activities", []) or []:
                    pid = act.get("place_id")
                    if pid:
                        itin_place_map[pid] = {
                            "day_number": day_num,
                            "time_slot": act.get("time"),
                        }

            for p in flat_places:
                gpid = p["google_place_id"]
                in_itin = gpid in itin_place_map
                itin_info = itin_place_map.get(gpid, {})
                supabase.table("trip_places").insert(
                    {
                        "trip_id": trip_id,
                        "google_place_id": gpid,
                        "name": p["name"],
                        "category": p["category"],
                        "lat": p.get("lat"),
                        "lng": p.get("lng"),
                        "rating": p.get("rating"),
                        "user_rating_count": p.get("user_rating_count"),
                        "price_level": p.get("price_level"),
                        "address": p.get("address"),
                        "photo_url": p.get("photo_url"),
                        "google_maps_url": p.get("google_maps_url"),
                        "website": p.get("website", ""),
                        "opening_hours_display": p.get("opening_hours_display", ""),
                        "description": p.get("description", ""),
                        "type_display": p.get("type_display", ""),
                        "is_in_itinerary": in_itin,
                        "day_number": itin_info.get("day_number"),
                        "time_slot": itin_info.get("time_slot"),
                    }
                ).execute()

            # Deduct one credit after successful trip creation
            try:
                cr = (
                    supabase.table("profiles")
                    .select("trips_remaining")
                    .eq("id", user["id"])
                    .single()
                    .execute()
                )
                current = (cr.data or {}).get("trips_remaining")
                if current is not None and current > 0:
                    (
                        supabase.table("profiles")
                        .update({"trips_remaining": current - 1})
                        .eq("id", user["id"])
                        .execute()
                    )
            except Exception:
                # Don't block the response if credit deduction fails
                pass

            yield sse_event("done", {"trip_id": trip_id, "message": "Your trip is ready!"})

        except Exception:
            traceback.print_exc()
            yield sse_event(
                "error",
                {
                    "message": "We couldn't save your trip. Please try again.",
                    "retry": True,
                },
            )

    except Exception as e:
        traceback.print_exc()
        yield sse_event("error", {"message": str(e), "retry": True})

