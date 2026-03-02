import asyncio

import httpx

from app.config import get_settings

PLACES_URL = "https://places.googleapis.com/v1/places:searchNearby"

# Category mapping to Google Places types
CATEGORY_TYPES = {
    "restaurant": ["restaurant", "meal_delivery", "meal_takeaway", "cafe"],
    "hotel": ["lodging"],
    "attraction": [
        "tourist_attraction",
        "museum",
        "art_gallery",
        "amusement_park",
        "zoo",
        "aquarium",
    ],
    "nightlife": ["night_club", "bar"],
    "cafe": ["cafe", "bakery"],
    "outdoor": ["park", "campground", "hiking_area"],
}


async def fetch_places_nearby(
    lat: float,
    lng: float,
    category: str,
    max_results: int = 20,
    radius: int = 15000,
) -> list[dict]:
    """Fetch nearby places from Google Places API (New). Returns list of normalized place dicts."""
    settings = get_settings()
    if not settings.google_places_api_key:
        return []

    included_types = CATEGORY_TYPES.get(category, ["tourist_attraction"])

    body = {
        "includedTypes": included_types,
        "maxResultCount": min(max_results, 20),
        "locationRestriction": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": radius,
            }
        },
    }

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": settings.google_places_api_key,
        "X-Goog-FieldMask": (
            "places.id,places.displayName,places.formattedAddress,"
            "places.location,places.rating,places.priceLevel,places.photos,"
            "places.types,places.regularOpeningHours,places.websiteUri,"
            "places.googleMapsUri"
        ),
    }

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(PLACES_URL, json=body, headers=headers)
        if resp.status_code != 200:
            print(f"Google Places error: {resp.status_code} {resp.text[:200]}")
            return []
        data = resp.json()

    places: list[dict] = []
    for p in data.get("places", []):
        photo_url = None
        if p.get("photos"):
            photo_name = p["photos"][0].get("name", "")
            if photo_name:
                photo_url = (
                    f"https://places.googleapis.com/v1/{photo_name}/media"
                    f"?maxWidthPx=400&key={settings.google_places_api_key}"
                )

        price_level_map = {
            "PRICE_LEVEL_FREE": 0,
            "PRICE_LEVEL_INEXPENSIVE": 1,
            "PRICE_LEVEL_MODERATE": 2,
            "PRICE_LEVEL_EXPENSIVE": 3,
            "PRICE_LEVEL_VERY_EXPENSIVE": 4,
        }

        places.append(
            {
                "google_place_id": p.get("id", ""),
                "name": p.get("displayName", {}).get("text", "Unknown"),
                "category": category,
                "lat": p.get("location", {}).get("latitude"),
                "lng": p.get("location", {}).get("longitude"),
                "rating": p.get("rating"),
                "price_level": price_level_map.get(p.get("priceLevel", ""), None),
                "address": p.get("formattedAddress", ""),
                "photo_url": photo_url,
                "google_maps_url": p.get("googleMapsUri", ""),
                "website": p.get("websiteUri", ""),
                "types": p.get("types", []),
                "opening_hours": p.get("regularOpeningHours", {}),
            }
        )

    return places


async def fetch_all_categories(lat: float, lng: float) -> dict[str, list]:
    """Fetch places for all main categories in parallel.

    Returns { 'restaurant': [...], 'hotel': [...], ... }.
    """
    categories: list[tuple[str, int]] = [
        ("restaurant", 20),
        ("hotel", 20),
        ("attraction", 20),
        ("nightlife", 10),
        ("cafe", 10),
        ("outdoor", 10),
    ]

    tasks = [fetch_places_nearby(lat, lng, cat, count) for cat, count in categories]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    all_places: dict[str, list] = {}
    for (cat, _), result in zip(categories, results):
        if isinstance(result, Exception):
            print(f"Error fetching {cat}: {result}")
            all_places[cat] = []
        else:
            all_places[cat] = result

    return all_places


def summarize_hours(opening_hours: dict | None) -> str:
    """Compress Google's verbose opening hours into a short string."""
    if not opening_hours:
        return "hours N/A"

    periods = opening_hours.get("periods", [])
    if not periods:
        weekday_text = opening_hours.get("weekdayDescriptions", [])
        if weekday_text:
            first = weekday_text[0] if weekday_text else ""
            if ":" in first:
                hours_part = first.split(":", 1)[1].strip()
                return hours_part[:20]
        return "hours N/A"

    if len(periods) == 1:
        p = periods[0]
        if p.get("open", {}).get("hour") == 0 and not p.get("close"):
            return "24hrs"

    first_period = periods[0]
    open_h = first_period.get("open", {}).get("hour", 0)
    open_m = first_period.get("open", {}).get("minute", 0)
    close_h = first_period.get("close", {}).get("hour", 17)
    close_m = first_period.get("close", {}).get("minute", 0)

    def fmt(h, m):
        suffix = "AM" if h < 12 else "PM"
        display_h = h if h <= 12 else h - 12
        if display_h == 0:
            display_h = 12
        if m:
            return f"{display_h}:{m:02d}{suffix}"
        return f"{display_h}{suffix}"

    return f"{fmt(open_h, open_m)}-{fmt(close_h, close_m)}"


def format_places_lean(places: list, max_per_category: int = 10) -> str:
    """
    Format places as compact strings for LLM prompt.
    Pre-filters to top places by rating per category.
    """
    by_cat: dict[str, list] = {}
    for p in places:
        cat = p.get("category", "other")
        by_cat.setdefault(cat, []).append(p)

    lines: list[str] = []
    for cat, items in by_cat.items():
        sorted_items = sorted(
            items, key=lambda x: x.get("rating") or 0, reverse=True
        )[:max_per_category]

        lines.append(f"\n### {cat.upper()} ({len(sorted_items)} places)")
        for p in sorted_items:
            name = p.get("name", "Unknown")
            place_id = p.get("google_place_id", "")
            rating = p.get("rating", "N/A")
            price = (
                "$" * (p.get("price_level") or 1)
                if p.get("price_level") is not None
                else "?"
            )
            hours = summarize_hours(p.get("opening_hours"))
            famous = p.get("famous_for", "")

            line = f"- {name} (ID:{place_id}) | ⭐{rating} | {price} | 🕐{hours}"
            if famous:
                line += f" | {famous}"
            lines.append(line)

    return "\n".join(lines)


