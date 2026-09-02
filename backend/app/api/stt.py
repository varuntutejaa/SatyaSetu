from fastapi import APIRouter, File, HTTPException, UploadFile, Form

from app.providers.base import ProviderUnavailableError
from app.providers.sarvam import SarvamSpeechProvider
from app.schemas.speech import STTResponse

router = APIRouter(prefix="/api", tags=["stt"])

ALLOWED_MIME_TYPES = {"audio/wav", "audio/webm", "audio/mpeg", "audio/mp4", "audio/ogg"}
MAX_AUDIO_MB = 10


@router.post("/stt", response_model=STTResponse)
async def speech_to_text(file: UploadFile = File(...), language_hint: str | None = Form(None)):
    content_type = (file.content_type or "").split(";")[0].strip().lower()
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported audio format.")

    audio_bytes = await file.read()
    if len(audio_bytes) > MAX_AUDIO_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Audio exceeds the {MAX_AUDIO_MB}MB limit.")

    try:
        result = await SarvamSpeechProvider().transcribe(audio_bytes, content_type, language_hint)
    except ProviderUnavailableError:
        raise HTTPException(
            status_code=503,
            detail="Voice service unavailable. You can type your claim instead.",
        )

    return STTResponse(text=result.text, language=result.language, confidence=result.confidence)
