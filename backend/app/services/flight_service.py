import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

import httpx

SERPAPI_URL = "https://serpapi.com/search"


class FlightService:
    @staticmethod
    async def search_flights(
        origin_code: str,
        destination_code: str,
        departure_date: str,
        return_date: Optional[str] = None,
        adults: int = 1,
    ) -> Dict[str, Any]:
        """
        Search flights via SerpAPI Google Flights.

        Returns a dict shaped for storage in trips.transport_data:
        {
            "flights": [...],
            "cached": bool,
            "fetched_at": iso8601,
            "next_refresh": iso8601,
            "note"?: str,
            "error"?: str,
        }
        """
        from app.utils.supabase_client import get_supabase
        from app.config import get_settings

        supabase = get_supabase()
        settings = get_settings()
        # Prefer typed settings, but also fall back to raw env so backend/.env works
        serpapi_key = settings.serpapi_key or os.getenv("SERPAPI_KEY", "")

        # 1) Check cache first
        cache_query = (
            supabase.table("flight_cache")
            .select("*")
            .eq("origin_code", origin_code)
            .eq("destination_code", destination_code)
            .eq("departure_date", departure_date)
        )

        if return_date:
            cache_query = cache_query.eq("return_date", return_date)
        else:
            cache_query = cache_query.is_("return_date", None)

        cache_result = cache_query.execute()
        cached_row = (cache_result.data or [None])[0]

        if cached_row:
            fetched_at_raw = cached_row.get("fetched_at")
            try:
                fetched_at = datetime.fromisoformat(
                    str(fetched_at_raw).replace("Z", "+00:00")
                )
            except Exception:
                fetched_at = datetime.now(timezone.utc)

            now_utc = datetime.now(timezone.utc)
            # If fetched_at is naive (e.g. old DB), treat as UTC for age check
            if fetched_at.tzinfo is None:
                fetched_at = fetched_at.replace(tzinfo=timezone.utc)
            age_minutes = (now_utc - fetched_at).total_seconds() / 60

            if age_minutes < 10:
                flights = (cached_row.get("results") or {}).get("flights", [])
                return {
                    "flights": flights,
                    "cached": True,
                    "fetched_at": fetched_at.isoformat(),
                    "next_refresh": (fetched_at + timedelta(minutes=10)).isoformat(),
                }

        # 2) If no SERPAPI_KEY, degrade gracefully
        now_iso = datetime.now(timezone.utc).isoformat()
        if not serpapi_key:
            return {
                "flights": [],
                "cached": False,
                "fetched_at": now_iso,
                "note": "Flight search not configured. Add SERPAPI_KEY to backend environment.",
            }

        # 3) Fetch from SerpAPI
        # SerpAPI Google Flights:
        # type=1 round trip (default) and requires return_date
        # type=2 one way
        params: Dict[str, Any] = {
            "engine": "google_flights",
            "departure_id": origin_code,
            "arrival_id": destination_code,
            "outbound_date": departure_date,
            "type": "1" if return_date else "2",
            "adults": adults,
            "currency": "USD",
            "hl": "en",
            "api_key": serpapi_key,
        }
        if return_date:
            params["return_date"] = return_date

        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(SERPAPI_URL, params=params)
                resp.raise_for_status()
                data = resp.json()

            flights: List[Dict[str, Any]] = []
            best_flights_raw = data.get("best_flights") or []
            other_flights_raw = data.get("other_flights") or []
            # Tag source, then merge (best first)
            tagged: List[Tuple[Dict[str, Any], str]] = [
                (o, "best") for o in best_flights_raw
            ] + [
                (o, "other") for o in other_flights_raw
            ]
            tagged = tagged[:8]

            for option, source_tag in tagged:
                flight_legs = option.get("flights") or []
                if not flight_legs:
                    continue

                first_leg = flight_legs[0]
                last_leg = flight_legs[-1]

                # SerpAPI returns times as strings (e.g., "10:30am") or ISO — pass through
                flights.append(
                    {
                        "id": option.get("booking_token") or option.get("id"),
                        "airline": first_leg.get("airline", "Unknown"),
                        "airline_logo": first_leg.get("airline_logo", ""),
                        "flight_number": first_leg.get("flight_number", ""),
                        "departure_airport": (
                            (first_leg.get("departure_airport") or {}).get("id")
                            or origin_code
                        ),
                        "departure_time": (first_leg.get("departure_airport") or {}).get(
                            "time", ""
                        ),
                        "arrival_airport": (
                            (last_leg.get("arrival_airport") or {}).get("id")
                            or destination_code
                        ),
                        "arrival_time": (last_leg.get("arrival_airport") or {}).get(
                            "time", ""
                        ),
                        "duration_minutes": option.get("total_duration", 0),
                        "stops": max(len(flight_legs) - 1, 0),
                        "stop_airports": [
                            (leg.get("arrival_airport") or {}).get("id", "")
                            for leg in flight_legs[:-1]
                        ],
                        "price_usd": option.get("price", 0),
                        "booking_token": option.get("booking_token", ""),
                        "carbon_emissions": (
                            (option.get("carbon_emissions") or {}).get(
                                "this_flight", 0
                            )
                        ),
                        "tag": source_tag,
                    }
                )

            fetched_at = datetime.now(timezone.utc)
            cache_data = {
                "origin_code": origin_code,
                "destination_code": destination_code,
                "departure_date": departure_date,
                "return_date": return_date,
                "results": {"flights": flights},
                "fetched_at": fetched_at.isoformat(),
            }

            # Upsert into cache (Supabase Python client supports on_conflict kwarg)
            try:
                (
                    supabase.table("flight_cache")
                    .upsert(
                        cache_data,
                        on_conflict="origin_code,destination_code,departure_date,return_date",
                    )
                    .execute()
                )
            except Exception:
                # Cache failures shouldn't break the request
                pass

            return {
                "flights": flights,
                "cached": False,
                "fetched_at": fetched_at.isoformat(),
                "next_refresh": (fetched_at + timedelta(minutes=10)).isoformat(),
            }

        except Exception as e:  # pragma: no cover - best-effort network call
            print(f"SerpAPI error: {e}")
            return {
                "flights": [],
                "cached": False,
                "fetched_at": datetime.now(timezone.utc).isoformat(),
                "error": "Flight search temporarily unavailable",
            }

    @staticmethod
    def get_skyscanner_url(origin: str, dest: str, date: str) -> str:
        """
        Generate a basic Skyscanner search URL.

        Note: origin/dest should be IATA codes (e.g. HYD, DFW).
        date: 'YYYY-MM-DD' → 'YYMMDD'
        """
        try:
            date_fmt = date.replace("-", "")[2:]  # 2026-03-12 → 260312
        except Exception:
            date_fmt = ""
        return f"https://www.skyscanner.com/transport/flights/{origin}/{dest}/{date_fmt}/"

