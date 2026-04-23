import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH   = join(__dirname, '..', 'data', 'sessions.db');
const MAX_TURNS = 20;

let db;

export function initDb() {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id         TEXT PRIMARY KEY,
      provider   TEXT DEFAULT 'gemini',
      model      TEXT,
      messages   TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
}

function rowToDict(row) {
  if (!row) return null;
  const messages = JSON.parse(row.messages || '[]');
  return {
    id:         row.id,
    session_id: row.id,
    provider:   row.provider,
    model:      row.model,
    history:    messages,
    turns:      messages.length,
    createdAt:  row.created_at,
    updatedAt:  row.updated_at,
  };
}

export function createSession(sessionId, provider = 'gemini', model = null) {
  db.prepare('INSERT OR IGNORE INTO sessions (id, provider, model) VALUES (?, ?, ?)').run(sessionId, provider, model);
  return rowToDict(db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId));
}

export function getSession(sessionId) {
  return rowToDict(db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId));
}

export function getOrCreateSession(sessionId) {
  return getSession(sessionId) || createSession(sessionId);
}

export function updateSession(sessionId, { provider, model } = {}) {
  const parts = [];
  const vals  = [];
  if (provider) { parts.push('provider = ?'); vals.push(provider); }
  if (model !== undefined && model !== null) { parts.push('model = ?'); vals.push(model); }
  if (!parts.length) return;
  parts.push("updated_at = datetime('now')");
  vals.push(sessionId);
  db.prepare(`UPDATE sessions SET ${parts.join(', ')} WHERE id = ?`).run(...vals);
}

export function appendTurn(sessionId, human, ai) {
  const row = db.prepare('SELECT messages FROM sessions WHERE id = ?').get(sessionId);
  if (!row) return;
  const messages = JSON.parse(row.messages || '[]');
  messages.push({ human, ai });
  db.prepare("UPDATE sessions SET messages = ?, updated_at = datetime('now') WHERE id = ?")
    .run(JSON.stringify(messages.slice(-MAX_TURNS)), sessionId);
}

export function deleteSession(sessionId) {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}
