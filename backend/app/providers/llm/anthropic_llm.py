"""Optional LLM-backed evidence comparator (used only when LLM_API_KEY is set).

Even when enabled, this provider's output is still just advisory input to the
deterministic verification engine (app/verification/engine.py) — it cannot
unilaterally declare a claim VERIFIED or CONTRADICTED. See the system prompt
below, which mirrors section 28 of the product spec verbatim in spirit.
"""
import json

import httpx

from app.config import get_settings
from app.providers.base import LLMProvider, ProviderUnavailableError

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"

SYSTEM_PROMPT = """You are an evidence-based information verification assistant.

You must never decide that a claim is true or false based solely on your internal knowledge.
You may only make a strong verification claim when supported by provided evidence.

Possible relationships for each piece of evidence: SUPPORTS, CONTRADICTS, NEUTRAL.
Never treat absence of evidence as proof of falsity.
Never invent sources, citations, dates, statistics, schemes, laws, or announcements beyond what is given.
If sources disagree, explicitly state that they disagree.

Return ONLY structured JSON matching this shape:
{
  "evidence_assessments": [
    {"evidence_id": "...", "relationship": "SUPPORTS|CONTRADICTS|NEUTRAL", "reason": "..."}
  ],
  "limitations": ["..."]
}"""


class AnthropicLLMProvider(LLMProvider):
    def __init__(self) -> None:
        self.settings = get_settings()

    async def compare_claim_to_evidence(self, claim: str, evidence: list[dict]) -> dict:
        if not self.settings.llm_api_key:
            raise ProviderUnavailableError("LLM_API_KEY is not configured")

        user_content = json.dumps({
            "claim": claim,
            "evidence": [
                {"id": e["id"], "source": e.get("source_name", ""), "content": e["content"]}
                for e in evidence
            ],
        })

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    ANTHROPIC_URL,
                    headers={
                        "x-api-key": self.settings.llm_api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json={
                        "model": self.settings.llm_model,
                        "max_tokens": 1024,
                        "system": SYSTEM_PROMPT,
                        "messages": [{"role": "user", "content": user_content}],
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                text = "".join(block.get("text", "") for block in data.get("content", []))
                return json.loads(text)
        except (httpx.HTTPError, json.JSONDecodeError, KeyError) as exc:
            raise ProviderUnavailableError(f"LLM comparison failed: {exc}") from exc
