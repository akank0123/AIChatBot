from fastapi import APIRouter, File, HTTPException, UploadFile

from backend.config import MAX_FILE_SIZE_MB
from backend.models.document import IngestTextRequest, IngestURLRequest
from ai.rag import loaders
from ai.rag import vectorstore as vs

router = APIRouter(prefix="/api/documents", tags=["documents"])

_ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md", ".csv"}


@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    filename = file.filename or "upload"
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext not in _ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type '{ext}'. Allowed: {', '.join(_ALLOWED_EXTENSIONS)}")

    content = await file.read()

    if len(content) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(413, f"File exceeds {MAX_FILE_SIZE_MB} MB limit")

    docs = loaders.load_pdf(content, filename) if ext == ".pdf" else loaders.load_text(content, filename)
    count = vs.add_documents(docs)
    return {"message": f"Ingested {count} chunks from '{filename}'", "chunks": count}


@router.post("/url")
async def ingest_url(body: IngestURLRequest):
    try:
        docs = loaders.load_url(body.url)
    except Exception as e:
        raise HTTPException(400, f"Failed to load URL: {e}")
    count = vs.add_documents(docs)
    return {"message": f"Ingested {count} chunks from '{body.url}'", "chunks": count}


@router.post("/text")
async def ingest_text(body: IngestTextRequest):
    if not body.text:
        raise HTTPException(400, "text is required")
    docs = loaders.load_text(body.text.encode(), body.source)
    count = vs.add_documents(docs)
    return {"message": f"Ingested {count} chunks", "chunks": count}


@router.delete("")
async def clear():
    vs.reset_store()
    return {"message": "Knowledge base cleared"}
