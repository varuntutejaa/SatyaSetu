from pydantic import BaseModel, Field


class SyncItem(BaseModel):
    idempotency_key: str = Field(..., min_length=8)
    claim_text: str = Field(..., min_length=3, max_length=4000)
    language: str | None = None


class SyncRequest(BaseModel):
    items: list[SyncItem]


class SyncResultItem(BaseModel):
    idempotency_key: str
    status: str
    verification_id: str | None = None
    error: str | None = None


class SyncResponse(BaseModel):
    results: list[SyncResultItem]
