import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Document, DocumentChunk, Source
from app.providers.base import EmbeddingProvider
from app.rag.ranking import rank_score

TOP_K = 6

# Document embeddings never change at runtime (seeded once, no endpoint
# mutates them) — re-parsing the same JSON vector on every single
# verification request was pure waste, and it scales with corpus size.
_embedding_cache: dict[int, list[float]] = {}


def _cached_vector(chunk_id: int, raw_embedding: str) -> list[float]:
    vector = _embedding_cache.get(chunk_id)
    if vector is None:
        vector = json.loads(raw_embedding)
        _embedding_cache[chunk_id] = vector
    return vector


def retrieve_evidence(db: Session, claim_text: str, embedder: EmbeddingProvider, top_k: int = TOP_K) -> list[dict]:
    """Vector Search + Trusted Source Filter, per the RAG pipeline in the spec.

    Only sources marked allowed_for_verification/active are ever searched —
    provenance (source_id, url, title, dates) travels with every result so
    it is never lost between retrieval and display.
    """
    claim_vector = embedder.embed(claim_text)

    rows = (
        db.execute(
            select(DocumentChunk, Document, Source)
            .join(Document, DocumentChunk.document_id == Document.id)
            .join(Source, DocumentChunk.source_id == Source.id)
            .where(Source.allowed_for_verification.is_(True))
            .where(Source.active.is_(True))
        )
        .all()
    )

    from app.providers.embeddings.local_embedding import cosine_similarity

    scored = []
    for chunk, document, source in rows:
        chunk_vector = _cached_vector(chunk.id, chunk.embedding)
        similarity = cosine_similarity(claim_vector, chunk_vector)
        score = rank_score(similarity, source.authority_level, document.published_at)
        scored.append({
            "id": chunk.id,
            "content": chunk.content,
            "source_id": source.id,
            "source_name": source.name,
            "source_domain": source.domain,
            "authority_level": source.authority_level,
            "category": source.category,
            "document_id": document.id,
            "document_title": document.title,
            "document_url": document.url,
            "published_at": document.published_at.isoformat(),
            "retrieved_at": document.retrieved_at.isoformat(),
            "language": chunk.language,
            "similarity": round(similarity, 4),
            "relevance_score": score,
        })

    scored.sort(key=lambda item: item["relevance_score"], reverse=True)
    return [item for item in scored if item["similarity"] > 0.05][:top_k]
