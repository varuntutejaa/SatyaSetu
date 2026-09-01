from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_embedder, get_llm
from app.database.db import get_db
from app.models import Verification, Claim
from app.schemas.verify import VerifyRequest, VerifyResponse
from app.services.verification_pipeline import run_verification_pipeline

router = APIRouter(prefix="/api", tags=["verify"])


@router.post("/verify", response_model=VerifyResponse)
async def verify(payload: VerifyRequest, db: Session = Depends(get_db)):
    try:
        result = await run_verification_pipeline(
            db, payload.text, get_embedder(), get_llm(), payload.language
        )
    except Exception as exc:  # noqa: BLE001 — surfaced as a clean, non-leaking message
        raise HTTPException(status_code=503, detail="Verification service temporarily unavailable.") from exc
    return result


@router.get("/verification/{verification_id}", response_model=VerifyResponse)
def get_verification(verification_id: str, db: Session = Depends(get_db)):
    verification = db.get(Verification, verification_id)
    if not verification:
        raise HTTPException(status_code=404, detail="Verification not found.")
    claim = db.get(Claim, verification.claim_id)

    import json as _json
    from app.models import Evidence, DocumentChunk, Document, Source

    evidence_rows = db.query(Evidence).filter(Evidence.verification_id == verification.id).all()
    evidence_out = []
    for ev in evidence_rows:
        chunk = db.get(DocumentChunk, ev.document_chunk_id)
        if not chunk:
            continue
        document = db.get(Document, chunk.document_id)
        source = db.get(Source, chunk.source_id)
        evidence_out.append({
            "id": chunk.id,
            "relationship": ev.relationship,
            "relevance_score": ev.relevance_score,
            "reason": ev.reason,
            "source_id": source.id,
            "source_name": source.name,
            "source_domain": source.domain,
            "authority_level": source.authority_level,
            "category": source.category,
            "document_title": document.title,
            "document_url": document.url,
            "published_at": document.published_at.isoformat(),
            "retrieved_at": document.retrieved_at.isoformat(),
        })

    return {
        "verificationId": verification.id,
        "verdict": verification.verdict,
        "confidence": verification.confidence,
        "claim": claim.normalized_text if claim else "",
        "summary": verification.summary,
        "explanation": verification.explanation,
        "evidence": evidence_out,
        "confidenceFactors": [],
        "howVerified": [],
        "sourceCount": len({e["source_id"] for e in evidence_out}),
        "freshness": "",
        "limitations": _json.loads(verification.limitations or "[]"),
        "checkedAt": verification.created_at.isoformat(),
        "offline": verification.offline,
        "language": claim.language if claim else "en-IN",
    }
