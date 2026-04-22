import os
from langchain_google_genai import ChatGoogleGenerativeAI
from .base import BaseLLMProvider


class GeminiProvider(BaseLLMProvider):
    name = "gemini"
    models = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash-lite"]

    def get_llm(self, model: str = "gemini-2.0-flash", temperature: float = 0.3):
        return ChatGoogleGenerativeAI(
            model=model,
            temperature=temperature,
            streaming=True,
            google_api_key=os.getenv("GOOGLE_API_KEY"),
        )

    def is_available(self) -> bool:
        return bool(os.getenv("GOOGLE_API_KEY"))
