from datetime import datetime, timezone

_AUTHORITY_WEIGHT = {
    "AUTHORITATIVE": 1.0,
    "HIGH": 0.85,
    "MEDIUM": 0.6,
    "UNKNOWN": 0.3,
}


def freshness_score(published_at: datetime, now: datetime | None = None) -> float:
    now = now or datetime.now(timezone.utc)
    if published_at.tzinfo is None:
        published_at = published_at.replace(tzinfo=timezone.utc)
    age_days = max((now - published_at).days, 0)
    if age_days <= 180:
        return 1.0
    if age_days <= 365:
        return 0.8
    if age_days <= 730:
        return 0.6
    return 0.4


def rank_score(similarity: float, authority_level: str, published_at: datetime) -> float:
    """Combines semantic similarity with source authority and freshness.
    Authority dominates: an UNKNOWN source can never outrank an AUTHORITATIVE
    one purely on text similarity."""
    authority = _AUTHORITY_WEIGHT.get(authority_level, 0.3)
    fresh = freshness_score(published_at)
    return round((similarity * 0.55) + (authority * 0.35) + (fresh * 0.10), 4)
