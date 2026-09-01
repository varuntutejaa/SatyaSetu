from pydantic import BaseModel, Field


class CommunityReportRequest(BaseModel):
    claim_text: str = Field(..., min_length=3, max_length=4000)
    report_type: str = Field(..., pattern="^(SUSPICIOUS|SCAM|INCORRECT|OUTDATED)$")
    seen_before: bool = False


class CommunityReportResponse(BaseModel):
    id: str
    claim_id: str
    total_reports_for_claim: int
    message: str
