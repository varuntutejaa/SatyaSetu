"""Turns one incoming Twilio WhatsApp Sandbox message into a TwiML reply.

Unlike the Meta Cloud API flow (app/services/whatsapp_handler.py), which
replies via a BackgroundTask after returning 200, Twilio expects a
synchronous TwiML <Message> response in the webhook body itself — so
verification runs inline before the response is built.
"""
import logging

from twilio.twiml.messaging_response import MessagingResponse

from app.api.deps import get_embedder, get_llm
from app.database.db import SessionLocal
from app.providers.base import ProviderUnavailableError
from app.providers.ocr import TesseractOCRProvider
from app.providers.sarvam import SarvamSpeechProvider
from app.services.ocr_service import OCRService
from app.services.twilio_media import download_twilio_media
from app.services.verification_pipeline import run_verification_pipeline
from app.services.whatsapp_formatting import (
    GREETING,
    UNSUPPORTED_MESSAGE,
    format_error_reply,
    format_verification_reply,
)

logger = logging.getLogger("satyasetu.twilio_whatsapp")

_GREETING_TRIGGERS = {"hi", "hello", "hey", "start", "namaste", "menu"}


def _twiml(text: str) -> str:
    response = MessagingResponse()
    response.message(text)
    return str(response)


async def handle_incoming_whatsapp(form: dict[str, str]) -> str:
    body = (form.get("Body") or "").strip()
    num_media = int(form.get("NumMedia") or 0)

    try:
        if num_media > 0:
            return await _handle_media(form.get("MediaUrl0", ""), form.get("MediaContentType0", ""))

        if body.lower() in _GREETING_TRIGGERS:
            return _twiml(GREETING)

        if len(body) < 3:
            return _twiml(UNSUPPORTED_MESSAGE)

        result = await _verify(body)
        return _twiml(format_verification_reply(result))

    except ProviderUnavailableError as exc:
        logger.warning("Provider unavailable while handling Twilio WhatsApp message: %s", exc)
        return _twiml(format_error_reply(str(exc)))
    except Exception:
        logger.exception("Unhandled error processing Twilio WhatsApp message")
        return _twiml(format_error_reply("Something went wrong on our end. Please try again in a moment."))


async def _verify(text: str) -> dict:
    db = SessionLocal()
    try:
        return await run_verification_pipeline(db, text, get_embedder(), get_llm())
    finally:
        db.close()


async def _handle_media(media_url: str, content_type: str) -> str:
    if not media_url:
        return _twiml(UNSUPPORTED_MESSAGE)

    media_bytes = await download_twilio_media(media_url)

    if content_type.startswith("image/"):
        try:
            extracted_text = OCRService(TesseractOCRProvider()).extract_text(media_bytes)
        except ProviderUnavailableError:
            return _twiml(format_error_reply("Screenshot reading is unavailable right now. Please type the message instead."))
        if not extracted_text or len(extracted_text.strip()) < 3:
            return _twiml(format_error_reply("I couldn't read any text in that image."))
        result = await _verify(extracted_text)
        return _twiml(f'📷 Read: "{extracted_text[:200]}"\n\n' + format_verification_reply(result))

    if content_type.startswith("audio/") or content_type.startswith("video/"):
        # WhatsApp voice notes often arrive as audio/ogg; Twilio sometimes
        # reports them under a video/* container depending on the device.
        transcription = await SarvamSpeechProvider().transcribe(media_bytes, content_type)
        if not transcription.text or len(transcription.text.strip()) < 3:
            return _twiml(format_error_reply("I couldn't understand that voice note. Please try typing instead."))
        result = await _verify(transcription.text)
        return _twiml(f'🎤 Heard: "{transcription.text}"\n\n' + format_verification_reply(result))

    return _twiml(UNSUPPORTED_MESSAGE)
