"""SQLite-backed session store. Sessions persist across server restarts."""
import json
import os
import sqlite3
import threading
from typing import Optional

_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "sessions.db")
_lock = threading.Lock()

MAX_TURNS = 20


def _conn():
    return sqlite3.connect(_DB_PATH, check_same_thread=False)


def init_db() -> None:
    os.makedirs(os.path.dirname(_DB_PATH), exist_ok=True)
    with _lock:
        c = _conn()
        c.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id         TEXT PRIMARY KEY,
                provider   TEXT DEFAULT 'gemini',
                model      TEXT,
                messages   TEXT DEFAULT '[]',
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        """)
        c.commit()
        c.close()


# ── Internal helpers ──────────────────────────────────────────────────────────

def _row_to_dict(row: tuple) -> dict:
    id_, provider, model, messages_json, created_at, updated_at = row
    messages = json.loads(messages_json or "[]")
    return {
        "id":        id_,
        "session_id": id_,
        "provider":  provider,
        "model":     model,
        "history":   messages,
        "turns":     len(messages),
        "createdAt": created_at,
        "updatedAt": updated_at,
    }


# ── Public API ────────────────────────────────────────────────────────────────

def create_session(session_id: str, provider: str = "gemini", model: Optional[str] = None) -> dict:
    with _lock:
        c = _conn()
        c.execute(
            "INSERT OR IGNORE INTO sessions (id, provider, model) VALUES (?, ?, ?)",
            (session_id, provider, model),
        )
        c.commit()
        row = c.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()
        c.close()
    return _row_to_dict(row)


def get_session(session_id: str) -> Optional[dict]:
    with _lock:
        c = _conn()
        row = c.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()
        c.close()
    return _row_to_dict(row) if row else None


def get_or_create_session(session_id: str) -> dict:
    return get_session(session_id) or create_session(session_id)


def update_session(session_id: str, provider: Optional[str] = None, model: Optional[str] = None) -> None:
    parts, vals = [], []
    if provider:
        parts.append("provider = ?")
        vals.append(provider)
    if model is not None:
        parts.append("model = ?")
        vals.append(model)
    if not parts:
        return
    parts.append("updated_at = datetime('now')")
    vals.append(session_id)
    with _lock:
        c = _conn()
        c.execute(f"UPDATE sessions SET {', '.join(parts)} WHERE id = ?", vals)
        c.commit()
        c.close()


def append_turn(session_id: str, human: str, ai: str) -> None:
    with _lock:
        c = _conn()
        row = c.execute("SELECT messages FROM sessions WHERE id = ?", (session_id,)).fetchone()
        if row:
            messages = json.loads(row[0] or "[]")
            messages.append({"human": human, "ai": ai})
            c.execute(
                "UPDATE sessions SET messages = ?, updated_at = datetime('now') WHERE id = ?",
                (json.dumps(messages[-MAX_TURNS:]), session_id),
            )
            c.commit()
        c.close()


def delete_session(session_id: str) -> None:
    with _lock:
        c = _conn()
        c.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        c.commit()
        c.close()
