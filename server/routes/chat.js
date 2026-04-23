import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { MODEL_DEFAULTS } from '../config.js';
import { getOrCreateSession, updateSession, appendTurn } from '../database.js';
import { PROVIDERS, getProvider } from '../ai/providers/index.js';
import { queryStream, hasKnowledgeBase } from '../ai/rag/pipeline.js';

const router = Router();

router.post('/api/chat', async (req, res) => {
  const { question, session_id, provider: reqProvider, model: reqModel, temperature = 0.3 } = req.body;

  if (!question?.trim()) {
    return res.status(400).json({ detail: 'question is required' });
  }

  const sessionId = session_id || uuidv4();
  const session   = getOrCreateSession(sessionId);

  const chosenProvider = reqProvider || session.provider || 'gemini';
  const chosenModel    = reqModel !== undefined ? reqModel : (session.model || MODEL_DEFAULTS[chosenProvider]);

  updateSession(sessionId, { provider: chosenProvider, model: chosenModel });

  const provider = getProvider(chosenProvider);
  if (!provider.isAvailable()) {
    return res.status(503).json({ detail: `Provider '${chosenProvider}' is not available` });
  }

  const history = session.history || [];

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('X-Session-Id', sessionId);
  res.flushHeaders();

  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  send('session', { session_id: sessionId });

  let fullResponse = '';
  let hadError     = false;

  try {
    for await (const token of queryStream(question, provider, history, chosenModel, temperature)) {
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
  }

  if (fullResponse && !hadError) appendTurn(sessionId, question, fullResponse);

  res.write(`event: done\ndata: [DONE]\n\n`);
  res.end();
});

router.get('/api/chat/providers', async (req, res) => {
  const result = {};
  for (const [name, Provider] of Object.entries(PROVIDERS)) {
    const p = new Provider();
    result[name] = { available: await p.isAvailable(), models: p.models };
  }
  res.json(result);
});

router.get('/api/chat/status', async (req, res) => {
  const providerStatus = {};
  for (const [name, Provider] of Object.entries(PROVIDERS)) {
    providerStatus[name] = await new Provider().isAvailable();
  }
  res.json({
    has_kb:             hasKnowledgeBase(),
    provider_status:    providerStatus,
    available_providers: Object.entries(providerStatus).filter(([, ok]) => ok).map(([n]) => n),
  });
});

export default router;
