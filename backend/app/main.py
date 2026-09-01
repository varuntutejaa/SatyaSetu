import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import demo, evidence, ocr, reports, sources, stt, sync, translate, tts, verify
from app.config import get_settings
from app.database.db import Base, SessionLocal, engine
from app.database.seed import seed_if_empty
from app.middleware import RateLimitMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("satyasetu")

settings = get_settings()

app = FastAPI(
    title="SatyaSetu API",
    description="Evidence before belief. Verification API for SatyaSetu.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    # Covers the production alias and every Vercel preview URL for this
    # specific project, without needing a Render env var change per deploy.
    allow_origin_regex=r"https://satyasetu(-[a-z0-9]+)?(-varuntutejaas-projects)?\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s", request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Something went wrong. Please try again."})


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "satyasetu-api"}


app.include_router(verify.router)
app.include_router(ocr.router)
app.include_router(stt.router)
app.include_router(tts.router)
app.include_router(translate.router)
app.include_router(sources.router)
app.include_router(evidence.router)
app.include_router(sync.router)
app.include_router(reports.router)
app.include_router(demo.router)
