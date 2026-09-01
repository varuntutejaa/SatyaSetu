"""Deterministic, dependency-free embedding provider.

Uses feature hashing (the "hashing trick") over normalized tokens to produce
a fixed-size vector, so semantic-ish nearest-neighbour search works over the
curated demo corpus without any external embedding API or model download.
Swap in a real EmbeddingProvider (OpenAI/Sarvam/local sentence-transformer)
by implementing the same interface — nothing else in the RAG pipeline
needs to change.
"""
import hashlib
import re

import numpy as np

from app.providers.base import EmbeddingProvider

_TOKEN_RE = re.compile(r"[\wऀ-ॿ਀-੿]+", re.UNICODE)

_STOPWORDS = {
    "the", "is", "a", "an", "of", "to", "and", "in", "for", "on", "are",
    "was", "were", "be", "has", "have", "will", "that", "this", "it",
    # Generic pronouns/relative-clause words — near-zero topical signal,
    # but incidental matches between unrelated clauses (e.g. "who" showing
    # up in both a claim's relative clause and an evidence document's
    # unrelated negated clause) were producing false contradiction flags.
    "who", "whose", "which", "whom", "anyone", "someone", "something",
    "these", "those", "such", "as", "at", "by", "with", "from",
    "its", "their", "there",
    # Generic scheme-document vocabulary — appears near-identically across
    # most Government of India scheme descriptions and, left unfiltered,
    # caused unrelated schemes to look topically similar purely from
    # shared boilerplate words like "eligible families... per year".
    # Deliberately excludes anything in rule_based_llm._NEGATION_TRIGGERS.
    "pm", "eligible", "eligibility", "family", "families", "per",
    "provide", "provides", "providing", "scheme", "schemes", "government",
    "india", "indian", "official", "national", "under", "programme",
    "program", "ministry", "citizens", "citizen", "beneficiary",
    "beneficiaries",
}


def tokenize(text: str) -> list[str]:
    tokens = _TOKEN_RE.findall(text.lower())
    return [t for t in tokens if t not in _STOPWORDS and len(t) > 1]


class LocalHashingEmbeddingProvider(EmbeddingProvider):
    def __init__(self, dims: int = 256) -> None:
        self._dims = dims

    @property
    def dimensions(self) -> int:
        return self._dims

    def embed(self, text: str) -> list[float]:
        vector = np.zeros(self._dims, dtype=np.float64)
        tokens = tokenize(text)
        if not tokens:
            return vector.tolist()

        for token in tokens:
            digest = hashlib.sha256(token.encode("utf-8")).digest()
            index = int.from_bytes(digest[:4], "big") % self._dims
            sign = 1.0 if digest[4] % 2 == 0 else -1.0
            vector[index] += sign

        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm
        return vector.tolist()


def cosine_similarity(a: list[float], b: list[float]) -> float:
    va, vb = np.array(a), np.array(b)
    na, nb = np.linalg.norm(va), np.linalg.norm(vb)
    if na == 0 or nb == 0:
        return 0.0
    return float(np.dot(va, vb) / (na * nb))
