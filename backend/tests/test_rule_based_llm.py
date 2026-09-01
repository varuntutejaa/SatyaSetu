"""Regression tests for two real bugs the corpus expansion exposed:
generic scheme-vocabulary words causing false topical matches between
unrelated schemes, and a ratio-based negation threshold that let one real
contradiction signal get diluted by several correctly-matching topic words."""
import asyncio

from app.providers.embeddings.local_embedding import tokenize
from app.providers.llm.rule_based_llm import RuleBasedLLMProvider


def test_generic_scheme_words_are_filtered_from_tokens():
    tokens = set(tokenize("PM-KISAN gives eligible small farmer families money per year"))
    assert "eligible" not in tokens
    assert "families" not in tokens
    assert "pm" not in tokens
    assert "per" not in tokens
    assert "farmer" in tokens  # a genuinely distinguishing word must survive


def test_single_negation_flip_is_not_diluted_by_matching_topic_words():
    claim = "PM Ujjwala Yojana gives women free LPG cylinder refills for life."
    evidence = [{
        "id": "e1",
        "content": (
            "Pradhan Mantri Ujjwala Yojana provides an LPG gas connection at no upfront deposit to "
            "adult women from economically disadvantaged households. Beneficiaries are still required "
            "to pay for subsequent LPG refills at the applicable market price. Refills are not free "
            "under the base scheme."
        ),
    }]
    result = asyncio.run(RuleBasedLLMProvider().compare_claim_to_evidence(claim, evidence))
    assert result["evidence_assessments"][0]["relationship"] == "CONTRADICTS"


def test_incidental_pronoun_overlap_does_not_trigger_false_contradiction():
    claim = "MGNREGA guarantees at least 100 days of paid work per year to rural households who volunteer for it."
    evidence = [{
        "id": "e1",
        "content": (
            "MGNREGA legally guarantees at least 100 days of paid unskilled manual work per financial "
            "year to every rural household whose adult members volunteer for it. Work and wage payment "
            "are provided through the local Gram Panchayat and linked to a registered job card. It is "
            "not an unconditional cash payment handed out to anyone who simply asks for it."
        ),
    }]
    result = asyncio.run(RuleBasedLLMProvider().compare_claim_to_evidence(claim, evidence))
    assert result["evidence_assessments"][0]["relationship"] == "SUPPORTS"
