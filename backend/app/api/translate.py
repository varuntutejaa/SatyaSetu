from fastapi import APIRouter, HTTPException

from app.providers.base import ProviderUnavailableError
from app.providers.sarvam import SarvamTranslationProvider
from app.schemas.speech import TranslateRequest, TranslateResponse

router = APIRouter(prefix="/api", tags=["translate"])


@router.post("/translate", response_model=TranslateResponse)
async def translate(payload: TranslateRequest):
    try:
        text = await SarvamTranslationProvider().translate(
            payload.text, payload.source_language, payload.target_language
        )
    except ProviderUnavailableError:
        raise HTTPException(status_code=503, detail="Translation service unavailable.")
    return TranslateResponse(translated_text=text)
