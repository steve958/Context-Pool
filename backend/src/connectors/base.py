"""
LLMConnector abstract base class + factory.
All provider connectors implement this interface.
"""

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from src.config import AppConfig


class LLMConnector(ABC):

    @abstractmethod
    async def complete(self, prompt: str, system: str, temperature: float, timeout: float) -> tuple[str, dict]:
        """Send a prompt and return (response_text, usage_dict)."""

    @abstractmethod
    def count_tokens(self, text: str) -> int:
        """Count tokens for the given text using this provider's tokenizer."""


def get_connector(cfg: "AppConfig") -> LLMConnector:
    provider = cfg.provider.lower()
    if provider == "openai":
        from src.connectors.openai import OpenAIConnector
        return OpenAIConnector(cfg)
    elif provider == "anthropic":
        from src.connectors.anthropic import AnthropicConnector
        return AnthropicConnector(cfg)
    elif provider == "google":
        from src.connectors.gemini import GeminiConnector
        return GeminiConnector(cfg)
    elif provider == "ollama":
        from src.connectors.ollama import OllamaConnector
        return OllamaConnector(cfg)
    else:
        raise ValueError(f"Unknown provider: {provider}")
