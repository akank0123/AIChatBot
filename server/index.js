import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { HOST, PORT, ALLOWED_ORIGINS } from './config.js';
import { initDb } from './database.js';
import { loadPersisted } from './ai/rag/vectorstore.js';
import chatRouter from './routes/chat.js';
import sessionsRouter from './routes/sessions.js';
import documentsRouter from './routes/documents.js';

const app = express();

app.use(cors({ origin: ALLOWED_ORIGINS, exposedHeaders: ['X-Session-Id'] }));
app.use(express.json());

app.use(chatRouter);
app.use(sessionsRouter);
app.use(documentsRouter);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

async function start() {
  initDb();
  await loadPersisted();
  app.listen(PORT, HOST, () => console.log(`RAG Chatbot server running at http://${HOST}:${PORT}`));
}

start().catch(console.error);
