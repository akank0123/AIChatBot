import { v4 as uuidv4 } from 'uuid';
import * as sessionService from '../services/session.js';

export async function createSession(_req, res) {
  const session = await sessionService.createSession(uuidv4());
  res.status(201).json(session);
}

export async function getSession(req, res) {
  const session = await sessionService.getSession(req.params.sessionId);
  if (!session) return res.status(404).json({ detail: 'Session not found' });
  res.json(session);
}

export async function patchSession(req, res) {
  const { sessionId } = req.params;
  await sessionService.getOrCreateSession(sessionId);
  await sessionService.updateSession(sessionId, { provider: req.body.provider, model: req.body.model });
  res.json(await sessionService.getSession(sessionId));
}

export async function deleteSession(req, res) {
  await sessionService.deleteSession(req.params.sessionId);
  res.json({ message: `Session ${req.params.sessionId} cleared` });
}
