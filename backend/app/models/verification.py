from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.source import _now, _uuid
from app.database.db import Base


class Verification(Base):
    __tablename__ = "verifications"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    claim_id: Mapped[str] = mapped_column(String, ForeignKey("claims.id"), nullable=False)
    verdict: Mapped[str] = mapped_column(String, nullable=False)  # VERIFIED | UNVERIFIED | CONTRADICTED
    confidence: Mapped[str] = mapped_column(String, nullable=False)  # HIGH | MEDIUM | LOW
    summary: Mapped[str] = mapped_column(Text, default="")
    explanation: Mapped[str] = mapped_column(Text, default="")
    limitations: Mapped[str] = mapped_column(Text, default="[]")  # JSON list
    offline: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class Evidence(Base):
    __tablename__ = "evidence"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    verification_id: Mapped[str] = mapped_column(String, ForeignKey("verifications.id"), nullable=False)
    document_chunk_id: Mapped[str] = mapped_column(String, ForeignKey("document_chunks.id"), nullable=False)
    relationship: Mapped[str] = mapped_column(String, nullable=False)  # SUPPORTS | CONTRADICTS | NEUTRAL
    relevance_score: Mapped[float] = mapped_column(Float, default=0.0)
    reason: Mapped[str] = mapped_column(Text, default="")
