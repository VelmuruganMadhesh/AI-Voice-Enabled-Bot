from pydantic import BaseModel, Field


class VoiceProcessResponse(BaseModel):
    text: str
    audio_base64: str = Field(..., description="Base64-encoded mp3 audio")
    audio_mime: str = "audio/mpeg"
    detected_intent: str | None = None
    transcript: str | None = None

