from app.config import get_settings
from app.providers.base import LLMProvider
from app.providers.llm.rule_based_llm import RuleBasedLLMProvider
from app.providers.llm.anthropic_llm import AnthropicLLMProvider
from app.providers.llm.groq_llm import GroqLLMProvider


def get_llm_provider() -> LLMProvider:
    settings = get_settings()
    if settings.llm_api_key and settings.llm_provider == "groq":
        return GroqLLMProvider()
    if settings.llm_api_key:
        return AnthropicLLMProvider()
    return RuleBasedLLMProvider()


__all__ = ["RuleBasedLLMProvider", "AnthropicLLMProvider", "GroqLLMProvider", "get_llm_provider"]
