from app.providers.base import SpeechProvider, TTSProvider, TranslationProvider, TranscriptionResult, SpeechSynthesisResult
from app.providers.sarvam.client import SarvamClient


class SarvamSpeechProvider(SpeechProvider):
    def __init__(self, client: SarvamClient | None = None) -> None:
        self.client = client or SarvamClient()

    async def transcribe(self, audio_bytes: bytes, mime_type: str, language_hint: str | None = None) -> TranscriptionResult:
        data = await self.client.speech_to_text(audio_bytes, mime_type, language_hint)
        return TranscriptionResult(
            text=data.get("transcript", ""),
            language=data.get("language_code", language_hint or "unknown"),
            confidence=float(data.get("language_probability", data.get("confidence", 0)) or 0),
        )


class SarvamTTSProvider(TTSProvider):
    def __init__(self, client: SarvamClient | None = None) -> None:
        self.client = client or SarvamClient()

    async def synthesize(self, text: str, language: str) -> SpeechSynthesisResult:
        data = await self.client.text_to_speech(text, language)
        audios = data.get("audios") or []
        audio_b64 = audios[0] if audios else data.get("audio", "")
        return SpeechSynthesisResult(audio_base64=audio_b64, mime_type="audio/wav")


class SarvamTranslationProvider(TranslationProvider):
    def __init__(self, client: SarvamClient | None = None) -> None:
        self.client = client or SarvamClient()

    async def translate(self, text: str, source_language: str, target_language: str) -> str:
        data = await self.client.translate(text, source_language, target_language)
        return data.get("translated_text", text)

    async def detect_language(self, text: str) -> str:
        data = await self.client.detect_language(text)
        return data.get("language_code", "unknown")
