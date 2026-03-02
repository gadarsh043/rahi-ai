from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.dependencies import get_current_user
from app.models.trip import ChatRequest
from app.prompts.chat import CHAT_SYSTEM
from app.services.llm_service import get_llm
from app.utils.supabase_client import get_supabase
import json

router = APIRouter()


@router.get("/test-llm")
async def test_llm():
    from app.services.llm_service import get_llm

    llm = get_llm()
    result = await llm.completion(
        "You are a helpful assistant.",
        "Say hello in 10 words or less.",
    )
    return {"response": result}


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
    llm = get_llm()
    supabase = get_supabase()

    # Load trip context
    trip_resp = (
        supabase.table("trips")
        .select("*")
        .eq("id", req.trip_id)
        .single()
        .execute()
    )
    trip = trip_resp.data

    places_resp = (
        supabase.table("trip_places")
        .select("*")
        .eq("trip_id", req.trip_id)
        .execute()
    )
    places = places_resp.data or []

    history_resp = (
        supabase.table("chat_messages")
        .select("*")
        .eq("trip_id", req.trip_id)
        .order("created_at")
        .execute()
    )
    history = history_resp.data or []

    places_summary = "\n".join(
        [
            f"- {p['name']} (ID: {p['google_place_id']}, category: {p['category']}, in_itinerary: {p.get('is_in_itinerary', False)})"
            for p in places
        ]
    )

    recent_chat = "\n".join(
        [f"{m['role']}: {m['content']}" for m in history[-5:]]
    )

    context = f"""Current trip: {trip['origin_city']} → {trip['destination_city']}, {trip['num_days']} days, {trip['pace']} pace.

Current places:
{places_summary}

Current itinerary:
{json.dumps(trip.get('itinerary', {}), indent=2)[:2000]}

Recent chat:
{recent_chat}"""

    user_prompt = f"{context}\n\nUser request: {req.message}"

    # Save user message
    supabase.table("chat_messages").insert(
        {
            "trip_id": req.trip_id,
            "role": "user",
            "content": req.message,
        }
    ).execute()

    try:
        # Get AI response (JSON mode for structured changes)
        response_raw = await llm.json_completion(CHAT_SYSTEM, user_prompt)
        response_data = json.loads(response_raw)

        ai_message = response_data.get("message", "I've updated your trip!")
        changes = response_data.get("changes", [])

        # Stream the message in small chunks
        for i in range(0, len(ai_message), 20):
            chunk = ai_message[i : i + 20]
            yield f"event: message_chunk\ndata: {json.dumps({'text': chunk})}\n\n"

        # Apply changes to database
        for change in changes:
            action = change.get("action")
            place_id = change.get("place_id")
            if not action or not place_id:
                continue

            if action == "remove":
                (
                    supabase.table("trip_places")
                    .update(
                        {
                            "is_in_itinerary": False,
                            "day_number": None,
                            "time_slot": None,
                        }
                    )
                    .eq("trip_id", req.trip_id)
                    .eq("google_place_id", place_id)
                    .execute()
                )
            elif action == "add":
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
                    .eq("google_place_id", place_id)
                    .execute()
                )

        yield f"event: itinerary_update\ndata: {json.dumps({'changes': changes})}\n\n"

        # Save assistant message
        supabase.table("chat_messages").insert(
            {
                "trip_id": req.trip_id,
                "role": "assistant",
                "content": ai_message,
                "itinerary_diff": {"changes": changes},
            }
        ).execute()

        yield f"event: done\ndata: {json.dumps({'message': 'done'})}\n\n"

    except Exception as e:  # noqa: BLE001
        yield f"event: error\ndata: {json.dumps({'message': str(e)})}\n\n"


