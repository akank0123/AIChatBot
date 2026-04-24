## What This Project Does

A chatbot where you upload your own documents (PDF, URL, or text), and then ask questions about them. The bot answers using only your documents as the source of truth, not just its general training knowledge. It supports three different AI models and streams answers word-by-word like ChatGPT.

---

## Core Concepts

### RAG — Retrieval-Augmented Generation

**What it is:** A technique where, before answering a question, the system first searches your uploaded documents for relevant passages, then hands those passages to the AI along with the question.

**Why we use it:** Without RAG, the AI would answer from its general training data and could hallucinate. With RAG, the AI answers specifically from your documents, making responses accurate and grounded in your content.

**How it works in this project:**
1. You upload a document → it gets split into small chunks and stored as vectors
2. You ask a question → the system searches for the most relevant chunks
3. Those chunks + your question are sent to the AI together
4. The AI answers based on what it found in your documents

---

### Vector Store (HNSWLib)

**What it is:** A special database that stores text as mathematical numbers (vectors/embeddings) and can find semantically similar text very fast.

**Why we use it:** Normal databases search by exact keywords. A vector store understands meaning — so searching "car price" can match a chunk that says "vehicle cost" even though the words are different.

**In this project:** Uploaded document chunks are converted to vectors and saved here. When you ask a question, the question is also converted to a vector and the store returns the most similar document chunks.

**How the integration works:**

```
Document uploaded
      ↓
Split into chunks  →  Convert each chunk to 384-number vector (all-MiniLM-L6-v2 model)
      ↓
Store vectors in HNSWLib  →  one Map entry per sessionId  →  sessions stay isolated

User asks a question
      ↓
Convert question to vector  →  similaritySearch(question, k=6, threshold=1.70, sessionId)
      ↓
Return top 6 chunks with score ≤ 1.70  →  anything above 1.70 is ignored (not relevant)
      ↓
Pass chunks to AI as context

Session deleted
      ↓
stores.delete(sessionId)  →  that session's vector data is removed from memory
```

| Key Point | Detail |
|---|---|
| Storage | In-memory — data lives in RAM, lost if server restarts |
| Per-session isolation | `const stores = new Map()` — each session gets its own HNSWLib instance |
| Embedding model | `Xenova/all-MiniLM-L6-v2` — runs locally, no API key needed |
| Results | Top 6 chunks, score must be ≤ 1.70 to be considered relevant |
| Threshold 1.70 | Lower score = more similar. Above 1.70 = too different = ignored |
| Limitation | Vectors lost on server restart — Pinecone (cloud) would solve this |

---

### Embeddings

**What it is:** The process of converting text into a list of numbers that represent its meaning. Similar text produces similar numbers.

**Why we use it:** Needed to power the vector store. You cannot do semantic search without first converting text to embeddings.

**In this project:** We use sentence-transformers (HuggingFace) to generate embeddings for both the uploaded documents and each incoming question.

---

### LangChain

**What it is:** A JavaScript/Python framework that provides ready-made building blocks for AI applications — connecting LLMs, vector stores, document loaders, and prompt templates.

**Why we use it:** Instead of writing low-level code to talk to OpenAI, split PDFs, manage vector stores, and build prompts manually, LangChain gives us pre-built components that work together.

**In this project:** We use LangChain to load and split documents, manage the HNSWLib vector store, connect to OpenAI/Gemini/Llama, and run the RAG pipeline.

---

### SSE — Server-Sent Events

**What it is:** A way for the server to push data to the browser continuously over a single HTTP connection, word by word or chunk by chunk.

**Why we use it:** LLMs generate text token by token. Without SSE, the user would stare at a blank screen until the full answer was ready (could be 5–10 seconds). With SSE, each word appears as soon as it is generated — just like ChatGPT.

**In this project:** When you send a chat message, the backend opens an SSE stream and sends each word of the AI's response to the frontend as it arrives. React renders them live.

