from pydantic import BaseModel, Field


class VerifyRequest(BaseModel):
    text: str = Field(..., min_length=3, max_length=4000)
    language: str | None = None


class EvidenceOut(BaseModel):
    id: str
    relationship: str
    relevance_score: float
    reason: str
    source_id: str
    source_name: str
    source_domain: str
    authority_level: str
    category: str
    document_title: str
    document_url: str
    published_at: str
    retrieved_at: str


class HowVerifiedStep(BaseModel):
    step: int
    label: str
    detail: str


class VerifyResponse(BaseModel):
    verificationId: str
    verdict: str
    confidence: str
    claim: str
    summary: str
    explanation: str
    evidence: list[EvidenceOut]
    confidenceFactors: list[str]
    howVerified: list[HowVerifiedStep]
    sourceCount: int
    freshness: str
    limitations: list[str]
    checkedAt: str
    offline: bool = False
    language: str
