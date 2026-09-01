import time
from collections import defaultdict, deque

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

WINDOW_SECONDS = 60
MAX_REQUESTS_PER_WINDOW = 60


_EXEMPT_PATHS = {"/api/health"}


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory sliding-window rate limiter — good enough for a
    single-process hackathon deployment; swap for Redis-backed limiting
    before any multi-instance production deploy.

    Behind a reverse proxy (Render, Vercel, etc.) request.client.host is the
    proxy's own address, not the real caller's — every visitor would collapse
    into one shared bucket and lock each other out. X-Forwarded-For's first
    entry is the original client, so it takes priority when present."""

    def __init__(self, app):
        super().__init__(app)
        self._hits: dict[str, deque] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):
        if request.url.path in _EXEMPT_PATHS:
            return await call_next(request)

        client_ip = self._resolve_client_ip(request)
        now = time.monotonic()
        hits = self._hits[client_ip]

        while hits and now - hits[0] > WINDOW_SECONDS:
            hits.popleft()

        if len(hits) >= MAX_REQUESTS_PER_WINDOW:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please slow down and try again shortly."},
            )

        hits.append(now)
        return await call_next(request)

    @staticmethod
    def _resolve_client_ip(request: Request) -> str:
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        return request.client.host if request.client else "unknown"
