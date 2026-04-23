# AK AI ChatBot

A full-stack RAG chatbot that answers questions from uploaded documents, web pages, or pasted text — and falls back to live web search or general LLM knowledge when no relevant context is found.

---

## Features

- Upload PDF, TXT, MD, or CSV files; paste raw text; or provide a URL
- Agentic routing — uses document context, live web search, or general LLM based on the question
- Multi-provider LLM support — OpenAI, Google Gemini, or Ollama (local/offline)
- Streaming responses via Server-Sent Events
- Per-session chat history persisted in SQLite
- Live web search via SerpAPI for real-time data

---

## Setup

### 1. Configure environment

```bash
cp .env.example .env
```

Fill in your keys in `.env` — at least one LLM provider (OpenAI, Gemini, or a running Ollama) is required. `SERPAPI_KEY` is optional but enables live web search.

### 2. Run with Docker Compose

```bash
docker compose up --build
```

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`

### 3. Run locally

**Backend:**
```bash
pip install uv
uv sync
uv run uvicorn backend.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Supported File Types

PDF, TXT, MD, CSV, URL, or raw pasted text. Max upload size is set by `MAX_FILE_SIZE_MB` (default: 50 MB).

---