"""FAISS vector store — persisted to disk so uploads survive restarts."""
import os
import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", category=FutureWarning)
from typing import List, Optional

from langchain_core.documents import Document
from langchain_core.vectorstores import VectorStore
from langchain_community.embeddings import HuggingFaceEmbeddings
import faiss  # noqa: F401
from langchain_community.vectorstores import FAISS, Chroma

FAISS_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "faiss_index")

_STORE: Optional[VectorStore] = None
_EMBEDDINGS = None


def _get_embeddings():
    global _EMBEDDINGS
    if _EMBEDDINGS is None:
        _EMBEDDINGS = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"},
        )
    return _EMBEDDINGS


def _save():
    if isinstance(_STORE, FAISS):
        os.makedirs(FAISS_PATH, exist_ok=True)
        _STORE.save_local(FAISS_PATH)


def _load() -> Optional[FAISS]:
    index_file = os.path.join(FAISS_PATH, "index.faiss")
    if os.path.exists(index_file):
        try:
            return FAISS.load_local(
                FAISS_PATH,
                _get_embeddings(),
                allow_dangerous_deserialization=True,
            )
        except Exception:
            return None
    return None


def get_store() -> Optional[VectorStore]:
    return _STORE


def load_persisted():
    """Called on startup — restores previously uploaded documents."""
    global _STORE
    store = _load()
    if store:
        _STORE = store


def add_documents(docs: List[Document]) -> int:
    global _STORE
    embeddings = _get_embeddings()
    backend = os.getenv("VECTOR_STORE", "faiss").lower()

    if backend == "chroma":
        if _STORE is None:
            _STORE = Chroma.from_documents(docs, embeddings, collection_name="rag_kb")
        else:
            _STORE.add_documents(docs)
    else:
        if _STORE is None:
            _STORE = FAISS.from_documents(docs, embeddings)
        else:
            _STORE.add_documents(docs)
        _save()

    return len(docs)


def similarity_search(query: str, k: int = 6, threshold: float = 1.75) -> List[Document]:
    """Return only chunks that are actually relevant to the query.
    FAISS L2 distance: lower = more similar. Scores typically range 0.5–2.0.
    threshold=1.75 keeps relevant matches and filters out truly unrelated questions.
    """
    if _STORE is None:
        return []
    results = _STORE.similarity_search_with_score(query, k=k)
    return [doc for doc, score in results if score <= threshold]


def reset_store():
    global _STORE
    _STORE = None
    # Remove persisted index
    index_file = os.path.join(FAISS_PATH, "index.faiss")
    if os.path.exists(index_file):
        import shutil
        shutil.rmtree(FAISS_PATH, ignore_errors=True)
