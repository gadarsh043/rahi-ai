import copy
import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.dependencies import get_current_user
from app.models.trip import ChatRequest
from app.services.llm_service import get_llm
from app.services.chat_engine import (
    classify_message,
    format_day_summaries,
    format_day_schedule,
)
from app.utils.supabase_client import get_supabase
from app.prompts.chat import CHAT_SYSTEM, build_chat_context

router = APIRouter()


CLASSIFIER_SYSTEM = """You classify travel itinerary chat messages. Given a user message and their places list, determine intent.

Respond ONLY with this JSON:
{
  "intent": "remove" | "add" | "swap" | "vibe_change" | "question" | "other",
  "target_place": "name or null",
  "new_place": "name or null",
  "target_day": number or null,
  "preference": "description or null"
}

Examples:
- "I don't like Kerry Park, too touristy" → {"intent":"remove", "target_place":"Kerry Park", "preference":"touristy"}
- "Something more romantic for day 3" → {"intent":"vibe_change", "target_day":3, "preference":"romantic"}
- "How far is the aquarium?" → {"intent":"question", "target_place":"aquarium"}"""


VIBE_CHANGE_SYSTEM = """You're Rahi AI, a friendly travel planner. The user wants to change the vibe of a specific day.

Given the current day schedule and available alternative places, suggest swaps.

IMPORTANT FORMATTING RULES:
- Use line breaks between items
- Use **bold** for place names
- Use emoji for visual clarity
- Keep it conversational and warm
- End with a clear question

Respond in this exact format (plain text with markdown, NOT JSON):

Here's a more [vibe] Day [N]:

🕐 [time] — **[Place Name]** (keep — [reason])
🔄 [time] → Swap **[old]** for **[new]** ([why it fits])
🔄 [time] → Swap **[old]** for **[new]** ([why it fits])

Want me to make these changes?"""


def get_actual_days(trip: dict) -> int:
    """Get the real day count from the itinerary JSON, falling back to num_days."""
    itinerary = trip.get("itinerary", {})
    days = (
        itinerary.get("itinerary", [])
        if isinstance(itinerary, dict)
        else itinerary or []
    )
    return len(days) if days else (trip.get("num_days") or 7)


def sync_places_with_itinerary(places: list, trip: dict, supabase, trip_id: str) -> list:
    """Ensure trip_places.is_in_itinerary matches the actual itinerary JSON.

    The itinerary JSON is the source of truth for what's currently scheduled.
    If a place appears in the JSON but trip_places says is_in_itinerary=False,
    fix it (both in-memory and in the DB).
    """
    itinerary = trip.get("itinerary", {})
    days = (
        itinerary.get("itinerary", [])
        if isinstance(itinerary, dict)
        else itinerary or []
    )

    # Build map: google_place_id -> {day_number, time_slot} from itinerary JSON
    itin_map: dict[str, dict] = {}
    for day in days:
        day_num = day.get("day_number")
        for act in day.get("activities", []) or []:
            pid = act.get("place_id")
            if pid:
                itin_map[pid] = {"day_number": day_num, "time_slot": act.get("time")}

    for p in places:
        gpid = p.get("google_place_id")
        if not gpid:
            continue
        in_json = gpid in itin_map
        was_marked = p.get("is_in_itinerary", False)

        if in_json and not was_marked:
            # Place is in itinerary JSON but not marked — fix it
            info = itin_map[gpid]
            p["is_in_itinerary"] = True
            p["day_number"] = info["day_number"]
            p["time_slot"] = info["time_slot"]
            try:
                (
                    supabase.table("trip_places")
                    .update(
                        {
                            "is_in_itinerary": True,
                            "day_number": info["day_number"],
                            "time_slot": info["time_slot"],
                        }
                    )
                    .eq("trip_id", trip_id)
                    .eq("google_place_id", gpid)
                    .execute()
                )
            except Exception:
                pass

    return places


def remove_from_itinerary_json(trip: dict, place_id: str, supabase, trip_id: str):
    """Remove a place from the trips.itinerary JSON so it stays in sync."""
    itinerary = trip.get("itinerary")
    if not itinerary or not isinstance(itinerary, dict):
        return
    days = itinerary.get("itinerary", [])
    if not days:
        return

    updated = copy.deepcopy(itinerary)
    changed = False
    for day in updated.get("itinerary", []):
        activities = day.get("activities", [])
        filtered = [a for a in activities if a.get("place_id") != place_id]
        if len(filtered) != len(activities):
            day["activities"] = filtered
            changed = True

    if changed:
        try:
            (
                supabase.table("trips")
                .update({"itinerary": updated})
                .eq("id", trip_id)
                .execute()
            )
            trip["itinerary"] = updated
        except Exception:
            pass


