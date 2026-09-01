from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_embedder, get_llm
from app.config import get_settings
from app.database.db import get_db
from app.providers.base import ProviderUnavailableError
from app.schemas.verify import VerifyResponse
from app.services.ocr_service import OCRService
from app.services.verification_pipeline import run_verification_pipeline

router = APIRouter(prefix="/api", tags=["ocr"])

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post("/ocr", response_model=VerifyResponse)
async def ocr_and_verify(file: UploadFile = File(...), db: Session = Depends(get_db)):
    settings = get_settings()

    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported image type. Use JPEG, PNG, or WebP.")

    image_bytes = await file.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(image_bytes) > max_bytes:
        raise HTTPException(status_code=400, detail=f"Image exceeds the {settings.max_upload_mb}MB limit.")

    try:
        extracted_text = OCRService().extract_text(image_bytes)
    except ProviderUnavailableError:
        raise HTTPException(
            status_code=503,
            detail="OCR service is unavailable on this server (Tesseract not installed). Please type the message instead.",
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if not extracted_text or len(extracted_text.strip()) < 3:
        raise HTTPException(status_code=422, detail="No readable text was found in this image.")

    try:
        result = await run_verification_pipeline(db, extracted_text, get_embedder(), get_llm())
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=503, detail="Verification service temporarily unavailable.") from exc

    return result
