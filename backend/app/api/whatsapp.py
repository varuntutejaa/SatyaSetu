import logging

from fastapi import APIRouter, BackgroundTasks, Request, Response

from app.config import get_settings
from app.providers.whatsapp import WhatsAppClient
from app.services.whatsapp_handler import handle_incoming_message

logger = logging.getLogger("satyasetu.whatsapp")

router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp"])


@router.get("/webhook")
async def verify_webhook(request: Request):
    """Meta's one-time handshake when you save the webhook config: it sends
    hub.verify_token and expects hub.challenge echoed back if it matches."""
    settings = get_settings()
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")

    if mode == "subscribe" and token == settings.whatsapp_verify_token and settings.whatsapp_verify_token:
        return Response(content=challenge or "", media_type="text/plain")
    return Response(status_code=403)


@router.post("/webhook")
async def receive_webhook(request: Request, background_tasks: BackgroundTasks):
    raw_body = await request.body()
    signature = request.headers.get("x-hub-signature-256")

    if not WhatsAppClient().verify_webhook_signature(raw_body, signature):
        logger.warning("Rejected WhatsApp webhook with invalid signature")
        return Response(status_code=403)

    payload = await request.json()

    # Always 200 quickly — Meta retries aggressively on anything else, and
    # verification itself can take a couple of seconds (retrieval + LLM).
    for entry in payload.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            for message in value.get("messages", []):
                sender = message.get("from")
                if sender:
                    background_tasks.add_task(handle_incoming_message, message, sender)

    return Response(status_code=200)
