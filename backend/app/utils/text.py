import hashlib
import re


def normalize_text(text: str) -> str:
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    # Strip common WhatsApp-forward chrome that pollutes claim extraction.
    text = re.sub(r"(?i)^forwarded(\s+many\s+times)?\s*[:\-]?\s*", "", text)
    text = re.sub(r"https?://\S+", "", text)
    return text.strip()


def hash_text(text: str) -> str:
    return hashlib.sha256(text.strip().lower().encode("utf-8")).hexdigest()


_AMOUNT_RE = re.compile(r"(?:₹|rs\.?\s*)\s*\d[\d,]*(?:\.\d+)?|\d[\d,]*(?:\.\d+)?\s*(?:rupees|lakh|crore)", re.IGNORECASE)
_ORG_HINTS = [
    "government", "sarkar", "सरकार", "ਸਰਕਾਰ", "ministry", "rbi", "reserve bank",
    "uidai", "aadhaar", "pm kisan", "pm-kisan", "who", "mohfw", "income tax",
]


def extract_entities(text: str) -> dict:
    """Lightweight, transparent entity extraction (no black-box NER needed
    for the scoped demo corpus): amounts and organization/scheme hints."""
    amounts = _AMOUNT_RE.findall(text)
    lowered = text.lower()
    orgs = [hint for hint in _ORG_HINTS if hint in lowered]
    return {"amounts": amounts, "organizations": orgs}
