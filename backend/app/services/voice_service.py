from fastapi import HTTPException, status

from ai_module.voice_processor import process_voice_request
from app.core.config import get_settings
from database.mongo import get_database


async def process_voice(
    *,
    db,
    user_id: str,
    language: str,
    audio_bytes: bytes | None,
    audio_mime: str | None,
    transcript_text: str | None,
    password: str | None,
    current_user: dict,
):
    return await process_voice_request(
        db=db,
        user_id=user_id,
        language=language,
        audio_bytes=audio_bytes,
        audio_mime=audio_mime,
        transcript_text=transcript_text,
        password=password,
        current_user=current_user,
    )


async def process_public_voice(
    *,
    email: str,
    language: str,
    audio_bytes: bytes | None,
    audio_mime: str | None,
    transcript_text: str | None,
    password: str | None,
):
    settings = get_settings()
    db = get_database(settings.mongodb_uri, settings.mongo_db_name)
    users_col = db["users"]

    user = await users_col.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found for the provided email.")

    user_id = str(user["_id"])
    return await process_voice_request(
        db=db,
        user_id=user_id,
        language=language,
        audio_bytes=audio_bytes,
        audio_mime=audio_mime,
        transcript_text=transcript_text,
        password=password,
        current_user=user,
    )

