import json

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.llm_service import get_llm

router = APIRouter()


class FactsRequest(BaseModel):
    city: str


@router.post("/destination-facts")
async def destination_facts(req: FactsRequest):
    llm = get_llm()

    system_prompt = (
        "You are a travel trivia expert. Return exactly 10 fun, surprising, "
        "and lesser-known facts about the given city or destination. "
        "Keep each fact to one short sentence (under 20 words). "
        "Return JSON: {\"facts\": [\"fact1\", \"fact2\", ...]}"
    )
    user_prompt = f"Give me 10 fun facts about {req.city}."

    try:
        raw = await llm.json_completion(system_prompt, user_prompt)
        data = json.loads(raw)
        facts = data.get("facts", [])[:10]
        return {"facts": facts}
    except Exception:
        return {"facts": []}
