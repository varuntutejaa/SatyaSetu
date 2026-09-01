from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models import Source
from app.schemas.source import SourceOut

router = APIRouter(prefix="/api", tags=["sources"])


@router.get("/sources", response_model=list[SourceOut])
def list_sources(db: Session = Depends(get_db)):
    rows = db.execute(select(Source).where(Source.active.is_(True))).scalars().all()
    return [
        SourceOut(
            id=s.id,
            name=s.name,
            domain=s.domain,
            category=s.category,
            authority_level=s.authority_level,
            description=s.description,
            verification_status=s.verification_status,
            last_checked=s.last_checked.isoformat(),
            allowed_for_verification=s.allowed_for_verification,
            active=s.active,
        )
        for s in rows
    ]
