from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_embedder, get_llm
from app.database.db import get_db
from app.models import SyncJob
from app.schemas.sync import SyncRequest, SyncResponse, SyncResultItem
from app.services.verification_pipeline import run_verification_pipeline

router = APIRouter(prefix="/api", tags=["sync"])


@router.post("/sync", response_model=SyncResponse)
async def sync(payload: SyncRequest, db: Session = Depends(get_db)):
    """Drains a client's offline PENDING queue. Idempotency keys prevent a
    claim from being verified twice if the client retries a request whose
    response it never received (spec section 18)."""
    results: list[SyncResultItem] = []

    for item in payload.items:
        existing = db.query(SyncJob).filter(SyncJob.idempotency_key == item.idempotency_key).one_or_none()
        if existing and existing.status == "SYNCED":
            results.append(SyncResultItem(
                idempotency_key=item.idempotency_key,
                status="SYNCED",
                verification_id=existing.result_verification_id,
            ))
            continue

        job = existing or SyncJob(
            idempotency_key=item.idempotency_key,
            claim_text=item.claim_text,
            language=item.language or "en-IN",
            status="SYNCING",
        )
        job.status = "SYNCING"
        db.add(job)
        db.commit()

        try:
            result = await run_verification_pipeline(db, item.claim_text, get_embedder(), get_llm(), item.language)
            job.status = "SYNCED"
            job.result_verification_id = result["verificationId"]
            db.add(job)
            db.commit()
            results.append(SyncResultItem(
                idempotency_key=item.idempotency_key,
                status="SYNCED",
                verification_id=result["verificationId"],
            ))
        except Exception as exc:  # noqa: BLE001
            job.status = "FAILED"
            job.retry_count += 1
            db.add(job)
            db.commit()
            results.append(SyncResultItem(
                idempotency_key=item.idempotency_key,
                status="FAILED",
                error=str(exc),
            ))

    return SyncResponse(results=results)
