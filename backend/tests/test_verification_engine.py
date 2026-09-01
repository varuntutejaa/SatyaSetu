"""Guards the two non-negotiable product rules from the spec:
NO EVIDENCE ≠ FALSE, and UNVERIFIED ≠ CONTRADICTED."""
from app.verification.engine import run_verification


def test_no_evidence_is_unverified_not_contradicted():
    result = run_verification("Some claim with no matching evidence", evidence=[], assessments=[])
    assert result.verdict == "UNVERIFIED"
    assert result.verdict != "CONTRADICTED"


def test_neutral_evidence_is_unverified():
    evidence = [{
        "id": "chunk-1", "source_id": "src-1", "source_name": "Test Source",
        "authority_level": "AUTHORITATIVE", "relevance_score": 0.5,
        "published_at": "2026-01-01T00:00:00+00:00", "document_title": "t", "content": "c",
    }]
    assessments = [{"evidence_id": "chunk-1", "relationship": "NEUTRAL", "reason": "unrelated"}]
    result = run_verification("claim", evidence, assessments)
    assert result.verdict == "UNVERIFIED"


def test_authoritative_support_is_verified():
    evidence = [{
        "id": "chunk-1", "source_id": "src-1", "source_name": "Test Source",
        "authority_level": "AUTHORITATIVE", "relevance_score": 0.8,
        "published_at": "2026-01-01T00:00:00+00:00", "document_title": "t", "content": "c",
    }]
    assessments = [{"evidence_id": "chunk-1", "relationship": "SUPPORTS", "reason": "matches"}]
    result = run_verification("claim", evidence, assessments)
    assert result.verdict == "VERIFIED"


def test_authoritative_contradiction_is_contradicted():
    evidence = [{
        "id": "chunk-1", "source_id": "src-1", "source_name": "Test Source",
        "authority_level": "AUTHORITATIVE", "relevance_score": 0.8,
        "published_at": "2026-01-01T00:00:00+00:00", "document_title": "t", "content": "c",
    }]
    assessments = [{"evidence_id": "chunk-1", "relationship": "CONTRADICTS", "reason": "mismatch"}]
    result = run_verification("claim", evidence, assessments)
    assert result.verdict == "CONTRADICTED"


def test_unknown_source_cannot_independently_verify():
    evidence = [{
        "id": "chunk-1", "source_id": "src-1", "source_name": "Random Blog",
        "authority_level": "UNKNOWN", "relevance_score": 0.9,
        "published_at": "2026-01-01T00:00:00+00:00", "document_title": "t", "content": "c",
    }]
    assessments = [{"evidence_id": "chunk-1", "relationship": "SUPPORTS", "reason": "matches"}]
    result = run_verification("claim", evidence, assessments)
    assert result.verdict == "UNVERIFIED"
