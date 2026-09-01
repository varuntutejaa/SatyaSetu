from app.services.whatsapp_formatting import format_verification_reply

_BASE_RESULT = {
    "verdict": "VERIFIED",
    "confidence": "HIGH",
    "explanation": "An official source supports this claim.",
    "evidence": [
        {"source_name": "PM-KISAN", "authority_level": "AUTHORITATIVE", "document_url": "https://pmkisan.gov.in/"},
    ],
}


def test_verified_reply_has_green_marker_and_no_warning():
    reply = format_verification_reply(_BASE_RESULT)
    assert "🟢" in reply
    assert "Do not treat this information as confirmed" not in reply


def test_unverified_reply_has_warning():
    result = {**_BASE_RESULT, "verdict": "UNVERIFIED", "evidence": []}
    reply = format_verification_reply(result)
    assert "🟡" in reply
    assert "Do not treat this information as confirmed" in reply


def test_contradicted_reply_has_red_marker():
    result = {**_BASE_RESULT, "verdict": "CONTRADICTED"}
    reply = format_verification_reply(result)
    assert "🔴" in reply
