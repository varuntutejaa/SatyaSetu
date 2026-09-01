"""The deterministic verification engine.

This is the single place a verdict is decided. The LLM/rule-based comparator
only labels individual evidence items SUPPORTS/CONTRADICTS/NEUTRAL — it never
gets to declare a claim VERIFIED or CONTRADICTED by itself. That decision
follows the fixed rules below, so a hallucinating or overconfident comparator
can never override them (spec sections 11-13).
"""
from dataclasses import dataclass, field

from app.verification.confidence import compute_confidence

AUTHORITATIVE_LEVELS = {"AUTHORITATIVE", "HIGH"}
RELEVANCE_THRESHOLD = 0.35


@dataclass
class VerificationResult:
    verdict: str
    confidence: str
    claim_summary: str
    explanation: str
    evidence: list[dict]
    source_count: int
    freshness: str
    limitations: list[str]
    confidence_factors: list[str]
    how_verified: list[dict]


def _merge(evidence: list[dict], assessments: list[dict]) -> list[dict]:
    by_id = {a["evidence_id"]: a for a in assessments}
    merged = []
    for item in evidence:
        assessment = by_id.get(item["id"], {"relationship": "NEUTRAL", "reason": "No comparable content found."})
        merged.append({**item, **assessment})
    return merged


def run_verification(claim_text: str, evidence: list[dict], assessments: list[dict], extra_limitations: list[str] | None = None) -> VerificationResult:
    merged = _merge(evidence, assessments)

    supporting = [
        e for e in merged
        if e["relationship"] == "SUPPORTS"
        and e["authority_level"] in AUTHORITATIVE_LEVELS
        and e["relevance_score"] >= RELEVANCE_THRESHOLD
    ]
    contradicting = [
        e for e in merged
        if e["relationship"] == "CONTRADICTS"
        and e["authority_level"] in AUTHORITATIVE_LEVELS
        and e["relevance_score"] >= RELEVANCE_THRESHOLD
    ]

    limitations = list(extra_limitations or [])
    has_conflict = False

    if contradicting and not supporting:
        verdict = "CONTRADICTED"
        decisive = contradicting
    elif supporting and not contradicting:
        verdict = "VERIFIED"
        decisive = supporting
    elif supporting and contradicting:
        top_contradict = max(e["relevance_score"] for e in contradicting)
        top_support = max(e["relevance_score"] for e in supporting)
        if top_contradict > top_support * 1.1:
            verdict = "CONTRADICTED"
            decisive = contradicting
            limitations.append("Some sources show partial agreement; the strongest evidence contradicts the claim.")
        else:
            verdict = "UNVERIFIED"
            decisive = supporting + contradicting
            has_conflict = True
            limitations.append("Trusted sources provide conflicting signals on this claim — treat with caution.")
    else:
        verdict = "UNVERIFIED"
        decisive = []
        limitations.append("No authoritative evidence was found that directly addresses this claim.")

    confidence, factors = compute_confidence(decisive, has_conflict)

    explanation = _build_explanation(verdict, decisive, claim_text)
    summary = claim_text if len(claim_text) <= 220 else claim_text[:217] + "..."
    source_count = len({e["source_id"] for e in merged})
    freshness = _freshness_note(merged)
    how_verified = _how_verified(claim_text, merged, decisive, verdict, source_count)

    return VerificationResult(
        verdict=verdict,
        confidence=confidence,
        claim_summary=summary,
        explanation=explanation,
        evidence=merged,
        source_count=source_count,
        freshness=freshness,
        limitations=limitations,
        confidence_factors=factors,
        how_verified=how_verified,
    )


def _build_explanation(verdict: str, decisive: list[dict], claim_text: str) -> str:
    if verdict == "VERIFIED":
        top = max(decisive, key=lambda e: e["relevance_score"])
        return f"An official source ({top['source_name']}) supports this claim: {top['reason']}"
    if verdict == "CONTRADICTED":
        top = max(decisive, key=lambda e: e["relevance_score"])
        return f"An official source ({top['source_name']}) conflicts with this claim: {top['reason']}"
    if decisive:
        return "Trusted sources exist on this topic, but they do not clearly agree, so this cannot be confirmed."
    return "We did not find sufficient evidence from an authoritative source to confirm or deny this claim."


def _freshness_note(merged: list[dict]) -> str:
    if not merged:
        return "No source data available."
    latest = max(merged, key=lambda e: e["published_at"])
    return f"Most recent evidence: {latest['source_name']} ({latest['published_at'][:10]})"


def _how_verified(claim_text: str, merged: list[dict], decisive: list[dict], verdict: str, source_count: int) -> list[dict]:
    steps = [
        {"step": 1, "label": "Claim identified", "detail": claim_text},
        {"step": 2, "label": "Trusted sources checked", "detail": f"{len(merged)} relevant document(s) across {source_count} source(s)"},
    ]
    if decisive:
        top = max(decisive, key=lambda e: e["relevance_score"])
        steps.append({"step": 3, "label": "Strongest evidence", "detail": f"{top['source_name']} — {top['document_title']}"})
        steps.append({"step": 4, "label": "Comparison", "detail": top["reason"]})
    else:
        steps.append({"step": 3, "label": "Strongest evidence", "detail": "None found from an authoritative source"})
        steps.append({"step": 4, "label": "Comparison", "detail": "No comparison could be made without evidence"})
    steps.append({"step": 5, "label": "Result", "detail": verdict})
    return steps
