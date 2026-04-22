import uuid

from fastapi import APIRouter, HTTPException

from backend.database import (
    create_session,
    delete_session,
    get_or_create_session,
    get_session,
    update_session,
)
from backend.models.session import SessionUpdateRequest

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("", status_code=201)
async def create():
    sid = str(uuid.uuid4())
    return create_session(sid)


@router.get("/{session_id}")
async def get(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    return session


@router.patch("/{session_id}")
async def update(session_id: str, body: SessionUpdateRequest):
    get_or_create_session(session_id)
    update_session(session_id, provider=body.provider, model=body.model)
    return get_session(session_id)


@router.delete("/{session_id}")
async def delete(session_id: str):
    delete_session(session_id)
    return {"message": f"Session {session_id} cleared"}
