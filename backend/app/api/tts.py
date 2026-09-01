from fastapi import APIRouter, HTTPException

from app.providers.base import ProviderUnavailableError
from app.providers.sarvam import SarvamTTSProvider
from app.schemas.speech import TTSRequest, TTSResponse

router = APIRouter(prefix="/api", tags=["tts"])


@router.post("/tts", response_model=TTSResponse)
async def text_to_speech(payload: TTSRequest):
    try:
        result = await SarvamTTSProvider().synthesize(payload.text, payload.language)
    except ProviderUnavailableError:
        raise HTTPException(
            status_code=503,
            detail="Voice playback is unavailable right now. The explanation is shown as text instead.",
        )
    return TTSResponse(audio_base64=result.audio_base64, mime_type=result.mime_type)
