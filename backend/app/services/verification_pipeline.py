import json
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import Claim, Evidence, Verification
from app.providers.base import EmbeddingProvider, LLMProvider
from app.rag.retrieval import retrieve_evidence
from app.services.claim_extraction import extract_claim
from app.verification.engine import run_verification


async def run_verification_pipeline(
    db: Session,
    raw_text: str,
    embedder: EmbeddingProvider,
    llm: LLMProvider,
    language_hint: str | None = None,
) -> dict:
    extracted = extract_claim(raw_text, language_hint)

    claim = Claim(
        raw_text=extracted.raw_text,
        normalized_text=extracted.normalized_text,
        language=extracted.language,
        hash=extracted.hash,
    )
    db.add(claim)
    db.flush()

    evidence = retrieve_evidence(db, extracted.normalized_text, embedder)

    limitations = []
    if evidence:
        comparison = await llm.compare_claim_to_evidence(extracted.normalized_text, evidence)
        assessments = comparison.get("evidence_assessments", [])
        limitations.extend(comparison.get("limitations", []))
    else:
        assessments = []

    result = run_verification(extracted.normalized_text, evidence, assessments, limitations)

    verification = Verification(
        claim_id=claim.id,
        verdict=result.verdict,
        confidence=result.confidence,
        summary=result.claim_summary,
        explanation=result.explanation,
        limitations=json.dumps(result.limitations),
        offline=False,
    )
    db.add(verification)
    db.flush()

    for item in result.evidence:
        db.add(Evidence(
            verification_id=verification.id,
            document_chunk_id=item["id"],
            relationship=item["relationship"],
            relevance_score=item["relevance_score"],
            reason=item["reason"],
        ))

    db.commit()

    return {
        "verificationId": verification.id,
        "verdict": result.verdict,
        "confidence": result.confidence,
        "claim": extracted.normalized_text,
        "summary": result.claim_summary,
        "explanation": result.explanation,
        "evidence": [
            {
                "id": e["id"],
                "relationship": e["relationship"],
                "relevance_score": e["relevance_score"],
                "reason": e["reason"],
                "source_id": e["source_id"],
                "source_name": e["source_name"],
                "source_domain": e["source_domain"],
                "authority_level": e["authority_level"],
                "category": e["category"],
                "document_title": e["document_title"],
                "document_url": e["document_url"],
                "published_at": e["published_at"],
                "retrieved_at": e["retrieved_at"],
            }
            for e in result.evidence
        ],
        "confidenceFactors": result.confidence_factors,
        "howVerified": result.how_verified,
        "sourceCount": result.source_count,
        "freshness": result.freshness,
        "limitations": result.limitations,
        "checkedAt": datetime.now(timezone.utc).isoformat(),
        "offline": False,
        "language": extracted.language,
    }
