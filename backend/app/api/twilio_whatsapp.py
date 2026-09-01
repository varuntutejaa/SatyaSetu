"""Twilio WhatsApp Sandbox webhook.

A separate channel from the Meta Cloud API integration (app/api/whatsapp.py)
— useful because the Twilio sandbox can be joined and demoed in minutes
with no business verification, unlike Meta's Cloud API.
"""
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response
from twilio.request_validator import RequestValidator

from app.config import get_settings
from app.services.twilio_whatsapp_handler import handle_incoming_whatsapp

router = APIRouter(prefix="/api/twilio/whatsapp", tags=["twilio-whatsapp"])


def _signature_url(request: Request) -> str:
    settings = get_settings()
    if settings.twilio_public_base_url:
        url = f"{settings.twilio_public_base_url.rstrip('/')}{request.url.path}"
        if request.url.query:
            url = f"{url}?{request.url.query}"
        return url
    return str(request.url)


@router.get("/health")
def twilio_whatsapp_health():
    settings = get_settings()
    return {
        "status": "ok",
        "configured": bool(settings.twilio_account_sid and settings.twilio_auth_token),
        "signatureValidation": settings.twilio_validate_webhooks,
    }


@router.post("")
async def incoming_whatsapp_message(request: Request):
    form = {key: str(value) for key, value in (await request.form()).items()}

    settings = get_settings()
    if settings.twilio_validate_webhooks:
        if not settings.twilio_auth_token:
            raise HTTPException(status_code=503, detail="Twilio webhook validation is not configured.")
        signature = request.headers.get("X-Twilio-Signature", "")
        validator = RequestValidator(settings.twilio_auth_token)
        if not signature or not validator.validate(_signature_url(request), form, signature):
            raise HTTPException(status_code=403, detail="Invalid Twilio signature.")

    twiml = await handle_incoming_whatsapp(form)
    return Response(content=twiml, media_type="application/xml")
