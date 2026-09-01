import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Source(Base):
    """A curated, manually-vetted trusted source (a domain/portal, not a single article)."""

    __tablename__ = "sources"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    domain: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    # AUTHORITATIVE | HIGH | MEDIUM | UNKNOWN
    authority_level: Mapped[str] = mapped_column(String, nullable=False, default="UNKNOWN")
    description: Mapped[str] = mapped_column(String, default="")
    verification_status: Mapped[str] = mapped_column(String, default="ACTIVE")
    last_checked: Mapped[datetime] = mapped_column(DateTime, default=_now)
    allowed_for_verification: Mapped[bool] = mapped_column(Boolean, default=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
