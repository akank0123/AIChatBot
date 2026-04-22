import json
import uuid

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from backend.config import MODEL_DEFAULTS
from backend.database import append_turn, get_or_create_session, update_session
from backend.models.chat import ChatRequest
from backend.services.sse import sse_with_keepalive
from ai.providers import PROVIDERS, get_provider
from ai.rag import pipeline

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("")
async def chat(body: ChatRequest):
    if not body.question or not body.question.strip():
        raise HTTPException(400, "question is required")

    session_id = body.session_id or str(uuid.uuid4())
    session = get_or_create_session(session_id)

    chosen_provider = body.provider or session.get("provider") or "gemini"
    chosen_model = (
        body.model
        if body.model is not None
        else (session.get("model") or MODEL_DEFAULTS.get(chosen_provider))
    )

    update_session(session_id, provider=chosen_provider, model=chosen_model)

    provider = get_provider(chosen_provider)
    if not provider.is_available():
        raise HTTPException(503, f"Provider '{chosen_provider}' is not available")

    history = session.get("history", [])

    async def event_gen():
        yield f"event: session\ndata: {json.dumps({'session_id': session_id})}\n\n"

        full_response = ""
        had_error = False
        try:
            async for token in pipeline.query_stream(
                question=body.question,
                provider=provider,
                history=history,
                model=chosen_model,
                temperature=body.temperature,
            ):
                if token.startswith("__SOURCES__:"):
                    sources = [s for s in token.replace("__SOURCES__:", "").split(",") if s]
                    yield f"event: sources\ndata: {json.dumps({'sources': sources})}\n\n"
                else:
                    full_response += token
                    yield f"event: token\ndata: {json.dumps({'token': token})}\n\n"
        except Exception as e:
            had_error = True
            yield f"event: error\ndata: {json.dumps({'message': str(e)})}\n\n"

        if full_response and not had_error:
            append_turn(session_id, body.question, full_response)

        yield f"event: done\ndata: [DONE]\n\n"

    return StreamingResponse(
        sse_with_keepalive(event_gen()),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "X-Session-Id": session_id,
        },
    )


@router.get("/providers")
async def providers():
    return {
        name: {"available": cls().is_available(), "models": cls().models}
        for name, cls in PROVIDERS.items()
    }


@router.get("/status")
async def status():
    provider_status = {name: cls().is_available() for name, cls in PROVIDERS.items()}
    return {
        "has_kb": pipeline.has_knowledge_base(),
        "provider_status": provider_status,
        "available_providers": [n for n, ok in provider_status.items() if ok],
    }
