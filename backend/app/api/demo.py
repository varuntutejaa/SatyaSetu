from fastapi import APIRouter

from app.database.seed import DEMO_CLAIMS

router = APIRouter(prefix="/api", tags=["demo"])


@router.get("/demo-claims")
def get_demo_claims():
    return DEMO_CLAIMS