@router.post("/chat")
async def chat(req: ChatRequest, user=Depends(get_current_user)):
    return StreamingResponse(
        chat_stream(req, user),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


async def chat_stream(req: ChatRequest, user: dict):
    supabase = get_supabase()

    trip_resp = (
        supabase.table("trips")
        .select("*")
        .eq("id", req.trip_id)
        .single()
        .execute()
    )
    trip = trip_resp.data
    if not trip:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Trip not found")

    if trip.get("user_id") != user.get("id"):
        from fastapi import HTTPException

        raise HTTPException(status_code=403, detail="Not your trip")

    places_resp = (
        supabase.table("trip_places")
        .select("*")
        .eq("trip_id", req.trip_id)
        .execute()
    )
    places = places_resp.data or []

    # Sync trip_places with itinerary JSON to fix any mismatches
    places = sync_places_with_itinerary(places, trip, supabase, req.trip_id)

    # Fetch recent chat history (for LLM context + pending action)
    history_resp = (
        supabase.table("chat_messages")
        .select("*")
        .eq("trip_id", req.trip_id)
        .order("created_at", desc=True)
        .limit(10)
        .execute()
    )
    recent_messages = list(reversed(history_resp.data or []))

    last_assistant = None
    for m in reversed(recent_messages):
        if m.get("role") == "assistant":
            last_assistant = m
            break
    pending_action = None
    if last_assistant and last_assistant.get("itinerary_diff"):
        pending_action = last_assistant["itinerary_diff"].get("pending_action")

    supabase.table("chat_messages").insert(
        {
            "trip_id": req.trip_id,
            "role": "user",
            "content": req.message,
        }
    ).execute()

    result = classify_message(req.message, places, pending_action, trip)

    if result["type"] == "need_llm":
        result = await handle_llm_fallback(req.message, trip, places, recent_messages)

    if result["type"] == "ask" and result["response"] is None:
        result["response"] = build_schedule_response(result, trip, places)

    response_text = (
        result["response"] or "I'm not sure what you mean. Could you rephrase?"
    )
    changes = result.get("action")

    if changes and not isinstance(changes, list):
        changes = [changes]

    lines = response_text.split("\n")
    for i, line in enumerate(lines):
        chunk = line + ("\n" if i < len(lines) - 1 else "")
        if chunk:
            yield f"event: message_chunk\ndata: {json.dumps({'text': chunk})}\n\n"

    if changes:
        for change in changes:
            if change["action"] == "remove":
                (
                    supabase.table("trip_places")
                    .update({"is_in_itinerary": False, "day_number": None, "time_slot": None})
                    .eq("trip_id", req.trip_id)
                    .eq("google_place_id", change["place_id"])
                    .execute()
                )
                # Also remove from itinerary JSON to keep in sync
                remove_from_itinerary_json(
                    trip, change["place_id"], supabase, req.trip_id
                )
            elif change["action"] == "add":
                (
                    supabase.table("trip_places")
                    .update(
                        {
                            "is_in_itinerary": True,
                            "day_number": change.get("day_number"),
                            "time_slot": change.get("time_slot"),
                        }
                    )
                    .eq("trip_id", req.trip_id)
                    .eq("google_place_id", change["place_id"])
                    .execute()
                )

    yield (
        "event: itinerary_update\n"
        f"data: {json.dumps({'changes': changes or [], 'needs_rebuild': bool(changes)})}\n\n"
    )

    supabase.table("chat_messages").insert(
        {
            "trip_id": req.trip_id,
            "role": "assistant",
            "content": response_text,
            "itinerary_diff": {
                "changes": changes or [],
                "pending_action": result.get("pending_action"),
            },
        }
    ).execute()

    yield f"event: done\ndata: {json.dumps({'message': 'done'})}\n\n"


def build_schedule_response(result: dict, trip: dict, places: list) -> str:
    pending = result.get("pending_action", {})
    itinerary = trip.get("itinerary", {})
    days = itinerary.get("itinerary", []) if isinstance(itinerary, dict) else []

    if pending.get("awaiting") == "pick_day":
        place_name = pending.get("place_name", "this place")
        summary = format_day_summaries(days, trip.get("num_days", 7))
        return (
            f"Great choice! Where should I put **{place_name}**?\n\n"
            f"Here's your current schedule:\n\n"
            f"{summary}\n\n"
            "Which day works best?"
        )

    if pending.get("awaiting") == "pick_time":
        day_num = pending.get("day_number", 1)
        place_name = pending.get("place_name", "this place")
        schedule = format_day_schedule(days, day_num)
        return (
            f"Here's what Day {day_num} looks like:\n\n"
            f"{schedule}\n\n"
            f"What time would you like to add **{place_name}**?"
        )

    return "Could you tell me more about what you'd like to change?"


async def handle_llm_fallback(
    message: str, trip: dict, places: list, chat_history: list = None
) -> dict:
    """Fallback when rule-based classifier can't handle the message.

    Sends trip context + recent chat history to the LLM for a natural response.
    """
    llm = get_llm()

    trip_context = build_chat_context(trip, places)
    dest = trip.get("destination_city", "the destination")

    system_prompt = CHAT_SYSTEM.format(
        trip_context=trip_context,
        destination_city=dest,
        mutation_instructions=(
            "You're chatting — answer naturally. Share opinions, tips, honest takes.\n"
            "If they want actual changes (add/remove/swap), describe what you'd do "
            "but don't output JSON — the backend handles that.\n"
            "Most messages are just conversation. Respond like a friend, not a tool."
        ),
    )

    # Build history for multi-turn context
    history = []
    if chat_history:
        for m in chat_history:
            role = m.get("role")
            content = m.get("content", "")
            if role in ("user", "assistant") and content.strip():
                history.append({"role": role, "content": content})

    response_text = await llm.chat_completion(system_prompt, history, message)

    return {
        "type": "answer",
        "response": response_text,
        "action": None,
        "pending_action": None,
    }


async def handle_vibe_change(
    message: str, trip: dict, places: list, target_day: int = None, preference: str = ""
) -> dict:
    llm = get_llm()
    itinerary = trip.get("itinerary", {})
    days = itinerary.get("itinerary", []) if isinstance(itinerary, dict) else []

    day_data = None
    if target_day:
        for d in days:
            if d.get("day_number") == target_day:
                day_data = d
                break

    if not day_data and days:
        target_day = None

    not_in = [p for p in places if not p.get("is_in_itinerary")]
    alternatives = "\n".join(
        [
            f"- {p['name']} ({p['category']}) — Rating: {p.get('rating', 'N/A')}"
            for p in not_in[:15]
        ]
    )

    if day_data:
        current = "\n".join(
            [
                f"  {a.get('time', '??:??')} — {a.get('title', 'Activity')}"
                for a in day_data.get("activities", [])
            ]
        )
        user_prompt = (
            f'User wants: "{message}"\n\n'
            f"Current Day {target_day} — {day_data.get('title', '')}:\n{current}\n\n"
            f"Available alternatives:\n{alternatives}\n\n"
            f"Suggest changes for Day {target_day}. Use the format specified."
        )
    else:
        current = format_day_summaries(days, trip.get("num_days", 7))
        user_prompt = (
            f'User wants: "{message}"\n\n'
            f"Current schedule:\n{current}\n\n"
            f"Available alternatives:\n{alternatives}\n\n"
            "Suggest changes. Use the format specified."
        )

    try:
        response = await llm.completion(VIBE_CHANGE_SYSTEM, user_prompt)
        return {
            "type": "ask",
            "action": None,
            "response": response.strip(),
            "pending_action": {
                "type": "vibe_confirm",
                "awaiting": "confirm",
                "original_message": message,
                "target_day": target_day,
                "preference": preference,
            },
        }
    except Exception as e:
        return {
            "type": "ask",
            "action": None,
            "response": (
                "I had trouble thinking about that. Could you try rephrasing?\n\n"
                f"(Error: {str(e)[:100]})"
            ),
            "pending_action": None,
        }


async def handle_question(message: str, trip: dict, places: list) -> dict:
    llm = get_llm()

    in_itinerary = [p for p in places if p.get("is_in_itinerary")]
    places_brief = ", ".join([p["name"] for p in in_itinerary])

    prompt = (
        f"Trip: {trip.get('origin_city', '?')} → {trip.get('destination_city', '?')}, {get_actual_days(trip)} days.\n"
        f"Places in itinerary: {places_brief}\n\n"
        f"User question: {message}\n\n"
        "Answer helpfully and concisely. Use line breaks for readability. Use **bold** for emphasis."
    )

    try:
        response = await llm.completion(
            "You are Rahi AI, a friendly travel assistant. Answer travel questions concisely with good formatting.",
            prompt,
        )
        return {
            "type": "execute",
            "action": None,
            "response": response.strip(),
            "pending_action": None,
        }
    except Exception:
        return {
            "type": "execute",
            "action": None,
            "response": "I'm having trouble answering that right now. Could you try again?",
            "pending_action": None,
        }


async def handle_general_chat(message: str, trip: dict, places: list) -> dict:
    llm = get_llm()

    in_itinerary = [p for p in places if p.get("is_in_itinerary")]
    not_in = [p for p in places if not p.get("is_in_itinerary")][:10]

    places_text = "In itinerary:\n" + "\n".join(
        [
            f"- {p['name']} (ID: {p['google_place_id']}, Day {p.get('day_number', '?')} at {p.get('time_slot', '?')})"
            for p in in_itinerary
        ]
    )
    places_text += "\n\nAvailable (not in itinerary):\n" + "\n".join(
        [f"- {p['name']} (ID: {p['google_place_id']}, {p['category']})" for p in not_in]
    )

    from app.prompts.chat import CHAT_SYSTEM

    context = (
        f"Trip: {trip['origin_city']} → {trip['destination_city']}, {get_actual_days(trip)} days.\n\n"
        f"{places_text}\n\n"
        f"User: {message}"
    )

    try:
        raw = await llm.json_completion(CHAT_SYSTEM, context)
        data = json.loads(raw)
        return {
            "type": "execute",
            "action": data.get("changes", []) or None,
            "response": data.get("message", "Done!"),
            "pending_action": None,
        }
    except Exception:
        return {
            "type": "execute",
            "action": None,
            "response": "I had trouble processing that. Could you try a simpler request?",
            "pending_action": None,
        }


