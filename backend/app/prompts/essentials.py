ESSENTIALS_SYSTEM_V1 = """You are a travel information expert. Provide accurate travel essentials. Respond in JSON format only:
{
  "visa_info": {
    "visa_required": true/false,
    "type": "visa type",
    "validity": "validity period",
    "processing": "processing time and steps",
    "warnings": ["warning 1", "warning 2"],
    "checklist": [{"id": "ck1", "text": "item text"}]
  },
  "travel_essentials": {
    "language": "primary language",
    "emergency_numbers": {"police": "number", "ambulance": "number"},
    "tipping": "tipping customs",
    "power_plug": "plug type and voltage",
    "sim_advice": "SIM card recommendation",
    "water_safety": "tap water info",
    "timezone": "timezone info",
    "currency_info": "currency and payment tips",
    "weather_note": "weather for travel dates",
    "dress_code": "dress code tips"
  }
}"""


def build_essentials_prompt_v1(params: dict) -> str:
    return (
        f"Travel from {params['origin_city']} "
        f"({params.get('passport_country', 'Unknown passport')}) to "
        f"{params['destination_city']}, {params.get('destination_country', '')}.\n"
        f"Dates: {params.get('start_date', 'Unknown')} to "
        f"{params.get('end_date', 'Unknown')}.\n"
        "Provide visa info and travel essentials."
    )


ESSENTIALS_SYSTEM = """You are a practical travel advisor. Generate travel essentials that are SPECIFIC to this exact trip — not generic advice.

You will receive the completed itinerary with day-by-day activities. Use the actual activities to generate relevant advice. Do NOT give generic "wear comfortable clothes" — tell them what to wear for EACH day based on what they're actually doing.

RULES:
- Be specific to the destination, season, and activities
- If origin_country == destination_country: it's domestic travel — skip visa, just mention "carry valid ID and booking confirmations"
- Weather must match the ACTUAL month and destination, not generic
- Dress code is PER DAY based on that day's activities
- Emergency numbers must be REAL for the destination country
- Language phrases must be for the LOCAL language (don't give English phrases for English-speaking countries)
- Tipping culture must be SPECIFIC: "15-20% at restaurants, $1-2 per drink at bars, round up taxi fare" not just "tipping is customary"

OUTPUT FORMAT (JSON):
{
  "visa": {
    "required": true/false,
    "type": "tourist/transit/none",
    "domestic_note": "only if domestic travel — 'Domestic travel. Carry valid government ID and booking confirmations.'",
    "details": "specific visa info if international",
    "processing_time": "X business days",
    "documents_needed": ["passport valid 6mo+", "return ticket", "hotel booking"],
    "warnings": ["any alerts"]
  },
  "weather": {
    "summary": "March in London: 8-14°C (46-57°F), frequent light rain, 11-12 hours daylight",
    "pack": ["waterproof jacket", "layers", "umbrella", "comfortable walking shoes"],
    "warnings": ["sunset by 6:15pm — plan outdoor activities before then"]
  },
  "dress_code": [
    {"day": 1, "suggestion": "Casual layers for city walking. Comfortable shoes — you'll cover 5+ miles today."},
    {"day": 3, "suggestion": "Hiking boots and moisture-wicking layers for Cotswolds. Waterproof jacket."},
    {"day": 5, "suggestion": "Smart casual for evening fine dining. Collared shirt / nice dress."},
    {"day": 7, "suggestion": "Modest dress for temple visit — covered shoulders and knees. Change for evening out."}
  ],
  "practical": {
    "emergency_numbers": {"police": "999/112", "ambulance": "999/112", "tourist_police": "if applicable"},
    "tipping": "Specific tipping guide for this country",
    "power_plug": "Type G (3 rectangular pins). Bring a universal adapter.",
    "sim_card": "Buy a Three or EE tourist SIM at Heathrow arrivals, ~£20 for 30 days unlimited data.",
    "water": "Tap water is safe to drink throughout the UK.",
    "currency": "GBP (£). Contactless widely accepted. Carry £20-30 cash for small shops and markets.",
    "language_phrases": [
      {"phrase": "Local phrase", "meaning": "English meaning", "pronunciation": "phonetic guide"}
    ],
    "timezone": "GMT/BST (UTC+0/+1)"
  },
  "seasonal_alerts": [
    "Hampton Court Maze closed November-March",
    "Chelsea Flower Show May 20-24 — book tickets in advance if interested"
  ],
  "documents_checklist": [
    "Passport (valid 6+ months past return date)",
    "Printed/digital hotel confirmation",
    "Travel insurance details",
    "Copies of important documents (email to yourself)"
  ]
}"""


def build_essentials_prompt(
    params: dict,
    itinerary_summary: str,
) -> str:
    """Build prompt for essentials generation, using completed itinerary as context."""
    dest = params.get("destination_city", "")
    dest_country = params.get("destination_country", "")
    origin_country = params.get("origin_country", "")
    passport = params.get("passport_country", origin_country)
    num_days = params.get("num_days", 7)
    start_date = params.get("start_date", "unknown")

    group = params.get("travel_group", "solo")
    group_labels = {
        "solo": "Solo traveler",
        "couple": "Couple",
        "friends": "Group of friends",
        "family": "Family with kids",
        "work": "Business traveler",
    }
    group_desc = group_labels.get(group, group)

    is_domestic = (origin_country or "").strip().upper() == (
        dest_country or ""
    ).strip().upper()
    domestic_note = (
        "\n⚠️ This is DOMESTIC travel (same country). Skip full visa section. "
        "Just mention: 'Domestic travel — carry valid government ID and booking confirmations.'"
        if is_domestic
        else ""
    )

    instructions = params.get("instructions", "").strip()
    instructions_block = (
        f'\nSpecial notes from traveler: "{instructions}"' if instructions else ""
    )

    # Extract month from start_date
    month = "unknown"
    if start_date and start_date != "unknown":
        try:
            from datetime import datetime

            dt = datetime.strptime(str(start_date), "%Y-%m-%d")
            month = dt.strftime("%B %Y")
        except Exception:
            month = str(start_date)[:7]

    return f"""Generate travel essentials for a {num_days}-day trip.

Destination: {dest}, {dest_country}
Origin country: {origin_country}
Passport: {passport}
Travel dates: {start_date} ({month})
Travelers: {params.get('num_travelers', 1)} ({group_desc})
Budget: {params.get('budget_vibe', '$$')}{domestic_note}{instructions_block}

═══ COMPLETED ITINERARY (use this for dress code and alerts) ═══
{itinerary_summary}

Generate specific, practical essentials based on the actual activities above. Dress code must reference specific days and their activities. Weather must be for {month} in {dest}. If domestic travel, minimize visa section.

JSON only."""


def build_itinerary_summary(itinerary: list) -> str:
    """Compress the itinerary into a summary for the essentials prompt."""
    lines: list[str] = []
    for day in itinerary:
        day_num = day.get("day_number", "?")
        title = day.get("title", "")
        activities = day.get("activities", [])
        activity_summaries: list[str] = []
        for activity in activities:
            atype = activity.get("type", "free")
            atitle = activity.get("title", "")
            activity_summaries.append(f"{atype}: {atitle}")
        lines.append(f"Day {day_num} — {title}: {', '.join(activity_summaries)}")
    return "\n".join(lines)

