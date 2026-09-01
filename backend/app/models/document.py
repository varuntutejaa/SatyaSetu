from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.db import Base
from app.models.source import _now, _uuid


class Document(Base):
    """A single official document/page/announcement attributed to a Source."""

    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    source_id: Mapped[str] = mapped_column(String, ForeignKey("sources.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    url: Mapped[str] = mapped_column(String, nullable=False)
    published_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    retrieved_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    language: Mapped[str] = mapped_column(String, default="en-IN")
    content_hash: Mapped[str] = mapped_column(String, default="")


class DocumentChunk(Base):
    """A retrievable slice of a Document, carrying its own embedding + provenance."""

    __tablename__ = "document_chunks"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    document_id: Mapped[str] = mapped_column(String, ForeignKey("documents.id"), nullable=False)
    source_id: Mapped[str] = mapped_column(String, ForeignKey("sources.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    # JSON-encoded float vector (portable fallback for environments without pgvector)
    embedding: Mapped[str] = mapped_column(Text, nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, default=0)
    language: Mapped[str] = mapped_column(String, default="en-IN")
