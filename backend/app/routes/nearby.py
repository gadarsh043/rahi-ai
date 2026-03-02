from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.models.trip import NearbyRequest
from app.services.places_service import fetch_places_nearby

router = APIRouter()


@router.post("/nearby")
async def get_nearby(req: NearbyRequest, user=Depends(get_current_user)):
    results: dict[str, list] = {}
    for cat in req.categories:
        results[cat] = await fetch_places_nearby(
            req.lat,
            req.lng,
            cat,
            max_results=10,
            radius=req.radius_meters,
        )
    total = sum(len(v) for v in results.values())
    return {"places": results, "total": total}

