CHAT_SYSTEM = """You are Rahi, an AI travel planning assistant. You are helping the user modify their trip itinerary.

{trip_context}

RULES:
1. You can see the CURRENT ITINERARY above. ALWAYS check it before answering.
2. If the user asks about a place, check if it's actually in the itinerary before saying "it's not there."
3. If the user asks about weather, dates, or timing — USE THE TRIP DATES shown above. Don't ask them to provide dates.
4. When removing a place, suggest a DIFFERENT replacement (not something already in the itinerary).
5. When the user asks something trip-related, give SHORT, confident answers. No long generic ones.
6. Never suggest a place that's already in the itinerary for the same purpose.
7. If you need clarification, ask ONE short question — not a multi-paragraph response.

RESPONSE STYLE:
- Be concise. 2-4 sentences for info questions.
- For modifications, state what you did clearly: "Removed X from Day 2, added Y at 10:00 AM."
- Use the trip's destination knowledge. You know about {destination_city}.
- Never say "I'll need to know your dates" — you already have them.

{mutation_instructions}
"""


def build_chat_context(trip: dict, places: list[dict]) -> str:
    """Build a compact but complete context string for chat."""

    meta = f"""TRIP DETAILS:
- Route: {trip.get('origin_city', '?')} to {trip.get('destination_city', '?')}
- Dates: {trip.get('start_date', 'flexible')} to {trip.get('end_date', 'flexible')}
- Duration: {trip.get('num_days', '?')} days
- Travelers: {trip.get('num_travelers', 1)}
- Pace: {trip.get('pace', 'moderate')}
- Budget: {trip.get('budget_vibe', '$$')}
"""

    itinerary = trip.get("itinerary", {})
    days = itinerary.get("itinerary", []) if isinstance(itinerary, dict) else itinerary or []

    itin_lines: list[str] = ["CURRENT ITINERARY:"]
    for day in days:
        day_num = day.get("day_number", "?")
        title = day.get("title", "")
        itin_lines.append(f"\nDay {day_num}: {title}")
        for act in day.get("activities", []) or []:
            time = act.get("time", "")
            name = act.get("title", "")
            act_type = act.get("type", "")
            place_id = act.get("place_id", "")
            itin_lines.append(f"  {time} | {name} [{act_type}] (id:{place_id})")

    itin_text = "\n".join(itin_lines)

    available = [p["name"] for p in places if not p.get("is_in_itinerary")]
    available_text = ""
    if available:
        available_text = (
            "\nAVAILABLE PLACES (not in itinerary, can suggest): "
            + ", ".join(available[:20])
        )

    return meta + "\n" + itin_text + available_text

