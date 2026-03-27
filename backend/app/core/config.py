from pydantic_settings import BaseSettings, SettingsConfigDict
import os


class Settings(BaseSettings):
    """
    Application configuration loaded from environment variables (and .env if present).
    """

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Server
    api_base_path: str = "/api"
    cors_origins: str = "*"  # comma-separated or "*" for all

    # MongoDB
    mongodb_uri: str = "mongodb+srv://veludas005:velu1234@cluster0.dyzgf0d.mongodb.net/AIBankingApp?retryWrites=true&w=majority&appName=Cluster0"
    mongo_db_name: str = "voice_banking_support"

    # JWT
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60


def get_settings() -> Settings:
    return Settings()

