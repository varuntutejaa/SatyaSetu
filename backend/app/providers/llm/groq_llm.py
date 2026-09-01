"""Optional LLM-backed evidence comparator using Groq's OpenAI-compatible API.

Same contract and same guardrail as the Anthropic provider: this only labels
each piece of evidence SUPPORTS/CONTRADICTS/NEUTRAL. It never gets to declare
a claim VERIFIED or CONTRADICTED on its own — that's still decided by the
deterministic engine in app/verification/engine.py.
"""
import json
import re

import httpx

from app.config import get_settings
from app.providers.base import LLMProvider, ProviderUnavailableError

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "openai/gpt-oss-120b"

SYSTEM_PROMPT = """You are an evidence-based information verification assistant.

You must never decide that a claim is true or false based solely on your internal knowledge.
You may only make a strong verification claim when supported by provided evidence.

Possible relationships for each piece of evidence: SUPPORTS, CONTRADICTS, NEUTRAL.
Never treat absence of evidence as proof of falsity.
Never invent sources, citations, dates, statistics, schemes, laws, or announcements beyond what is given.
If sources disagree, explicitly state that they disagree.

Return ONLY a single JSON object, no prose before or after, matching this shape:
{
  "evidence_assessments": [
    {"evidence_id": "...", "relationship": "SUPPORTS|CONTRADICTS|NEUTRAL", "reason": "..."}
  ],
  "limitations": ["..."]
}"""

_JSON_BLOCK_RE = re.compile(r"\{.*\}", re.DOTALL)


class GroqLLMProvider(LLMProvider):
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

        model = self.settings.llm_model if self.settings.llm_model != "claude-sonnet-5" else DEFAULT_MODEL

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    GROQ_URL,
                    headers={
                        "Authorization": f"Bearer {self.settings.llm_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": model,
                        "max_tokens": 1024,
                        "temperature": 0,
                        "response_format": {"type": "json_object"},
                        "messages": [
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": user_content},
                        ],
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                text = data["choices"][0]["message"]["content"]
                match = _JSON_BLOCK_RE.search(text)
                return json.loads(match.group(0) if match else text)
        except (httpx.HTTPError, json.JSONDecodeError, KeyError, IndexError) as exc:
            raise ProviderUnavailableError(f"Groq comparison failed: {exc}") from exc
