"""Provider interfaces.

Every external AI capability (speech, TTS, translation, embeddings, OCR, LLM)
is accessed only through these interfaces. This keeps the rest of the app
decoupled from any single vendor (e.g. Sarvam) so a provider can be swapped
or upgraded without touching business logic.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass


class ProviderUnavailableError(Exception):
    """Raised when a provider cannot serve a request (missing key, network, etc.)."""


@dataclass
class TranscriptionResult:
    text: str
    language: str
    confidence: float = 0.0


@dataclass
class SpeechSynthesisResult:
    audio_base64: str
    mime_type: str = "audio/wav"


class SpeechProvider(ABC):
    @abstractmethod
    async def transcribe(self, audio_bytes: bytes, mime_type: str, language_hint: str | None = None) -> TranscriptionResult:
        ...


class TTSProvider(ABC):
    @abstractmethod
    async def synthesize(self, text: str, language: str) -> SpeechSynthesisResult:
        ...


class TranslationProvider(ABC):
    @abstractmethod
    async def translate(self, text: str, source_language: str, target_language: str) -> str:
        ...

    @abstractmethod
    async def detect_language(self, text: str) -> str:
        ...


class EmbeddingProvider(ABC):
    @abstractmethod
    def embed(self, text: str) -> list[float]:
        ...

    @property
    @abstractmethod
    def dimensions(self) -> int:
        ...


class OCRProvider(ABC):
    @abstractmethod
    def extract_text(self, image_bytes: bytes) -> str:
        ...


class LLMProvider(ABC):
    @abstractmethod
    async def compare_claim_to_evidence(self, claim: str, evidence: list[dict]) -> dict:
        """Returns the structured verdict JSON described in the system prompt contract."""
        ...
