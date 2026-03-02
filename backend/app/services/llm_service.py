from typing import AsyncGenerator

from groq import AsyncGroq

from app.config import get_settings


class LLMService:
    def __init__(self):
        settings = get_settings()
        self.provider = settings.llm_provider
        if self.provider == "groq":
            self.client = AsyncGroq(api_key=settings.groq_api_key)
            self.model = "llama-3.3-70b-versatile"
        else:
            self.client = None
            self.model = ""

    async def stream_completion(
        self, system_prompt: str, user_prompt: str
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
                max_tokens=4000,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta

    async def completion(self, system_prompt: str, user_prompt: str) -> str:
        """Non-streaming completion. Returns full text."""
        if self.provider == "groq" and self.client:
            resp = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,
                max_tokens=4000,
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


