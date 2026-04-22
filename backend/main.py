"""Application entry point — creates the FastAPI app and registers all routers."""
import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", category=FutureWarning)

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import ALLOWED_ORIGINS, HOST, OLLAMA_BASE_URL, PORT
from backend.database import init_db
from backend.routes import chat, documents, sessions
from ai.rag import vectorstore as vs


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    vs.load_persisted()

    import httpx
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            await client.post(f"{OLLAMA_BASE_URL}/api/generate", json={
                "model": "llama3.2", "prompt": "hi", "stream": False,
                "options": {"num_predict": 1},
            })
    except Exception:
        pass

    yield


app = FastAPI(title="RAG Chatbot", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Session-Id"],
)

app.include_router(chat.router)
app.include_router(sessions.router)
app.include_router(documents.router)


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=True)
