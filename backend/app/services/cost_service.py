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