---

### SerpAPI

**What it is:** A service that runs Google searches programmatically and returns the results as structured data.

**Why we use it:** If you ask a question and there are no relevant documents in the knowledge base, the bot can fall back to a live web search to find an answer instead of saying "I don't know."

**In this project:** When the vector store returns no good results, the RAG pipeline calls SerpAPI, fetches the top web results, and passes them to the AI as context instead.

---

### MongoDB

**What it is:** A NoSQL database that stores data as flexible JSON-like documents.

**Why we use it:** Sessions and chat history have a variable structure (different numbers of messages, different providers). MongoDB handles this better than rigid SQL tables.

**In this project:** Every conversation session and its full message history is stored in MongoDB. This lets you come back to old sessions and continue where you left off.

---

### Express (Node.js)

**What it is:** A lightweight web framework for Node.js that handles HTTP routing, middleware, and request/response logic.

**Why we use it:** It is the backbone of our backend — it receives API calls from the frontend, routes them to the right controller, and sends back responses.

**In this project:** All API endpoints (chat, sessions, documents) are Express routes. It also handles file uploads (via Multer) and CORS.

---

### Multer

**What it is:** An Express middleware for handling file uploads.

**Why we use it:** When a user uploads a PDF, the browser sends it as multipart form data. Multer intercepts this, saves the file temporarily, and makes it available for processing.

**In this project:** Used in the documents route to receive uploaded PDF/TXT files before passing them to the RAG loader.

---

### Ollama / Llama

**What it is:** Ollama is a tool that lets you run open-source LLMs (like Meta's Llama) locally on your own machine.

**Why we use it:** Some users cannot or do not want to send data to OpenAI or Google. Ollama lets the entire AI pipeline run offline with no API keys and no data leaving the machine.

**In this project:** A third LLM option alongside OpenAI and Gemini. No API key needed — just Ollama running locally.

---

### Vite + React

**What it is:** Vite is a fast frontend build tool. React is a JavaScript library for building interactive UIs.

**Why we use it:** React makes it easy to build a dynamic chat UI where messages update in real time. Vite gives fast hot-reload during development and optimised production builds.

**In this project:** The entire frontend — sidebar, chat window, message streaming, file uploader, and provider selector — is built in React and served by Vite.

---

## How a Single Chat Message Flows Through the System

```
[1] You type a message & press send
        useChat.js → sendMessage()

[2] Frontend opens SSE stream to backend
        chatApi.js → streamChat()

[3] Express routes the request
        routes/chat.js → POST /api/chat

[4] Chat controller takes over
        controllers/chat.js → sendChat()

[5] Load session + chat history from MongoDB
        services/session.js → getOrCreateSession()

[6] Convert question into a vector (embedding)
        vectorstore.js → similaritySearch() → getEmbeddings()

[7] Search uploaded document chunks for this session
        vectorstore.js → similaritySearch(question, 6, 1.70, sessionId)

[8] No relevant chunks? Check if web search is needed
        webSearch.js → needsWebSearch(question)

[9] If yes → run live Google search via SerpAPI
        webSearch.js → search(query, 3) → searchWeb() or searchNews()

[10] Build the final prompt
         pipeline.js → queryStream() → buildMessages()
         ( chunks or web results + last 10 messages + question )

[11] Send prompt to the chosen AI — tokens start coming back
         pipeline.js → queryStream() → provider.getLlm()

[12] Push each token to browser over SSE immediately
         controllers/chat.js → sendChat() → send('token', token)

[13] Frontend reads each token from the stream
         chatApi.js → streamChat() → reader.read() → onToken()

[14] React appends each token — you see words appear live
         useChat.js → useChat() → setMessages()

[15] Stream ends → save full Q&A to MongoDB
         controllers/chat.js → sendChat() → appendTurn()

[16] Store message pair in session history
         services/session.js → appendTurn(sessionId, human, ai)
```
