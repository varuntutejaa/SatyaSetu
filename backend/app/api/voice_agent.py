from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_embedder, get_llm
from app.api.stt import ALLOWED_MIME_TYPES, MAX_AUDIO_MB
from app.database.db import get_db
from app.providers.base import ProviderUnavailableError
from app.providers.sarvam import SarvamSpeechProvider, SarvamTTSProvider, SarvamTranslationProvider
from app.schemas.speech import VoiceAgentResponse
from app.services.verification_pipeline import run_verification_pipeline

router = APIRouter(prefix="/api", tags=["voice-agent"])


def _normalize_language(code: str | None, fallback: str = "en-IN") -> str:
    if not code:
        return fallback
    normalized = code.strip()
    return {
        "en": "en-IN",
        "hi": "hi-IN",
        "pa": "pa-IN",
        "pan": "pa-IN",
    }.get(normalized.lower(), normalized)


@router.post("/voice-agent", response_model=VoiceAgentResponse)
async def voice_agent(
    file: UploadFile = File(...),
    language_hint: str | None = Form(None),
    db: Session = Depends(get_db),
):
    content_type = (file.content_type or "").split(";")[0].strip().lower()
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported audio format.")

    audio_bytes = await file.read()
    if len(audio_bytes) > MAX_AUDIO_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Audio exceeds the {MAX_AUDIO_MB}MB limit.")

    try:
        stt = await SarvamSpeechProvider().transcribe(audio_bytes, content_type, language_hint)
    except ProviderUnavailableError as exc:
        raise HTTPException(status_code=503, detail="Voice service is unavailable. Please type your question.") from exc

    transcript = stt.text.strip()
    if len(transcript) < 3:
        raise HTTPException(status_code=422, detail="Could not hear a complete question. Please try again.")

    source_language = _normalize_language(stt.language if stt.language not in {"unknown", ""} else language_hint)
    search_text = transcript

    try:
        if source_language != "en-IN":
            search_text = await SarvamTranslationProvider().translate(transcript, source_language, "en-IN")
    except ProviderUnavailableError as exc:
        raise HTTPException(status_code=503, detail="Could not translate your question. Please try again.") from exc

    try:
        verification = await run_verification_pipeline(db, search_text, get_embedder(), get_llm(), source_language)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=503, detail="Could not check official proof right now.") from exc

    answer_text = " ".join([
        f"Result: {'Needs more proof' if verification['verdict'] == 'UNVERIFIED' else verification['verdict']}.",
        verification["summary"],
        verification["explanation"],
    ])[:900]

    spoken_text = answer_text
    try:
        if source_language != "en-IN":
            spoken_text = await SarvamTranslationProvider().translate(answer_text, "en-IN", source_language)
        speech = await SarvamTTSProvider().synthesize(spoken_text, source_language)
    except ProviderUnavailableError as exc:
        raise HTTPException(status_code=503, detail="Could not create spoken answer. The written result is available.") from exc

    verification["claim"] = transcript
    verification["language"] = source_language

    return VoiceAgentResponse(
        transcript=transcript,
        transcript_language=source_language,
        verification=verification,
        spoken_text=spoken_text,
        audio_base64=speech.audio_base64,
        mime_type=speech.mime_type,
    )
