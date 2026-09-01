"""Deterministic evidence comparator — the default LLMProvider.

This is what SatyaSetu falls back to when no LLM_API_KEY is configured. It
does exactly the job the spec's system prompt describes: for each piece of
retrieved evidence, decide whether it SUPPORTS, CONTRADICTS, or is NEUTRAL
to the claim — using token overlap, numeric-mismatch detection, and clause-
scoped negation, never the model's "internal knowledge". The final verdict
is still decided by app/verification/engine.py, not by this comparator, so
a misbehaving comparator can never fabricate a VERIFIED/CONTRADICTED
verdict on its own.
"""
import re

from app.providers.base import LLMProvider
from app.providers.embeddings.local_embedding import tokenize

_NUMBER_RE = re.compile(r"(?:₹|rs\.?\s*)?\d[\d,]*(?:\.\d+)?", re.IGNORECASE)

# Words that grammatically negate the clause they sit in (not the content
# states they describe — "banned"/"invalid" are regular content words, not
# negation operators, so they are deliberately excluded here).
_NEGATION_TRIGGERS = {"not", "no", "never", "cannot", "without", "नहीं", "ਨਹੀਂ"}

# Only split on true clause boundaries (sentence end, or a subordinating/
# coordinating conjunction that introduces a genuinely separate clause).
# Commas and "that" are deliberately NOT split points — they usually
# separate items inside one still-negated clause (e.g. "no home remedy,
# such as X, Y, or Z, has been proven..."), and splitting there would
# strand "X, Y, Z" outside the negation's scope.
_CLAUSE_SPLIT_RE = re.compile(
    r"[.;]|(?:\bif\b|\bbecause\b|\bunless\b|\balthough\b|\bwhile\b|\bwhen\b|\bbut\b|\bhowever\b)",
    re.IGNORECASE,
)

SUPPORT_OVERLAP_THRESHOLD = 0.32


def _extract_numbers(text: str) -> set[str]:
    found = _NUMBER_RE.findall(text)
    cleaned = {re.sub(r"[₹,\s]", "", n).lower().lstrip("rs.").strip() for n in found}
    return {n for n in cleaned if n and any(c.isdigit() for c in n)}


def _token_negation_status(text: str) -> dict[str, str]:
    """Maps each content token to 'negated' or 'plain' based on whether the
    clause it appears in contains a negation trigger. A token seen in both
    a negated and a plain clause is left out (ambiguous, skip it)."""
    negated_tokens: set[str] = set()
    plain_tokens: set[str] = set()

    for clause in _CLAUSE_SPLIT_RE.split(text):
        clause_tokens = tokenize(clause)
        if not clause_tokens:
            continue
        is_negated_clause = bool(set(clause_tokens) & _NEGATION_TRIGGERS)
        target = negated_tokens if is_negated_clause else plain_tokens
        target.update(clause_tokens)

    status: dict[str, str] = {}
    for token in negated_tokens - plain_tokens:
        status[token] = "negated"
    for token in plain_tokens - negated_tokens:
        status[token] = "plain"
    return status


def _token_overlap(claim_tokens: set[str], evidence_tokens: set[str]) -> float:
    if not claim_tokens:
        return 0.0
    return len(claim_tokens & evidence_tokens) / len(claim_tokens)


def _negation_mismatch(claim: str, content: str, shared_tokens: set[str]) -> bool:
    claim_status = _token_negation_status(claim)
    evidence_status = _token_negation_status(content)

    mismatches = matches = 0
    for token in shared_tokens:
        c_status = claim_status.get(token)
        e_status = evidence_status.get(token)
        if c_status is None or e_status is None:
            continue
        if c_status == e_status:
            matches += 1
        else:
            mismatches += 1

    # Ambiguous tokens (negated in one clause, plain in another within the
    # same text) are already excluded upstream, so a token that clears this
    # far is a clean, clause-scoped negation flip — not noise. A ratio
    # threshold against `matches` was tried here and rejected: documents
    # naturally share many correctly-matching topic/scheme-name words
    # alongside a single genuine polarity flip (e.g. "free" vs "not ...
    # free"), and requiring mismatches to be ~34% of matches let that one
    # real signal get diluted into a false SUPPORTS on longer documents.
    return mismatches >= 1


class RuleBasedLLMProvider(LLMProvider):
    async def compare_claim_to_evidence(self, claim: str, evidence: list[dict]) -> dict:
        claim_tokens = set(tokenize(claim))
        claim_numbers = _extract_numbers(claim)

        assessments = []
        for item in evidence:
            content = item["content"]
            evidence_tokens = set(tokenize(content))
            shared_tokens = claim_tokens & evidence_tokens
            overlap = _token_overlap(claim_tokens, evidence_tokens)
            evidence_numbers = _extract_numbers(content)

            if overlap < SUPPORT_OVERLAP_THRESHOLD:
                relationship = "NEUTRAL"
                reason = "This source does not discuss the same topic as the claim closely enough to compare."
            elif claim_numbers and evidence_numbers and not (claim_numbers & evidence_numbers):
                relationship = "CONTRADICTS"
                reason = (
                    f"The claim states {', '.join(sorted(claim_numbers))} but the official source states "
                    f"{', '.join(sorted(evidence_numbers))} — these do not match."
                )
            elif _negation_mismatch(claim, content, shared_tokens):
                relationship = "CONTRADICTS"
                reason = "The official source directly conflicts with what the claim asserts on this point."
            else:
                relationship = "SUPPORTS"
                reason = "This source discusses the same topic and its details align with the claim."

            assessments.append({
                "evidence_id": item["id"],
                "relationship": relationship,
                "reason": reason,
                "overlap": overlap,
            })

        return {
            "evidence_assessments": assessments,
            "limitations": [
                "Automated comparison uses keyword, numeric, and negation matching; nuanced or implied claims may need human review.",
            ],
        }
