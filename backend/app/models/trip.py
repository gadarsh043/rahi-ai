from datetime import date
from typing import Optional

from pydantic import BaseModel


class TripGenerateRequest(BaseModel):
    origin_city: str
    origin_country: str
    origin_lat: float
    origin_lng: float
    destination_city: str
    destination_country: str
    destination_lat: float
    destination_lng: float
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    num_days: int = 7
    pace: str = "moderate"
    budget_vibe: str = "$$"
    accommodation_type: str = "hotel"
    preferences: list[str] = []
    passport_country: str = ""
    instructions: str = ""
    dietary: list[str] = []
    disability: list[str] = []
    travel_group: str = "solo"
    num_travelers: int = 1
    lives_in_destination: Optional[bool] = None
    currency: str = "USD"


class ChatRequest(BaseModel):
    trip_id: str
    message: str


class PickRequest(BaseModel):
    trip_id: str
    selected_place_ids: list[str]
    removed_place_ids: list[str] = []
    custom_additions: list[dict] = []


class NearbyRequest(BaseModel):
    lat: float
    lng: float
    categories: list[str] = ["restaurant", "attraction", "hotel"]
    radius_meters: int = 2000


