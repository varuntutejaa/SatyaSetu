import re

from langdetect import DetectorFactory, LangDetectException, detect

DetectorFactory.seed = 0

_DEVANAGARI = re.compile(r"[ऀ-ॿ]")
_GURMUKHI = re.compile(r"[਀-੿]")

_LANGDETECT_TO_APP = {
    "hi": "hi-IN",
    "pa": "pa-IN",
    "en": "en-IN",
}


def detect_language(text: str) -> str:
    """Best-effort language detection, returning one of hi-IN/pa-IN/en-IN.

    Script-based detection is checked first (fast, reliable for Devanagari
    and Gurmukhi), then langdetect as a fallback for Romanized/English text.
    """
    if _GURMUKHI.search(text):
        return "pa-IN"
    if _DEVANAGARI.search(text):
        return "hi-IN"

    try:
        code = detect(text)
    except LangDetectException:
        return "en-IN"
    return _LANGDETECT_TO_APP.get(code, "en-IN")
