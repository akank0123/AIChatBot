# AK AI ChatBot

A full-stack RAG chatbot that answers questions from uploaded documents, web pages, or pasted text — with live web search fallback when no relevant context is found.

**Stack: Node.js/Express + LangChain.js + React + MongoDB**

---

## Features

- Upload PDF, TXT, MD, or CSV files; paste raw text; or provide a URL
- Agentic routing — uses document context, live web search, or general LLM
- Multi-provider LLM — OpenAI, Google Gemini, or Ollama (local/offline)
- Streaming responses via Server-Sent Events
- Chat history persisted in MongoDB

---

## Setup

### 1. Configure environment

Copy `.env.example` to `.env` inside the server folder and fill in your keys. At least one LLM provider (OpenAI, Gemini, or Ollama) and a MongoDB URI are required.

### 2. Run with Docker Compose

```bash
docker compose up --build
```

Backend: `http://localhost:8000` · Frontend: `http://localhost:5173`

### 3. Run locally

**Backend:**
```bash
npm install --legacy-peer-deps
npm start          # production
npm run dev        # development (auto-restart)
```

**Frontend:**
```bash
npm install
npm run dev
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | one of three | OpenAI (GPT-4o, GPT-3.5) |
| `GOOGLE_API_KEY` | one of three | Google Gemini |
| `OLLAMA_BASE_URL` | one of three | Ollama local URL (default: `http://localhost:11434`) |
| `MONGODB_URI` | required | MongoDB connection string |
| `SERPAPI_KEY` | optional | SerpAPI for live web search |
| `ALLOWED_ORIGINS` | optional | Comma-separated CORS origins (default: `http://localhost:5173`) |
| `PORT` | optional | Server port (default: `8000`) |
| `MAX_FILE_SIZE_MB` | optional | Upload limit (default: `50 MB`) |
