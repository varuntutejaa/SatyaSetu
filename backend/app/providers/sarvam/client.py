"""Thin HTTP client for the Sarvam AI REST API.

Endpoint shapes follow Sarvam's published REST API (api.sarvam.ai):
  POST /speech-to-text   (multipart: file, model, language_code)
  POST /text-to-speech   (json: text, target_language_code, speaker, model)
  POST /translate        (json: input, source_language_code, target_language_code)
  POST /text-lid         (json: input) -> language identification

All calls are server-side only. SARVAM_API_KEY must never reach the browser.
If the key is missing or a request fails, callers get ProviderUnavailableError
so the rest of the app can fall back gracefully (see section 37 of the spec).
"""
import httpx

from app.config import get_settings
from app.providers.base import ProviderUnavailableError

SARVAM_BASE_URL = "https://api.sarvam.ai"


class SarvamClient:
    def __init__(self) -> None:
        self.settings = get_settings()

    @property
    def enabled(self) -> bool:
        return bool(self.settings.sarvam_api_key)

    def _require_key(self) -> str:
        if not self.enabled:
            raise ProviderUnavailableError("SARVAM_API_KEY is not configured")
        return self.settings.sarvam_api_key

    async def speech_to_text(self, audio_bytes: bytes, mime_type: str, language_code: str | None) -> dict:
        key = self._require_key()
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                files = {"file": ("audio.wav", audio_bytes, mime_type)}
                data = {"model": self.settings.sarvam_stt_model}
                if language_code:
                    data["language_code"] = language_code
                resp = await client.post(
                    f"{SARVAM_BASE_URL}/speech-to-text",
                    headers={"api-subscription-key": key},
                    files=files,
                    data=data,
                )
                resp.raise_for_status()
                return resp.json()
        except httpx.HTTPError as exc:
            raise ProviderUnavailableError(f"Sarvam STT request failed: {exc}") from exc

    async def text_to_speech(self, text: str, target_language_code: str) -> dict:
        key = self._require_key()
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    f"{SARVAM_BASE_URL}/text-to-speech",
                    headers={"api-subscription-key": key, "Content-Type": "application/json"},
                    json={
                        "text": text,
                        "target_language_code": target_language_code,
                        "model": self.settings.sarvam_tts_model,
                    },
                )
                resp.raise_for_status()
                return resp.json()
        except httpx.HTTPError as exc:
            raise ProviderUnavailableError(f"Sarvam TTS request failed: {exc}") from exc

    async def translate(self, text: str, source_language_code: str, target_language_code: str) -> dict:
        key = self._require_key()
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.post(
                    f"{SARVAM_BASE_URL}/translate",
                    headers={"api-subscription-key": key, "Content-Type": "application/json"},
                    json={
                        "input": text,
                        "source_language_code": source_language_code,
                        "target_language_code": target_language_code,
                    },
                )
                resp.raise_for_status()
                return resp.json()
        except httpx.HTTPError as exc:
            raise ProviderUnavailableError(f"Sarvam translate request failed: {exc}") from exc

    async def detect_language(self, text: str) -> dict:
        key = self._require_key()
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    f"{SARVAM_BASE_URL}/text-lid",
                    headers={"api-subscription-key": key, "Content-Type": "application/json"},
                    json={"input": text},
                )
                resp.raise_for_status()
                return resp.json()
        except httpx.HTTPError as exc:
            raise ProviderUnavailableError(f"Sarvam language-id request failed: {exc}") from exc
