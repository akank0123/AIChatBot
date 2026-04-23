# Node.js Backend — Quick Reference

The `server/` directory is a full Node.js/Express replacement for the old Python (FastAPI + LangChain) backend.
**Zero Python required.** The React frontend and the SQLite database are unchanged.

---

## Stack

| Layer | Technology |
|---|---|
| Web framework | Express 4 |
| AI / LLM | LangChain.js (`@langchain/openai`, `@langchain/google-genai`, `@langchain/ollama`) |
| Embeddings | `@xenova/transformers` — runs locally, no API key needed |
| Vector store | HNSWLib (`hnswlib-node`) — persisted to `data/hnswlib_index/` |
| PDF parsing | `pdf-parse` |
| URL scraping | `@langchain/community` CheerioWebBaseLoader |
| Database | SQLite via `better-sqlite3` — same `data/sessions.db` file |
| Web search | SerpAPI (same key as before) |

---

## Directory structure

```
server/
├── index.js              # Entry point — starts Express server
├── config.js             # Reads env vars (PORT, keys, etc.)
├── database.js           # SQLite session CRUD (better-sqlite3)
├── routes/
│   ├── chat.js           # POST /api/chat  (SSE streaming)
│   ├── sessions.js       # CRUD /api/sessions
│   └── documents.js      # POST /api/documents/upload|url|text, DELETE /api/documents
└── ai/
    ├── providers/
    │   ├── index.js      # Provider registry
    │   ├── openai.js     # GPT-4o, GPT-3.5
    │   ├── gemini.js     # Gemini 2.0/2.5
    │   └── llama.js      # Ollama (local)
    └── rag/
        ├── vectorstore.js # HNSWLib store — add, search, reset, persist
        ├── loaders.js     # PDF / text / URL → chunks
        ├── webSearch.js   # SerpAPI Google search + news routing
        └── pipeline.js    # Agentic RAG: docs + web → streaming LLM response
```

---

## Setup & run

```bash
# 1. Copy env file (already exists at project root)
cp ../.env .env          # or set env vars directly

# 2. Install dependencies (one time)
cd server
npm install --legacy-peer-deps

# 3. Start server
npm start                # production
npm run dev              # development (auto-restart on file change)
```

Server runs on `http://localhost:8000` by default.

> **First run:** the embeddings model (`all-MiniLM-L6-v2`) downloads automatically (~25 MB).
> Subsequent starts load it from cache.

---

## Environment variables (same `.env` as before)

```
OPENAI_API_KEY=...
GOOGLE_API_KEY=...
SERPAPI_KEY=...
OLLAMA_BASE_URL=http://localhost:11434
PORT=8000
```

---

## API endpoints (identical to the old Python backend)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/chat` | Send message, streams SSE tokens |
| `GET` | `/api/chat/providers` | List providers + availability |
| `GET` | `/api/chat/status` | Knowledge base + provider status |
| `POST` | `/api/sessions` | Create session |
| `GET` | `/api/sessions/:id` | Get session |
| `PATCH` | `/api/sessions/:id` | Update provider/model |
| `DELETE` | `/api/sessions/:id` | Clear session |
| `POST` | `/api/documents/upload` | Upload PDF/TXT/MD/CSV |
| `POST` | `/api/documents/url` | Ingest a URL |
| `POST` | `/api/documents/text` | Ingest plain text |
| `DELETE` | `/api/documents` | Clear knowledge base |
| `GET` | `/health` | Health check |

---

## How RAG works (pipeline.js)

1. **Similarity search** — query the HNSWLib vector store for relevant document chunks
2. **Web search decision** — skip for greetings, math, code; search for everything else
3. **System prompt selection** — docs only / web only / both / general (based on what's available)
4. **Stream response** — LangChain `llm.stream(messages)` → SSE tokens to browser
5. **Sources** — emitted as a final `__SOURCES__:url1,url2` token

---

## Key differences from Python version

| | Python | Node.js |
|---|---|---|
| Vector store | FAISS (`data/faiss_index/`) | HNSWLib (`data/hnswlib_index/`) |
| Embeddings | HuggingFace via Python | `@xenova/transformers` (WASM) |
| Async | `asyncio` / `async def` | Native `async/await` + `for await` |
| File upload | FastAPI `UploadFile` | Multer (memory storage) |

> Existing FAISS index files are NOT compatible — re-upload your documents after switching.
