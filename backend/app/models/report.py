from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.source import _now, _uuid
from app.database.db import Base


class CommunityReport(Base):
    __tablename__ = "community_reports"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    claim_id: Mapped[str] = mapped_column(String, ForeignKey("claims.id"), nullable=False)
    report_type: Mapped[str] = mapped_column(String, nullable=False)  # SUSPICIOUS | SCAM | INCORRECT | OUTDATED
    seen_before: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class SyncJob(Base):
    __tablename__ = "sync_jobs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    idempotency_key: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    claim_text: Mapped[str] = mapped_column(String, nullable=False)
    language: Mapped[str] = mapped_column(String, default="en-IN")
    status: Mapped[str] = mapped_column(String, default="PENDING")  # PENDING|SYNCING|SYNCED|FAILED
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    result_verification_id: Mapped[str] = mapped_column(String, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)
