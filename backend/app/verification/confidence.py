from datetime import datetime, timezone


def is_recent(published_at_iso: str, days: int = 730) -> bool:
    published = datetime.fromisoformat(published_at_iso)
    if published.tzinfo is None:
        published = published.replace(tzinfo=timezone.utc)
    return (datetime.now(timezone.utc) - published).days <= days


def compute_confidence(decisive_group: list[dict], has_conflict: bool) -> tuple[str, list[str]]:
    """Confidence depends only on evidence quality — never a bare percentage.
    Returns (confidence, factor_strings) so the UI can show the "why"."""
    factors: list[str] = []

    if not decisive_group:
        return "LOW", ["⚠ No sufficiently strong authoritative evidence was found"]

    authoritative = [e for e in decisive_group if e["authority_level"] == "AUTHORITATIVE"]
    distinct_sources = {e["source_id"] for e in decisive_group}
    top_relevance = max(e["relevance_score"] for e in decisive_group)
    fresh = any(is_recent(e["published_at"]) for e in decisive_group)

    if authoritative:
        factors.append("✓ Official/authoritative source")
    else:
        factors.append("⚠ No fully authoritative source — only high-trust source(s)")

    if top_relevance >= 0.7:
        factors.append("✓ Strong match between claim and evidence")
    elif top_relevance >= 0.45:
        factors.append("⚠ Moderate match between claim and evidence")
    else:
        factors.append("⚠ Weak match between claim and evidence")

    if fresh:
        factors.append("✓ Recently updated source")
    else:
        factors.append("⚠ Source may be outdated")

    if len(distinct_sources) >= 2:
        factors.append(f"✓ {len(distinct_sources)} independent sources agree")
    else:
        factors.append("⚠ Only one source available")

    if has_conflict:
        factors.append("⚠ Trusted sources show conflicting information")
        return "LOW", factors

    if authoritative and top_relevance >= 0.7 and len(distinct_sources) >= 2 and fresh:
        return "HIGH", factors
    if authoritative and top_relevance >= 0.5:
        return "MEDIUM", factors
    if top_relevance >= 0.45:
        return "MEDIUM", factors
    return "LOW", factors
