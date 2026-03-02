ITINERARY_SYSTEM = """You are Rahi AI, a world-class travel planner. You create personalized day-by-day itineraries using ONLY the real places provided to you. Never invent places.

Rules:
- Use ONLY places from the provided list. Reference them by exact name.
- Create a day-by-day itinerary with specific times.
- Match the user's pace: relaxed = 2-3 activities/day, active = 4-5, intense = 6+.
- Include meals at the provided restaurants.
- Factor in travel time between locations.
- Respect dietary restrictions and preferences.
- Write engaging, conversational descriptions — you're a friendly travel expert.

Respond in this exact JSON format:
{
  "itinerary": [
    {
      "day_number": 1,
      "title": "Arrival & Downtown Discovery",
      "activities": [
        {
          "time": "10:30",
          "type": "flight|hotel|food|attraction|free",
          "title": "Activity title",
          "detail": "2-3 sentence description with tips",
          "place_id": "google_place_id or null"
        }
      ]
    }
  ],
  "narrative": "A 2-3 paragraph engaging overview of the entire trip."
}"""


def build_itinerary_prompt(places: list, params: dict) -> str:
    """Build the user prompt with real place data."""

    places_by_cat: dict[str, list] = {}
    for p in places:
        cat = p.get("category", "other")
        places_by_cat.setdefault(cat, []).append(p)

    places_text = ""
    for cat, items in places_by_cat.items():
        places_text += f"\n### {cat.upper()} ({len(items)} places)\n"
        for p in items:
            places_text += (
                f"- {p['name']} (ID: {p['google_place_id']}) — Rating: "
                f"{p.get('rating', 'N/A')}, Price: "
                f"{'$' * (p.get('price_level') or 1)}, "
                f"Address: {p.get('address', 'N/A')}\n"
            )

    return f"""Plan a {params['num_days']}-day trip to {params['destination_city']}, {params.get('destination_country', '')}.

Trip details:
- From: {params['origin_city']}
- Dates: {params.get('start_date', 'Flexible')} to {params.get('end_date', 'Flexible')}
- Travelers: {params.get('num_travelers', 1)}
- Pace: {params['pace']}
- Budget: {params['budget_vibe']}
- Stay: {params.get('accommodation_type', 'hotel')}
- Interests: {', '.join(params.get('preferences', []))}
- Dietary: {', '.join(params.get('dietary', []))}
- Special instructions: {params.get('instructions', 'None')}

Available REAL places (use ONLY these):
{places_text}

Create the itinerary now. Remember: JSON format only, use exact place names and IDs from the list above."""


