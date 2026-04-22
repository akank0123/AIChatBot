from abc import ABC, abstractmethod
from typing import AsyncIterator
from langchain_core.language_models import BaseChatModel


class BaseLLMProvider(ABC):
    """Provider-agnostic abstraction for LLM backends."""

    @abstractmethod
    def get_llm(self) -> BaseChatModel:
        """Return a LangChain-compatible chat model."""
        ...

    @abstractmethod
    def is_available(self) -> bool:
        """Check whether this provider is configured and reachable."""
        ...

    @property
    @abstractmethod
    def name(self) -> str:
        ...

    @property
    @abstractmethod
    def models(self) -> list[str]:
        """List of supported model identifiers."""
        ...
