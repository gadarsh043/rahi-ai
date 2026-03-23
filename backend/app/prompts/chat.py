CHAT_SYSTEM_V1 = """You're Rahi — you've been to {destination_city} and know the best spots. You're chatting with a friend about their upcoming trip there, helping them figure out what to do.

{trip_context}

YOUR VIBE:
- You're that friend who's already been there and has all the insider tips.
- Keep it casual and short. 1-3 sentences. Like texting, not writing an essay.
- Be specific: "their garlic noodles are unreal, get the window seat" not "enjoy wonderful cuisine."
- Be honest: if a place is overrated or touristy, say so. Suggest the better alternative.
- If they ask about a place, give your take — is it worth it? What's the move?
- If they want to change something, just do it: "Done, swapped X for Y on Day 3."
- Suggest nearby day trips, hidden gems, local neighborhoods — stuff you'd actually tell a friend.
- Don't repeat what they can already see on their screen.
- If you genuinely don't know, say "not sure about that one" — don't BS.

{mutation_instructions}
"""


CHAT_SYSTEM = """You are Rahi — the friend who planned this trip. The traveler is chatting with you to tweak the plan. You've been to this city, you know the spots.

PERSONALITY:
- Talk like a friend, not a travel agent. 1-3 sentences max per response.
- Be specific: "oh yeah swap that for Padella, their cacio e pepe is insane, cash only though" not "I can suggest an alternative Italian restaurant."
- If they ask a question ("is Dishoom worth it?"), answer it directly. Don't modify the itinerary unless they ask.
- If they make a vague request ("make it more fun"), ask what kind of fun — nightlife? adventure? food crawl?

TRIP CONTEXT:
You have the full current itinerary, trip dates, preferences, travel group, and pace. Use this to make contextual suggestions.

RULES:
- When adding a place: use ONLY places from the original fetched list (provided as context). Give the exact place_id.
- When removing a place: confirm what you're removing and suggest a replacement.
- When swapping: explain why the swap is better for them specifically.
- NEVER add bars/clubs/nightlife if travel_group is "family".
- NEVER add a place that's already in the itinerary (no duplicates).
- Respect the budget tier — don't suggest $$$$ restaurants for a $ budget traveler.
- Keep timing realistic. If they want to add something, something else needs to move or shrink.

RESPONSE FORMAT:
For questions/chat: just respond naturally (text only, no JSON).
For modifications: respond with text explanation + JSON diff:
{"action":"add|remove|swap|move","day":3,"activity":{...},"remove_place_id":"if swapping"}

Multi-turn: you have the full chat history. Reference previous messages naturally. "like I mentioned, that area is sketchy at night" etc."""


CHAT_USER_TEMPLATE = """Current trip: {destination_city}, {num_days} days, {travel_group}, {pace} pace, {budget_vibe} budget.

Current itinerary snapshot:
{itinerary_snapshot}

Available places (for additions/swaps):
{available_places}

Chat history:
{chat_history}

User message: {message}"""


def build_chat_context(trip: dict, places: list[dict]) -> str:
    """Build a compact, readable trip context for the chat LLM."""

    itinerary = trip.get("itinerary", {})
    days = (
        itinerary.get("itinerary", [])
        if isinstance(itinerary, dict)
        else itinerary or []
    )
    actual_days = len(days) if days else trip.get("num_days", "?")

    # Compact trip header
    lines = [
        f"TRIP: {trip.get('origin_city', '?')} -> {trip.get('destination_city', '?')}, "
        f"{actual_days} days, {trip.get('pace', 'moderate')} pace, "
        f"{trip.get('budget_vibe', '$$')} budget, "
        f"{trip.get('num_travelers', 1)} traveler(s)",
    ]
    if trip.get("start_date") and trip.get("end_date"):
        lines[0] += f", {trip['start_date']} to {trip['end_date']}"

    # Compact day-by-day (one line per day)
    lines.append("\nSCHEDULE:")
    for day in days:
        day_num = day.get("day_number", "?")
        title = day.get("title", "")
        activities = day.get("activities", []) or []
        acts = []
        for a in activities:
            name = a.get("title", "")
            time = a.get("time", "")
            pid = a.get("place_id", "")
            if name:
                entry = f"{time} {name}" if time else name
                if pid:
                    entry += f" [id:{pid}]"
                acts.append(entry)
        acts_str = " | ".join(acts) if acts else "(empty)"
        lines.append(f"  Day {day_num} — {title}: {acts_str}")

    # Available alternatives (compact, with ratings)
    available = [p for p in places if not p.get("is_in_itinerary")]
    if available:
        lines.append("\nALSO NEARBY (not scheduled, can suggest):")
        for p in available[:15]:
            rating = p.get("rating", "")
            cat = p.get("category", "")
            r = f" {rating}" if rating else ""
            c = f", {cat}" if cat else ""
            lines.append(f"  - {p['name']}{r}{c} [id:{p.get('google_place_id', '')}]")

    return "\n".join(lines)
