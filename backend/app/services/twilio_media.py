"""Downloads Twilio-hosted media (WhatsApp screenshots, voice notes).

Twilio media URLs require HTTP Basic Auth with the account SID and auth
token — the same credentials used to validate incoming webhook signatures.
"""
import httpx

from app.config import get_settings


async def download_twilio_media(media_url: str) -> bytes:
    settings = get_settings()
    async with httpx.AsyncClient() as client:
        response = await client.get(
            media_url,
            auth=(settings.twilio_account_sid, settings.twilio_auth_token),
            follow_redirects=True,
            timeout=20.0,
        )
        response.raise_for_status()
        return response.content
