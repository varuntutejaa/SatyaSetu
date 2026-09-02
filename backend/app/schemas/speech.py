from pydantic import BaseModel, Field


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    language: str = "en-IN"


class TTSResponse(BaseModel):
    audio_base64: str
    mime_type: str


class STTResponse(BaseModel):
    text: str
    language: str
    confidence: float


class VoiceAgentResponse(BaseModel):
    transcript: str
    transcript_language: str
    verification: dict
    spoken_text: str
    audio_base64: str
    mime_type: str


class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=4000)
    source_language: str
    target_language: str


class TranslateResponse(BaseModel):
    translated_text: str
