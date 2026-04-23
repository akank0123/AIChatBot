# AK AI ChatBot

A full-stack RAG chatbot that answers questions from uploaded documents, web pages, or pasted text — and falls back to live web search or general LLM knowledge when no relevant context is found.

**Stack: Node.js/Express + LangChain.js + React** — no Python required.

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

**Backend (Node.js/Express):**
```bash
cd server
npm install --legacy-peer-deps
npm start          # production
npm run dev        # development (auto-restart)
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Project structure

```
server/          ← Node.js/Express backend + LangChain.js AI
  index.js       ← entry point (port 8000)
  config.js
  database.js    ← SQLite sessions
  routes/        ← chat, sessions, documents
  ai/
    providers/   ← OpenAI, Gemini, Ollama
    rag/         ← pipeline, vectorstore, loaders, web search
frontend/        ← React + Vite UI
data/            ← sessions.db + hnswlib_index/ (auto-created)
```

---

## Supported File Types

PDF, TXT, MD, CSV, URL, or raw pasted text. Max upload size: `MAX_FILE_SIZE_MB` (default: 50 MB).

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | one of three | OpenAI (GPT-4o, GPT-3.5) |
| `GOOGLE_API_KEY` | one of three | Google Gemini |
| `OLLAMA_BASE_URL` | one of three | Ollama local URL (default: `http://localhost:11434`) |
| `SERPAPI_KEY` | optional | SerpAPI for live web search |
| `PORT` | optional | Server port (default: `8000`) |
| `MAX_FILE_SIZE_MB` | optional | Upload limit (default: `50`) |
