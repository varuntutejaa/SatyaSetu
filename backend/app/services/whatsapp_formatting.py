"""Formats a verification result as a WhatsApp text message.

WhatsApp's Cloud API only sends plain text with light markdown (*bold*,
_italic_) — no cards, no HTML. Kept short and skimmable on purpose: this is
the same audience the rest of the app designs for (low digital literacy,
often on a small screen and a slow connection).
"""

_VERDICT_EMOJI = {
    "VERIFIED": "🟢",
    "UNVERIFIED": "🟡",
    "CONTRADICTED": "🔴",
}


def format_verification_reply(result: dict) -> str:
    emoji = _VERDICT_EMOJI.get(result["verdict"], "🟡")
    lines = [
        f"{emoji} *{result['verdict']}*",
        f"Confidence: {result['confidence']}",
        "",
        result["explanation"],
    ]

    top_evidence = result["evidence"][:2]
    if top_evidence:
        lines.append("")
        lines.append("*Sources checked:*")
        for item in top_evidence:
            lines.append(f"• {item['source_name']} ({item['authority_level'].title()})")
            if item.get("document_url"):
                lines.append(f"  {item['document_url']}")

    if result["verdict"] == "UNVERIFIED":
        lines.append("")
        lines.append("⚠️ Do not treat this information as confirmed.")

    lines.append("")
    lines.append("_Send another message, screenshot, or voice note to check something else._")

    return "\n".join(lines)


def format_error_reply(message: str) -> str:
    return f"⚠️ {message}"


GREETING = (
    "🛡️ *SatyaSetu* — Evidence before belief.\n\n"
    "Send me a message, forward, or screenshot you want to verify. "
    "I'll check it against official government, health, and financial sources "
    "and tell you what the evidence actually shows — never a guess."
)

UNSUPPORTED_MESSAGE = (
    "I can check text messages, screenshots, and voice notes. "
    "Please send one of those and I'll verify it against trusted sources."
)
