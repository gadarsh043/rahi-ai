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


