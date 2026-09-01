import io

from PIL import Image

from app.providers.base import OCRProvider, ProviderUnavailableError

# Indian-language scripts we ask Tesseract for, alongside English.
_TESSERACT_LANGS = "eng+hin+pan"


class TesseractOCRProvider(OCRProvider):
    """Server-side OCR via the Tesseract binary (through pytesseract).

    Kept behind the OCRProvider interface so an on-device/ML-based OCR
    implementation can be swapped in later without touching callers.
    """

    def extract_text(self, image_bytes: bytes) -> str:
        try:
            import pytesseract
        except ImportError as exc:
            raise ProviderUnavailableError("pytesseract is not installed") from exc

        try:
            image = Image.open(io.BytesIO(image_bytes))
            image = image.convert("L")
            try:
                return pytesseract.image_to_string(image, lang=_TESSERACT_LANGS).strip()
            except pytesseract.TesseractError:
                return pytesseract.image_to_string(image, lang="eng").strip()
        except EnvironmentError as exc:
            raise ProviderUnavailableError(
                "Tesseract OCR engine is not installed on this machine (brew install tesseract)"
            ) from exc
