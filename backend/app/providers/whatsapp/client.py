"""Meta WhatsApp Cloud API client.

Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
API versions drift over time (Meta deprecates old ones on a schedule) —
WHATSAPP_API_VERSION is configurable via env var precisely because of that;
if sends start failing with a version-related error, bump it and check
https://developers.facebook.com/docs/graph-api/changelog for the current one.
"""
import hashlib
import hmac

import httpx

from app.config import get_settings
from app.providers.base import ProviderUnavailableError

GRAPH_BASE = "https://graph.facebook.com"


class WhatsAppClient:
    def __init__(self) -> None:
        self.settings = get_settings()

    @property
    def enabled(self) -> bool:
        return bool(self.settings.whatsapp_access_token and self.settings.whatsapp_phone_number_id)

    def _require_config(self) -> None:
        if not self.enabled:
            raise ProviderUnavailableError("WhatsApp Cloud API is not configured")

    def verify_webhook_signature(self, payload: bytes, signature_header: str | None) -> bool:
        """Confirms a webhook POST genuinely came from Meta (HMAC-SHA256 over
        the raw body, keyed by the app secret). Skipped (returns True) only
        when no app secret is configured yet — matches this project's
        graceful-degradation pattern, but should be set before real traffic."""
        if not self.settings.whatsapp_app_secret:
            return True
        if not signature_header or not signature_header.startswith("sha256="):
            return False
        expected = hmac.new(
            self.settings.whatsapp_app_secret.encode(), payload, hashlib.sha256
        ).hexdigest()
        provided = signature_header.removeprefix("sha256=")
        return hmac.compare_digest(expected, provided)

    async def send_text_message(self, to: str, body: str) -> None:
        self._require_config()
        url = f"{GRAPH_BASE}/{self.settings.whatsapp_api_version}/{self.settings.whatsapp_phone_number_id}/messages"
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.post(
                    url,
                    headers={"Authorization": f"Bearer {self.settings.whatsapp_access_token}"},
                    json={
                        "messaging_product": "whatsapp",
                        "to": to,
                        "type": "text",
                        "text": {"body": body[:4096], "preview_url": False},
                    },
                )
                resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise ProviderUnavailableError(f"WhatsApp send failed: {exc}") from exc

    async def mark_as_read(self, message_id: str) -> None:
        self._require_config()
        url = f"{GRAPH_BASE}/{self.settings.whatsapp_api_version}/{self.settings.whatsapp_phone_number_id}/messages"
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                await client.post(
                    url,
                    headers={"Authorization": f"Bearer {self.settings.whatsapp_access_token}"},
                    json={"messaging_product": "whatsapp", "status": "read", "message_id": message_id},
                )
        except httpx.HTTPError:
            pass  # Read receipts are a nicety, never worth failing the request over.

    async def download_media(self, media_id: str) -> tuple[bytes, str]:
        """Two-step per Meta's API: resolve the media ID to a short-lived
        signed URL, then fetch the bytes from that URL with the same
        bearer token."""
        self._require_config()
        headers = {"Authorization": f"Bearer {self.settings.whatsapp_access_token}"}
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                meta_resp = await client.get(f"{GRAPH_BASE}/{self.settings.whatsapp_api_version}/{media_id}", headers=headers)
                meta_resp.raise_for_status()
                meta = meta_resp.json()
                media_url = meta["url"]
                mime_type = meta.get("mime_type", "application/octet-stream")

                data_resp = await client.get(media_url, headers=headers)
                data_resp.raise_for_status()
                return data_resp.content, mime_type
        except (httpx.HTTPError, KeyError) as exc:
            raise ProviderUnavailableError(f"WhatsApp media download failed: {exc}") from exc
