import { v4 as uuidv4 } from 'uuid';
import { MODEL_DEFAULTS } from '../config/index.js';
import { getOrCreateSession, updateSession, appendTurn } from '../services/session.js';
import { PROVIDERS, getProvider } from '../ai/providers/index.js';
import { queryStream, hasKnowledgeBase } from '../ai/rag/pipeline.js';

export async function sendChat(req, res) {
  const { question, session_id, provider: reqProvider, model: reqModel, temperature = 0.3 } = req.body;

  if (!question?.trim()) {
    return res.status(400).json({ detail: 'question is required' });
  }

  const sessionId = session_id || uuidv4();
  const session   = await getOrCreateSession(sessionId);

  const chosenProvider = reqProvider || session.provider || 'gemini';
  const chosenModel    = reqModel !== undefined ? reqModel : (session.model || MODEL_DEFAULTS[chosenProvider]);

  await updateSession(sessionId, { provider: chosenProvider, model: chosenModel });

  const provider = getProvider(chosenProvider);
  if (!provider.isAvailable()) {
    return res.status(503).json({ detail: `Provider '${chosenProvider}' is not available` });
  }

  const history = session.history || [];

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('X-Session-Id', sessionId);
  res.flushHeaders();

  const send = (event, data) => {
    if (!res.writableEnded) {
      try { res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); } catch {}
    }
  };

  // Keep the chunked connection alive while embeddings / LLM are initialising.
  const heartbeat = setInterval(() => {
    if (res.writableEnded) { clearInterval(heartbeat); return; }
    try { res.write(': heartbeat\n\n'); } catch { clearInterval(heartbeat); }
  }, 15000);
  req.on('close', () => clearInterval(heartbeat));

  send('session', { session_id: sessionId });

  let fullResponse = '';
  let hadError     = false;

  try {
    for await (const token of queryStream(question, provider, history, chosenModel, temperature)) {
      if (res.writableEnded) break;
      if (token.startsWith('__SOURCES__:')) {
        const sources = token.replace('__SOURCES__:', '').split(',').filter(Boolean);
        send('sources', { sources });
      } else {
        fullResponse += token;
        send('token', { token });
      }
    }
  } catch (e) {
    hadError = true;
    send('error', { message: String(e.message || e) });
  } finally {
    clearInterval(heartbeat);
  }

  try {
    if (fullResponse && !hadError) await appendTurn(sessionId, question, fullResponse);
  } catch (e) {
    console.error('[chat] appendTurn error:', e.message || e);
  }

  if (!res.writableEnded) {
    try {
      res.write('event: done\ndata: [DONE]\n\n');
      res.end();
    } catch {}
  }
}

export async function getProviders(_req, res) {
  const result = {};
  for (const [name, Provider] of Object.entries(PROVIDERS)) {
    const p = new Provider();
    result[name] = { available: await p.isAvailable(), models: p.models };
  }
  res.json(result);
}

export async function getStatus(_req, res) {
  const providerStatus = {};
  for (const [name, Provider] of Object.entries(PROVIDERS)) {
    providerStatus[name] = await new Provider().isAvailable();
  }
  res.json({
    has_kb:              hasKnowledgeBase(),
    provider_status:     providerStatus,
    available_providers: Object.entries(providerStatus).filter(([, ok]) => ok).map(([n]) => n),
  });
}
