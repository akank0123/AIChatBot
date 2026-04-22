"""Document loaders for PDF, plain text, and live websites."""
import os
import tempfile
from typing import List

from langchain_core.documents import Document
from langchain_community.document_loaders import PyPDFLoader, WebBaseLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter


SPLITTER = RecursiveCharacterTextSplitter(
    chunk_size=600,
    chunk_overlap=100,
    separators=["\n\n", "\n", ". ", " ", ""],
)


def load_pdf(file_bytes: bytes, filename: str) -> List[Document]:
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name
    try:
        loader = PyPDFLoader(tmp_path)
        docs = loader.load()
        for doc in docs:
            doc.metadata["source"] = filename
            doc.metadata["type"] = "pdf"
        return SPLITTER.split_documents(docs)
    finally:
        os.unlink(tmp_path)


def load_text(file_bytes: bytes, filename: str) -> List[Document]:
    content = file_bytes.decode("utf-8", errors="replace")
    doc = Document(
        page_content=content,
        metadata={"source": filename, "type": "text"},
    )
    return SPLITTER.split_documents([doc])


def load_url(url: str) -> List[Document]:
    loader = WebBaseLoader(web_paths=[url])
    docs = loader.load()
    for doc in docs:
        doc.metadata["source"] = url
        doc.metadata["type"] = "web"
    return SPLITTER.split_documents(docs)
