import os
import httpx
from langchain_ollama import ChatOllama
from .base import BaseLLMProvider


class LlamaProvider(BaseLLMProvider):
    name = "llama"
    models = ["llama3.2", "llama3.1", "llama3", "mistral", "codellama"]

    def get_llm(self, model: str = "llama3.2", temperature: float = 0.3) -> ChatOllama:
        return ChatOllama(
            model=model,
            temperature=temperature,
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            streaming=True,
        )

    def is_available(self) -> bool:
        base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        try:
            r = httpx.get(f"{base_url}/api/tags", timeout=2.0)
            return r.status_code == 200
        except Exception:
            return False
