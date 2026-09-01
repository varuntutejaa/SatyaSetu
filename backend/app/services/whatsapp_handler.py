"""Turns one incoming WhatsApp message into a reply.

Runs as a FastAPI BackgroundTask so the webhook itself can return 200 to
Meta immediately (Meta retries/duplicates deliveries if a webhook is slow
or times out) — the actual verification + reply happens after that.
"""
import logging

from app.api.deps import get_embedder, get_llm
from app.database.db import SessionLocal
from app.providers.base import ProviderUnavailableError
from app.providers.ocr import TesseractOCRProvider
from app.providers.sarvam import SarvamSpeechProvider
from app.providers.whatsapp import WhatsAppClient
from app.services.ocr_service import OCRService
from app.services.verification_pipeline import run_verification_pipeline
from app.services.whatsapp_formatting import (
    GREETING,
    UNSUPPORTED_MESSAGE,
    format_error_reply,
    format_verification_reply,
)

logger = logging.getLogger("satyasetu.whatsapp")

_GREETING_TRIGGERS = {"hi", "hello", "hey", "start", "namaste", "menu"}


async def handle_incoming_message(message: dict, sender: str) -> None:
    client = WhatsAppClient()
    message_type = message.get("type")

    try:
        if message_id := message.get("id"):
            try:
                await client.mark_as_read(message_id)
            except ProviderUnavailableError:
                pass  # Read receipts are a nicety, never worth aborting the reply over.

        if message_type == "text":
            text = message["text"]["body"].strip()
            if text.lower() in _GREETING_TRIGGERS:
                await client.send_text_message(sender, GREETING)
                return
            await _verify_and_reply(client, sender, text)

        elif message_type == "image":
            await _handle_image(client, sender, message["image"]["id"])

        elif message_type == "audio":
            await _handle_audio(client, sender, message["audio"]["id"])

        else:
            await client.send_text_message(sender, UNSUPPORTED_MESSAGE)

    except ProviderUnavailableError as exc:
        logger.warning("Provider unavailable while handling WhatsApp message: %s", exc)
        await _try_reply(client, sender, format_error_reply(str(exc)))
    except Exception:
        logger.exception("Unhandled error processing WhatsApp message from %s", sender)
        await _try_reply(
            client, sender, format_error_reply("Something went wrong on our end. Please try again in a moment.")
        )


async def _try_reply(client: WhatsAppClient, sender: str, text: str) -> None:
    """Best-effort reply for error paths — if WhatsApp itself is the thing
    that's unavailable, we log it instead of raising a second, unhandled
    exception out of the background task."""
    try:
        await client.send_text_message(sender, text)
    except ProviderUnavailableError as exc:
        logger.warning("Could not send WhatsApp error reply to %s: %s", sender, exc)


async def _verify_and_reply(client: WhatsAppClient, sender: str, text: str) -> None:
    if len(text) < 3:
        await client.send_text_message(sender, UNSUPPORTED_MESSAGE)
        return

    db = SessionLocal()
    try:
        result = await run_verification_pipeline(db, text, get_embedder(), get_llm())
    finally:
        db.close()

    await client.send_text_message(sender, format_verification_reply(result))


async def _handle_image(client: WhatsAppClient, sender: str, media_id: str) -> None:
    image_bytes, _mime_type = await client.download_media(media_id)

    try:
        extracted_text = OCRService(TesseractOCRProvider()).extract_text(image_bytes)
    except ProviderUnavailableError:
        await client.send_text_message(
            sender, format_error_reply("Screenshot reading is unavailable right now. Please type the message instead.")
        )
        return

    if not extracted_text or len(extracted_text.strip()) < 3:
        await client.send_text_message(sender, format_error_reply("I couldn't read any text in that image."))
        return

    await client.send_text_message(sender, f'📷 Read from your screenshot: "{extracted_text[:200]}"')
    await _verify_and_reply(client, sender, extracted_text)


async def _handle_audio(client: WhatsAppClient, sender: str, media_id: str) -> None:
    audio_bytes, mime_type = await client.download_media(media_id)

    transcription = await SarvamSpeechProvider().transcribe(audio_bytes, mime_type)
    if not transcription.text or len(transcription.text.strip()) < 3:
        await client.send_text_message(sender, format_error_reply("I couldn't understand that voice note. Please try typing instead."))
        return

    await client.send_text_message(sender, f'🎤 I heard: "{transcription.text}"')
    await _verify_and_reply(client, sender, transcription.text)
