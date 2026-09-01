"""Twilio Programmable Voice webhooks for the SatyaSetu IVR."""

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session
from twilio.request_validator import RequestValidator

from app.api.deps import get_embedder, get_llm
from app.config import get_settings
from app.database.db import get_db
from app.services.twilio_ivr import (
    DIGIT_TO_LANGUAGE,
    SUPPORTED_LANGUAGE_CODES,
    build_claim_prompt_twiml,
    build_goodbye_twiml,
    build_result_twiml,
    build_unavailable_twiml,
    build_welcome_twiml,
    get_language,
)
from app.services.verification_pipeline import run_verification_pipeline

router = APIRouter(prefix="/api/ivr", tags=["ivr"])


def _xml(body: str) -> Response:
    return Response(content=body, media_type="application/xml")


def _signature_url(request: Request) -> str:
    settings = get_settings()
    if settings.twilio_public_base_url:
        url = f"{settings.twilio_public_base_url.rstrip('/')}{request.url.path}"
        if request.url.query:
            url = f"{url}?{request.url.query}"
        return url
    return str(request.url)


async def _validated_form(request: Request) -> dict[str, str]:
    form = {key: str(value) for key, value in (await request.form()).items()}
    settings = get_settings()
    if not settings.twilio_validate_webhooks:
        return form
    if not settings.twilio_auth_token:
        raise HTTPException(status_code=503, detail="Twilio webhook validation is not configured.")
    signature = request.headers.get("X-Twilio-Signature", "")
    validator = RequestValidator(settings.twilio_auth_token)
    if not signature or not validator.validate(_signature_url(request), form, signature):
        raise HTTPException(status_code=403, detail="Invalid Twilio signature.")
    return form


@router.get("/health")
def ivr_health():
    settings = get_settings()
    return {
        "status": "ok",
        "configured": bool(settings.twilio_account_sid and settings.twilio_auth_token and settings.twilio_phone_number),
        "signatureValidation": settings.twilio_validate_webhooks,
        "languages": SUPPORTED_LANGUAGE_CODES,
    }


@router.post("/voice")
async def incoming_call(request: Request):
    await _validated_form(request)
    return _xml(build_welcome_twiml())


@router.post("/language")
async def choose_language(request: Request):
    form = await _validated_form(request)
    language_code = DIGIT_TO_LANGUAGE.get(form.get("Digits", ""))
    if not language_code:
        return _xml(build_welcome_twiml())
    language = get_language(language_code)
    return _xml(build_claim_prompt_twiml(language))


@router.post("/verify")
async def verify_spoken_claim(
    request: Request,
    lang: str = "hi-IN",
    attempt: int = 0,
    db: Session = Depends(get_db),
):
    form = await _validated_form(request)
    language = get_language(lang)
    speech = form.get("SpeechResult", "").strip()
    if not speech:
        if attempt >= 1:
            return _xml(build_goodbye_twiml(language))
        return _xml(build_claim_prompt_twiml(language, attempt=attempt + 1))

    try:
        result = await run_verification_pipeline(
            db,
            speech,
            get_embedder(),
            get_llm(),
            language.code,
        )
    except Exception:  # The call must get a safe response without leaking internals.
        return _xml(build_unavailable_twiml(language))
    return _xml(build_result_twiml(result, language))


@router.post("/restart")
async def restart_or_finish(request: Request, lang: str = "hi-IN"):
    form = await _validated_form(request)
    language = get_language(lang)
    if form.get("Digits") == "1":
        return _xml(build_claim_prompt_twiml(language))
    return _xml(build_goodbye_twiml(language))
