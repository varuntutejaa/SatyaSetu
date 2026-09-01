import io

from PIL import Image

from app.providers.base import OCRProvider, ProviderUnavailableError
from app.providers.ocr import TesseractOCRProvider

MAX_DIMENSION = 1600


def _downscale(image_bytes: bytes) -> bytes:
    """Cap resolution before OCR — mirrors the client-side compression the
    spec requires, and keeps OCR fast even if a raw upload slips through."""
    image = Image.open(io.BytesIO(image_bytes))
    if max(image.size) > MAX_DIMENSION:
        image.thumbnail((MAX_DIMENSION, MAX_DIMENSION))
    buffer = io.BytesIO()
    image.convert("RGB").save(buffer, format="JPEG", quality=85)
    return buffer.getvalue()


class OCRService:
    def __init__(self, provider: OCRProvider | None = None) -> None:
        self.provider = provider or TesseractOCRProvider()

    def extract_text(self, image_bytes: bytes) -> str:
        try:
            processed = _downscale(image_bytes)
        except Exception as exc:
            raise ValueError(f"Could not read image file: {exc}") from exc

        try:
            return self.provider.extract_text(processed)
        except ProviderUnavailableError:
            raise
