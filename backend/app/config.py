from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    env: str = "development"
    supabase_url: str
    supabase_anon_key: str
    supabase_service_key: str
    google_places_api_key: str = ""
    groq_api_key: str = ""
    serpapi_key: str = ""
    llm_provider: str = "groq"
    dev_user_id: str = "test-user-uuid-123"
    frontend_url: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()

