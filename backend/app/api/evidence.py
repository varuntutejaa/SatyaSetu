from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models import Document, DocumentChunk, Source

router = APIRouter(prefix="/api", tags=["evidence"])


@router.get("/evidence/{chunk_id}")
def get_evidence_detail(chunk_id: str, db: Session = Depends(get_db)):
    chunk = db.get(DocumentChunk, chunk_id)
    if not chunk:
        raise HTTPException(status_code=404, detail="Evidence not found.")
    document = db.get(Document, chunk.document_id)
    source = db.get(Source, chunk.source_id)
    return {
        "id": chunk.id,
        "content": chunk.content,
        "source": {
            "name": source.name,
            "domain": source.domain,
            "authority_level": source.authority_level,
            "category": source.category,
        },
        "document": {
            "title": document.title,
            "url": document.url,
            "published_at": document.published_at.isoformat(),
            "retrieved_at": document.retrieved_at.isoformat(),
        },
    }
