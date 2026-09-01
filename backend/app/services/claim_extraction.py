from dataclasses import dataclass

from app.utils.language import detect_language
from app.utils.text import extract_entities, hash_text, normalize_text


@dataclass
class ExtractedClaim:
    raw_text: str
    normalized_text: str
    language: str
    hash: str
    entities: dict


def extract_claim(raw_text: str, language_hint: str | None = None) -> ExtractedClaim:
    normalized = normalize_text(raw_text)
    language = language_hint or detect_language(normalized)
    entities = extract_entities(normalized)
    return ExtractedClaim(
        raw_text=raw_text,
        normalized_text=normalized,
        language=language,
        hash=hash_text(normalized),
        entities=entities,
    )
