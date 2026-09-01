from functools import lru_cache

from app.providers.base import EmbeddingProvider, LLMProvider
from app.providers.embeddings.local_embedding import LocalHashingEmbeddingProvider
from app.providers.llm import get_llm_provider


@lru_cache
def get_embedder() -> EmbeddingProvider:
    return LocalHashingEmbeddingProvider()


def get_llm() -> LLMProvider:
    return get_llm_provider()
