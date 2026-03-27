from ai_module.voice_processor import process_voice_request


async def process_voice(
    *,
    db,
    user_id: str,
    language: str,
    audio_bytes: bytes | None,
    audio_mime: str | None,
    transcript_text: str | None,
):
    return await process_voice_request(
        db=db,
        user_id=user_id,
        language=language,
        audio_bytes=audio_bytes,
        audio_mime=audio_mime,
        transcript_text=transcript_text,
    )

