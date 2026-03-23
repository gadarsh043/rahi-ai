ACCOMMODATION_COSTS = {
    "hotel": {"$": 50, "$$": 120, "$$$": 220, "$$$$": 450},
    "hostel": {"$": 15, "$$": 30, "$$$": 50, "$$$$": 80},
    "apartment": {"$": 40, "$$": 90, "$$$": 180, "$$$$": 350},
}

FOOD_PER_DAY = {"$": 20, "$$": 50, "$$$": 90, "$$$$": 160}
ACTIVITIES_PER_DAY = {"$": 10, "$$": 30, "$$$": 60, "$$$$": 120}
LOCAL_TRANSPORT_PER_DAY = {"$": 5, "$$": 15, "$$$": 30, "$$$$": 60}

COUNTRY_MULTIPLIER = {
    "US": 1.0,
    "UK": 1.15,
    "FR": 1.1,
    "DE": 1.0,
    "JP": 1.05,
    "AU": 1.1,
    "SG": 1.2,
    "AE": 1.1,
    "CH": 1.6,
    "NO": 1.4,
    "TH": 0.35,
    "IN": 0.25,
    "VN": 0.3,
    "ID": 0.3,
    "PH": 0.35,
    "MX": 0.45,
    "CO": 0.35,
    "BR": 0.45,
    "AR": 0.35,
    "EG": 0.25,
    "MA": 0.35,
    "ZA": 0.45,
    "KE": 0.35,
    "TR": 0.4,
    "GR": 0.7,
    "PT": 0.7,
    "ES": 0.8,
    "IT": 0.9,
    "KR": 0.85,
    "TW": 0.65,
    "MY": 0.35,
    "NZ": 1.0,
}

FLIGHT_ESTIMATES = {
    "domestic_short": 150,
    "domestic_long": 300,
    "international_short": 500,
    "international_medium": 900,
    "international_long": 1300,
}


