import httpx

PHOTON_URL = "https://photon.komoot.io/api/"


async def geocode_city(city_name: str) -> dict | None:
    """Returns { lat, lng, city, country, display_name } or None."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            PHOTON_URL,
            params={"q": city_name, "limit": 1, "lang": "en"},
        )
        if resp.status_code != 200:
            return None

        data = resp.json()
        if not data.get("features"):
            return None

        feat = data["features"][0]
        coords = feat["geometry"]["coordinates"]
        props = feat["properties"]

        return {
            "lat": coords[1],
            "lng": coords[0],
            "city": props.get("name", city_name),
            "country": props.get("country", ""),
            "display_name": props.get("name", "") + ", " + props.get("country", ""),
        }


