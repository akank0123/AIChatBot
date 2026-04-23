import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createSession, getSession, getOrCreateSession, updateSession, deleteSession } from '../database.js';

const router = Router();

router.post('/api/sessions', (req, res) => {
  const sid = uuidv4();
  res.status(201).json(createSession(sid));
});

router.get('/api/sessions/:sessionId', (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session) return res.status(404).json({ detail: 'Session not found' });
  res.json(session);
});

router.patch('/api/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  getOrCreateSession(sessionId);
  updateSession(sessionId, { provider: req.body.provider, model: req.body.model });
  res.json(getSession(sessionId));
});

router.delete('/api/sessions/:sessionId', (req, res) => {
  deleteSession(req.params.sessionId);
  res.json({ message: `Session ${req.params.sessionId} cleared` });
});

export default router;
