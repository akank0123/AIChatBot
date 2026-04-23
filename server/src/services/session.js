import Session from '../models/Session.js';

function toPlain(doc) {
  return {
    id:        doc.sessionId,
    provider:  doc.provider,
    model:     doc.model,
    history:   doc.history || [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function createSession(sessionId) {
  const session = await Session.create({ sessionId, history: [] });
  return toPlain(session);
}

export async function getSession(sessionId) {
  const session = await Session.findOne({ sessionId });
  return session ? toPlain(session) : null;
}

export async function getOrCreateSession(sessionId) {
  let session = await Session.findOne({ sessionId });
  if (!session) {
    session = await Session.create({ sessionId, history: [] });
  }
  return toPlain(session);
}

export async function updateSession(sessionId, fields) {
  const update = {};
  if (fields.provider !== undefined) update.provider = fields.provider;
  if (fields.model !== undefined) update.model = fields.model;
  if (Object.keys(update).length) {
    await Session.findOneAndUpdate({ sessionId }, update);
  }
}

export async function appendTurn(sessionId, human, ai) {
  await Session.findOneAndUpdate(
    { sessionId },
    { $push: { history: { human, ai } } }
  );
}

export async function deleteSession(sessionId) {
  await Session.deleteOne({ sessionId });
}
