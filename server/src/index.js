import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { HOST, PORT, ALLOWED_ORIGINS } from './config/index.js';
import connectDB from './config/database.js';
import { loadPersisted } from './ai/rag/vectorstore.js';
import chatRouter from './routes/chat.js';
import sessionsRouter from './routes/sessions.js';
import documentsRouter from './routes/documents.js';
import notFound from './middlewares/notFound.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

app.use(cors({ origin: ALLOWED_ORIGINS, exposedHeaders: ['X-Session-Id'] }));
app.use(express.json());

app.use(chatRouter);
app.use(sessionsRouter);
app.use(documentsRouter);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

// 404 + error handling — must be last
app.use(notFound);
app.use(errorHandler);

async function start() {
  await connectDB();
  await loadPersisted();
  app.listen(PORT, HOST, () => console.log(`RAG Chatbot server running at http://${HOST}:${PORT}`));
}

start().catch(console.error);
