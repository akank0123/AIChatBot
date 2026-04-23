# Node.js Backend — Quick Reference

Express/LangChain.js backend following MVC structure. Uses MongoDB for session persistence and HNSWLib for vector storage.

---

## Stack

| Layer | Technology |
|---|---|
| Web framework | Express 4 |
| AI / LLM | LangChain.js (`@langchain/openai`, `@langchain/google-genai`, `@langchain/ollama`) |
| Embeddings | `@huggingface/transformers` — runs locally, no API key needed |
| Vector store | HNSWLib (`hnswlib-node`) — persisted to disk |
| PDF parsing | `pdf-parse` |
| URL scraping | `@langchain/community` CheerioWebBaseLoader |
| Database | MongoDB via Mongoose — session & chat history |
| Web search | SerpAPI |

---

## Directory Structure

```
server/
└── src/
    ├── index.js              # Entry point — Express app + startup
    ├── config/
    │   ├── index.js          # Reads env vars (PORT, keys, etc.)
    │   └── database.js       # MongoDB connection (Mongoose)
    ├── models/
    │   └── Session.js        # Mongoose session schema
    ├── routes/
    │   ├── chat.js           # POST /api/chat (SSE streaming)
    │   ├── sessions.js       # CRUD /api/sessions
    │   └── documents.js      # Upload / URL / text / delete
    ├── controllers/
    │   ├── chat.js
    │   ├── session.js
    │   └── documents.js
    ├── services/
    │   └── session.js        # Session business logic
    ├── middlewares/
    │   ├── errorHandler.js
    │   └── notFound.js
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

## Setup & Run

```bash
# 1. Copy env file
cp .env.example .env

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Start server
npm start        # production
npm run dev      # development (auto-restart on file change)
```

Server runs on `http://localhost:8000` by default.

> **First run:** the embeddings model (`all-MiniLM-L6-v2`) downloads automatically (~25 MB). Subsequent starts load it from cache.

---

## Environment Variables

```
OPENAI_API_KEY=...
GOOGLE_API_KEY=...
SERPAPI_KEY=...
OLLAMA_BASE_URL=http://localhost:11434
MONGODB_URI=mongodb://root:Pa55WWord@localhost:27017/ChatBot?authSource=admin
ALLOWED_ORIGINS=http://localhost:5173
PORT=8000
HOST=0.0.0.0
MAX_FILE_SIZE_MB=50
```

---

## API Endpoints

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

## How RAG Works

1. **Similarity search** — query HNSWLib vector store for relevant document chunks
2. **Web search decision** — skip for greetings/math/code; search for everything else
3. **System prompt selection** — docs / web / both / general based on available context
4. **Stream response** — LangChain `llm.stream(messages)` → SSE tokens to browser
5. **Sources** — emitted as a final `__SOURCES__:url1,url2` token