def estimate_costs_v1(
    destination_country: str,
    num_days: int,
    budget_vibe: str,
    accommodation_type: str,
    num_travelers: int,
    origin_country: str = None,
    flight_data: dict = None,
    currency: str = "USD",
) -> dict:
    multiplier = COUNTRY_MULTIPLIER.get((destination_country or "").upper(), 0.8)
    vibe = budget_vibe if budget_vibe in ("$", "$$", "$$$", "$$$$") else "$$"
    accom_type = (
        accommodation_type if accommodation_type in ACCOMMODATION_COSTS else "hotel"
    )
    nights = max((num_days or 1) - 1, 1)

    accom_per_night = ACCOMMODATION_COSTS[accom_type][vibe] * multiplier
    food_per_day = FOOD_PER_DAY[vibe] * multiplier
    activities_per_day = ACTIVITIES_PER_DAY[vibe] * multiplier
    transport_per_day = LOCAL_TRANSPORT_PER_DAY[vibe] * multiplier

    travelers = max(int(num_travelers or 1), 1)
    rooms_needed = max(1, (travelers + 1) // 2)
    accom_total = accom_per_night * nights * rooms_needed

    food_total = food_per_day * (num_days or 1) * travelers
    activities_total = activities_per_day * (num_days or 1) * travelers
    transport_total = transport_per_day * (num_days or 1) * travelers

    if flight_data and flight_data.get("total"):
        flight_total = flight_data["total"]
    else:
        if origin_country and origin_country.upper() == (destination_country or "").upper():
            flight_total = FLIGHT_ESTIMATES["domestic_short"] * travelers
        elif origin_country:
            flight_total = FLIGHT_ESTIMATES["international_medium"] * travelers
        else:
            flight_total = FLIGHT_ESTIMATES["international_medium"] * travelers

    total = accom_total + food_total + activities_total + transport_total + flight_total
    per_person = total / travelers if travelers > 0 else total
    daily_avg = total / (num_days or 1) if (num_days or 0) > 0 else total

    return {
        "accommodation": {
            "total": round(accom_total),
            "per_night": round(accom_per_night),
            "nights": nights,
            "rooms": rooms_needed,
        },
        "food": {"total": round(food_total), "per_day": round(food_per_day * travelers)},
        "activities": {
            "total": round(activities_total),
            "per_day": round(activities_per_day * travelers),
        },
        "local_transport": {
            "total": round(transport_total),
            "per_day": round(transport_per_day * travelers),
        },
        "flights": {
            "total": round(flight_total),
            "per_person": round(flight_total / travelers) if travelers > 0 else 0,
        },
        "total": round(total),
        "per_person": round(per_person),
        "daily_avg": round(daily_avg),
        "currency": currency,
        "label": "estimated",
        "num_travelers": travelers,
    }


def estimate_costs(
    destination_country: str,
    num_days: int,
    budget_vibe: str,
    accommodation_type: str,
    num_travelers: int,
    origin_country: str = None,
    flight_data: dict = None,
    currency: str = "USD",
) -> dict:
    """
    Backwards-compatible wrapper around the original v1 estimator.
    New V2 pipeline should prefer `estimate_trip_cost` instead.
    """
    return estimate_costs_v1(
        destination_country=destination_country,
        num_days=num_days,
        budget_vibe=budget_vibe,
        accommodation_type=accommodation_type,
        num_travelers=num_travelers,
        origin_country=origin_country,
        flight_data=flight_data,
        currency=currency,
    )


# ─────────────────────────────────────────────────────────────
# V2 COST ESTIMATION — PRICE_LEVEL-BASED, NO AI CALL
# ─────────────────────────────────────────────────────────────

COST_PER_MEAL = {
    0: (5, 10),  # No price level data — assume budget
    1: (8, 15),  # $ — street food, budget eats
    2: (15, 30),  # $$ — casual dining
    3: (30, 60),  # $$$ — nice restaurants
    4: (60, 150),  # $$$$ — fine dining
}


HOTEL_PER_NIGHT = {
    0: (40, 80),
    1: (30, 60),  # $ — hostel, budget hotel
    2: (60, 120),  # $$ — mid-range
    3: (120, 250),  # $$$ — nice hotel
    4: (250, 500),  # $$$$ — luxury
}


ACTIVITY_COST = {
    "free": 0,  # walks, viewpoints, parks
    "attraction_free": 0,  # free museums, public spaces
    "attraction_paid": (15, 35),  # museums, tours, temples with entry
    "day_trip_transport": (20, 60),  # train/bus to nearby city
}


def estimate_trip_cost(
    itinerary, places_lookup: dict, num_travelers: int, num_days: int
) -> dict:
    """
    Estimate trip costs from the generated itinerary and real place data.

    - Uses Google Places `price_level` for hotels and food.
    - Activities are averaged per paid attraction.
    - Transport includes daily local transport + day-trip transport.
    """
    total_food = 0.0
    total_hotel = 0.0
    total_activities = 0.0
    total_transport = 0.0

    hotel_counted = False
    travelers = max(int(num_travelers or 1), 1)
    days = max(int(num_days or 1), 1)

    for day in itinerary or []:
        for activity in day.get("activities", []):
            pid = activity.get("place_id")
            atype = activity.get("type", "free")
            place = places_lookup.get(pid) if pid else None
            price_level = place.get("price_level", 0) if place else 0

            if atype == "food":
                low, high = COST_PER_MEAL.get(price_level, (10, 20))
                total_food += ((low + high) / 2.0) * travelers

            elif atype == "hotel" and not hotel_counted:
                low, high = HOTEL_PER_NIGHT.get(price_level, (60, 120))
                # N-1 nights for a N-day trip
                nights = max(days - 1, 1)
                total_hotel += ((low + high) / 2.0) * nights
                hotel_counted = True

            elif atype == "attraction":
                # Heuristic: assume paid attraction average when marked as attraction
                low, high = ACTIVITY_COST.get("attraction_paid", (15, 35))
                total_activities += ((low + high) / 2.0) * travelers

            elif atype == "free":
                title = (activity.get("title") or "").lower()
                if "day trip" in title or "transit" in title:
                    low, high = ACTIVITY_COST.get("day_trip_transport", (20, 60))
                    total_transport += (low + high) / 2.0

    # Local transport (daily estimate)
    daily_transport = 15 * travelers  # taxi/metro/bus per day
    total_transport += daily_transport * days

    grand_total = total_food + total_hotel + total_activities + total_transport

    return {
        "accommodation": round(total_hotel),
        "food": round(total_food),
        "activities": round(total_activities),
        "transport": round(total_transport),
        "total": round(grand_total),
        "per_person": round(grand_total / travelers),
        "daily_avg": round(grand_total / days),
        "label": "estimated",
    }

