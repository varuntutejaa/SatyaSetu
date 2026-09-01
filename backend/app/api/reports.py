from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models import Claim, CommunityReport
from app.schemas.report import CommunityReportRequest, CommunityReportResponse
from app.services.claim_extraction import extract_claim

router = APIRouter(prefix="/api", tags=["reports"])


@router.post("/reports", response_model=CommunityReportResponse)
def submit_report(payload: CommunityReportRequest, db: Session = Depends(get_db)):
    """Community reports are signals only — never a verdict. A high report
    count is displayed as-is; it never converts a claim into FALSE/TRUE on
    its own (spec section 23)."""
    extracted = extract_claim(payload.claim_text)

    claim = db.query(Claim).filter(Claim.hash == extracted.hash).one_or_none()
    if not claim:
        claim = Claim(
            raw_text=extracted.raw_text,
            normalized_text=extracted.normalized_text,
            language=extracted.language,
            hash=extracted.hash,
        )
        db.add(claim)
        db.flush()

    report = CommunityReport(
        claim_id=claim.id,
        report_type=payload.report_type,
        seen_before=payload.seen_before,
    )
    db.add(report)
    db.commit()

    total = db.query(CommunityReport).filter(CommunityReport.claim_id == claim.id).count()

    return CommunityReportResponse(
        id=report.id,
        claim_id=claim.id,
        total_reports_for_claim=total,
        message="Community reports have been received. Independent verification is still required.",
    )
