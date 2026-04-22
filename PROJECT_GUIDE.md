# RAG Knowledge Chatbot — Project Guide

A **Retrieval-Augmented Generation (RAG)** chatbot that answers questions about your documents using OpenAI GPT, Google Gemini, or a local Llama model.

---

## Architecture

```
Browser (React :5173)
    │  POST /api/chat  (SSE stream)
    │  POST /api/documents/upload
    │  GET  /api/chat/providers
    ▼
Python FastAPI (port 8000)
    ├── Sessions   → SQLite (data/sessions.db)
    ├── FAISS      → vector store (data/faiss_index/)
    ├── OpenAI     → LLM provider 1
    ├── Gemini     → LLM provider 2
    └── Llama      → LLM provider 3 (local via Ollama)
```

---

## Folder Structure

```
AIChatBot/
├── backend/                  FastAPI app
│   ├── main.py               App entry point — registers routers, lifespan
│   ├── config.py             All env vars and constants
│   ├── database.py           SQLite session storage
│   ├── models/               Pydantic request/response schemas
│   │   ├── chat.py
│   │   ├── session.py
│   │   └── document.py
│   ├── routes/               Route handlers (one file per feature)
│   │   ├── chat.py           POST /api/chat, GET /api/chat/providers|status
│   │   ├── sessions.py       CRUD /api/sessions
│   │   └── documents.py      POST /api/documents/upload|url|text, DELETE
│   └── services/
│       └── sse.py            SSE keep-alive wrapper
│
├── ai/                       AI / ML code
│   ├── providers/            LLM provider abstraction
│   │   ├── base.py           Abstract base class
│   │   ├── openai_provider.py
│   │   ├── gemini_provider.py
│   │   └── llama_provider.py
│   └── rag/
│       ├── pipeline.py       RAG query + streaming logic
│       ├── vectorstore.py    FAISS vector store management
│       ├── loaders.py        PDF / text / URL ingestion
│       └── web_search.py     SerpAPI web search
│
├── frontend/                 React + Vite
│   └── src/
│       ├── App.jsx
│       ├── components/
│       │   ├── ChatInterface.jsx
│       │   ├── MessageList.jsx
│       │   ├── MessageItem.jsx
│       │   ├── Sidebar.jsx
│       │   ├── ProviderSelector.jsx
│       │   └── DocumentUploader.jsx
│       ├── hooks/
│       │   └── useChat.js        Streaming state hook
│       └── services/
│           ├── api.js            Axios base instance
│           ├── chatApi.js        streamChat (SSE)
│           ├── documentsApi.js   upload / ingest / clear
│           └── providersApi.js   getProviders
│
├── data/                     Runtime only — auto-created, gitignored
│   ├── sessions.db           Conversation history (SQLite)
│   └── faiss_index/          Uploaded document embeddings
│
├── pyproject.toml            Python dependencies (like package.json)
├── Dockerfile                Production container
├── docker-compose.yml        Run backend + frontend together
├── .env                      Your API keys — never commit
├── .env.example              Template for .env
├── .gitignore
└── PROJECT_GUIDE.md          This file
```

---

## Setup (First Time)

### 1. API Keys

```bash
cp .env.example .env
```

Open `.env` and fill in:

```
OPENAI_API_KEY=sk-...          # get from platform.openai.com
GOOGLE_API_KEY=AIza...         # get from console.cloud.google.com
SERPAPI_KEY=...                # get from serpapi.com (web search)
```

> You only need **one** LLM key to start. Llama needs no key — just Ollama running locally.

### 2. Install Python package manager (once only)

```bash
pip3 install uv
```

---

## Running Locally

Open **two terminals** from the project root:

**Terminal 1 — Backend**
```bash
# First time only
uv sync

# Every time
uv run uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload #if host,port and reload is not mentioned in main.py file
uv run uvicorn backend.main:app
```

**Terminal 2 — Frontend**
```bash
cd frontend

# First time only
npm install

# Every time
npm run dev
```

| Service  | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

> `--reload` auto-restarts the backend on every file save. Remove it if you don't want that.

---

## Running in Production (Docker)

```bash
# First time or after code changes
docker compose up --build -d

# Check logs
docker compose logs -f

# Stop
docker compose down
```

---

## How It Works (RAG Flow)

```
User asks a question
        │
        ▼
Search FAISS for relevant document chunks
        │
        ├── Has docs?  → build prompt with doc context
        ├── Needs web? → SerpAPI search → add web results
        └── Neither?   → general LLM answer
        │
        ▼
Build message list (last 10 conversation turns + question)
        │
        ▼
Stream LLM response token by token (SSE)
        │
        ▼
Save completed Q&A turn to sessions.db
        │
        ▼
React renders words live as they arrive
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET  | `/health` | Health check |
| POST | `/api/chat` | Chat — returns SSE stream |
| GET  | `/api/chat/providers` | List available LLM providers |
| GET  | `/api/chat/status` | Provider status + knowledge base status |
| POST | `/api/sessions` | Create a new session |
| GET  | `/api/sessions/:id` | Get session + history |
| PATCH | `/api/sessions/:id` | Update provider/model preference |
| DELETE | `/api/sessions/:id` | Delete session |
| POST | `/api/documents/upload` | Upload PDF / TXT / MD / CSV |
| POST | `/api/documents/url` | Scrape and ingest a URL |
| POST | `/api/documents/text` | Ingest pasted text |
| DELETE | `/api/documents` | Clear entire knowledge base |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | — | OpenAI key |
| `GOOGLE_API_KEY` | — | Gemini key |
| `SERPAPI_KEY` | — | SerpAPI key for web search |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama host |
| `VECTOR_STORE` | `faiss` | `faiss` or `chroma` |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | CORS allowed origins (comma-separated) |
| `MAX_FILE_SIZE_MB` | `50` | Max upload file size |
| `PORT` | `8000` | Backend port |
| `HOST` | `0.0.0.0` | Backend host |

---

## LLM Provider Setup

### OpenAI
Set `OPENAI_API_KEY` in `.env`
Models: `gpt-4o-mini` (default), `gpt-4o`, `gpt-3.5-turbo`

### Google Gemini
Set `GOOGLE_API_KEY` in `.env`
Models: `gemini-2.0-flash` (default), `gemini-1.5-pro`, `gemini-2.5-pro`

### Llama (Local)
```bash
# Install Ollama from https://ollama.com
ollama pull llama3.2
ollama serve
```
No API key needed. Set `OLLAMA_BASE_URL` if Ollama runs on a different machine.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite |
| Backend | Python, FastAPI, Uvicorn |
| AI / RAG | LangChain, FAISS, sentence-transformers |
| LLMs | OpenAI GPT, Google Gemini, Llama (Ollama) |
| Sessions | SQLite |
| Web Search | SerpAPI |
| Streaming | Server-Sent Events (SSE) |
| Packaging | uv + pyproject.toml |
| Production | Docker + docker-compose |
