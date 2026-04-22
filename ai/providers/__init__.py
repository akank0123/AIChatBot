from .base import BaseLLMProvider
from .openai_provider import OpenAIProvider
from .gemini_provider import GeminiProvider
from .llama_provider import LlamaProvider

PROVIDERS = {
    "openai": OpenAIProvider,
    "gemini": GeminiProvider,
    "llama":  LlamaProvider,
}


def get_provider(name: str) -> BaseLLMProvider:
    cls = PROVIDERS.get(name.lower())
    if not cls:
        raise ValueError(f"Unknown provider '{name}'. Choose from: {list(PROVIDERS.keys())}")
    return cls()
