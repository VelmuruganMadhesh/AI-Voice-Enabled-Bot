from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.core.config import get_settings
from app.core.response import api_response
from app.core.security import get_current_user
from app.models.voice import VoiceProcessResponse
from app.services.voice_service import process_public_voice, process_voice
from database.mongo import get_database


router = APIRouter(prefix="/voice", tags=["voice"])


@router.post("/process", response_model=None)
async def voice_process(
    language: str = Form(...),
    transcript: str | None = Form(None),
    password: str | None = Form(None),
    audio: UploadFile | None = File(None),
    current_user: dict = Depends(get_current_user),
):
    settings = get_settings()
    db = get_database(settings.mongodb_uri, settings.mongo_db_name)

    if not audio and not transcript:
        raise HTTPException(status_code=400, detail="Provide either audio or transcript.")

    audio_bytes: bytes | None = None
    audio_mime: str | None = None
    if audio:
        audio_bytes = await audio.read()
        audio_mime = audio.content_type

    user_id = str(current_user["_id"])
    result: VoiceProcessResponse = await process_voice(
        db=db,
        user_id=user_id,
        language=language,
        audio_bytes=audio_bytes,
        audio_mime=audio_mime,
        transcript_text=transcript,
        password=password,
        current_user=current_user,
    )
    return api_response(True, data=result, message="Voice processed successfully")


@router.post("/public-process", response_model=None)
async def public_voice_process(
    language: str = Form(...),
    email: str = Form(...),
    transcript: str | None = Form(None),
    password: str | None = Form(None),
    audio: UploadFile | None = File(None),
):
    if not audio and not transcript:
        raise HTTPException(status_code=400, detail="Provide either audio or transcript.")

    audio_bytes: bytes | None = None
    audio_mime: str | None = None
    if audio:
        audio_bytes = await audio.read()
        audio_mime = audio.content_type

    result: VoiceProcessResponse = await process_public_voice(
        email=email,
        language=language,
        audio_bytes=audio_bytes,
        audio_mime=audio_mime,
        transcript_text=transcript,
        password=password,
    )
    return api_response(True, data=result, message="Voice processed successfully")

