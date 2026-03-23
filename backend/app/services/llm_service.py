from typing import AsyncGenerator

from groq import AsyncGroq

from app.config import get_settings


# MODEL CONFIGURATION
# Testing/budget mode: all calls use 8b-instant (~$0.001/trip)
# Production mode: switch MAIN_MODEL back to llama-3.3-70b-versatile (~$0.01/trip)
MAIN_MODEL = "llama-3.1-8b-instant"
FAST_MODEL = "llama-3.1-8b-instant"


class LLMService:
    def __init__(self):
        settings = get_settings()
        self.provider = settings.llm_provider
        if self.provider == "groq":
            self.client = AsyncGroq(api_key=settings.groq_api_key)
            self.model = MAIN_MODEL
        else:
            self.client = None
            self.model = ""

    async def stream_completion(
        self, system_prompt: str, user_prompt: str, max_tokens: int = 4000
    ) -> AsyncGenerator[str, None]:
        """Stream text chunks from LLM."""
        if self.provider == "groq" and self.client:
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                stream=True,
                temperature=0.7,
                max_tokens=max_tokens,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta

    async def completion(
        self, system_prompt: str, user_prompt: str, max_tokens: int = 4000
    ) -> str:
        """Non-streaming completion. Returns full text."""
        if self.provider == "groq" and self.client:
            resp = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,
                max_tokens=max_tokens,
            )
            return resp.choices[0].message.content
        return ""

    async def generate(
        self, system: str, user: str, max_tokens: int = 4000
    ) -> str:
        """
        Generic generate helper for the V2 pipeline.
        Used for skeleton, chunked itinerary, and essentials calls.
        """
        return await self.completion(system, user, max_tokens=max_tokens)

    async def generate_fast(
        self, system: str, user: str, max_tokens: int = 4000
    ) -> str:
        """
        Fast generate helper using a smaller/faster model.
        """
        if self.provider == "groq" and self.client:
            resp = await self.client.chat.completions.create(
                model=FAST_MODEL,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                temperature=0.7,
                max_tokens=max_tokens,
            )
            return resp.choices[0].message.content
        return ""

    async def chat_completion(
        self, system_prompt: str, messages: list[dict], user_prompt: str
    ) -> str:
        """Completion with chat history. messages = [{role, content}, ...]."""
        if self.provider == "groq" and self.client:
            msgs = [{"role": "system", "content": system_prompt}]
            # Include recent history (keep it tight — last 6 turns max)
            for m in messages[-6:]:
                msgs.append({"role": m["role"], "content": m["content"]})
            msgs.append({"role": "user", "content": user_prompt})
            resp = await self.client.chat.completions.create(
                model=self.model,
                messages=msgs,
                temperature=0.75,
                max_tokens=1000,
            )
            return resp.choices[0].message.content
        return ""

    async def json_completion(self, system_prompt: str, user_prompt: str) -> str:
        """Completion with JSON mode."""
        if self.provider == "groq" and self.client:
            resp = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.5,
                max_tokens=4000,
                response_format={"type": "json_object"},
            )
            return resp.choices[0].message.content
        return ""


_llm: LLMService | None = None


def get_llm() -> LLMService:
    global _llm
    if _llm is None:
        _llm = LLMService()
    return _llm


