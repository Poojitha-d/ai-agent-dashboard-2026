from typing import Optional, Dict
from app.adapters.base import BaseProviderAdapter
from app.adapters.openai_adapter import OpenAIAdapter
from app.adapters.anthropic_adapter import AnthropicAdapter
from app.adapters.gemini_adapter import GeminiAdapter
from app.adapters.csv_adapter import CSVLogAdapter

ADAPTERS: Dict[str, BaseProviderAdapter] = {
    "openai": OpenAIAdapter(),
    "anthropic": AnthropicAdapter(),
    "gemini": GeminiAdapter(),
    "google": GeminiAdapter(),
    "azure_openai": OpenAIAdapter(),
    "azure": OpenAIAdapter(),
}


def get_adapter(provider_name: str) -> Optional[BaseProviderAdapter]:
    return ADAPTERS.get(provider_name.lower())


__all__ = [
    "BaseProviderAdapter",
    "OpenAIAdapter",
    "AnthropicAdapter",
    "GeminiAdapter",
    "CSVLogAdapter",
    "get_adapter",
]
