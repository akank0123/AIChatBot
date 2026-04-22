import os
from langchain_openai import ChatOpenAI
from .base import BaseLLMProvider


class OpenAIProvider(BaseLLMProvider):
    name = "openai"
    models = ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"]

    def get_llm(self, model: str = "gpt-4o-mini", temperature: float = 0.3) -> ChatOpenAI:
        return ChatOpenAI(
            model=model,
            temperature=temperature,
            streaming=True,
            api_key=os.getenv("OPENAI_API_KEY"),
        )

    def is_available(self) -> bool:
        return bool(os.getenv("OPENAI_API_KEY"))
