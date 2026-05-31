from pydantic_settings import BaseSettings, SettingsConfigDict
import os


class Settings(BaseSettings):

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Server
    api_base_path: str
    cors_origins: str

    # MongoDB
    mongodb_uri: str
    mongo_db_name: str
    # JWT
    jwt_secret_key: str
    jwt_algorithm: str
    jwt_access_token_expire_minutes: int


def get_settings() -> Settings:
    return Settings()

