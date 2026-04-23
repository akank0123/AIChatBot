"""Agentic RAG pipeline — docs + live web search + streaming."""
from __future__ import annotations

from datetime import datetime
from typing import AsyncIterator, List, Dict, Any, Optional

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from . import vectorstore as vs
from .web_search import needs_web_search, search, format_results

# ── System prompts ────────────────────────────────────────────────────────────

_FORMAT_RULES = """
FORMATTING RULES (always follow):
- NEVER write a long paragraph. Always break into sections.
- Use **bold** for key terms, names, numbers.
- Use bullet points (- item) for lists of facts.
- Use numbered lists (1. item) for steps or rankings.
- Use ### heading for each section if answer has multiple topics.
- Use a markdown table if comparing multiple items.
- Short factual answers (date, name, number) → one line, no bullets needed.
- Code → always wrap in ```language blocks.
"""

_DOC_ONLY = """You are a precise knowledge assistant. The document context below is the user's own uploaded document (e.g. a resume, report, or notes).
Answer ONLY what the user asks using the document context.
{format_rules}
- When the user uses "my", "I", or "me", treat them as referring to the person described in the document.
- Extract the answer directly from the document text — do not say it is missing if the information is present.
- If the information is genuinely not in the document, say so in one line.

Document context:
{{context}}
""".format(format_rules=_FORMAT_RULES)

_WEB_ONLY = """You are a precise, up-to-date assistant with access to live web search results.
Answer ONLY what the user asks using the search results below.
{format_rules}
- ONLY use facts explicitly stated in the search results. Do NOT guess or infer.
- NEVER mix up dates — only report results matching today's date.
- For sports/matches: **Team A vs Team B**, venue, time — use bold and bullets.
- For weather/prices: state exact value with date.
- If results are unclear or conflicting, say so honestly.

Live web search results:
{{context}}
""".format(format_rules=_FORMAT_RULES)

_DOC_AND_WEB = """You are a precise knowledge assistant with document knowledge and live web data.
Answer ONLY what the user asks.
{format_rules}
- For personal, biographical, or document-specific questions (name, skills, experience, education, projects): use the Document context.
- For factual, current, or real-time questions (prices, exchange rates, news, weather, events): use the Web results and IGNORE the document.
- ONLY state facts explicitly in the sources — never guess.
- Cite web sources inline as (Source: URL).

Document context:
{{doc_context}}

Live web search results:
{{web_context}}
""".format(format_rules=_FORMAT_RULES)

_GENERAL = """You are a precise, helpful AI assistant. Answer ONLY what the user asks.
{format_rules}
- Do not pad, repeat, or add unrequested information.
- Match answer length to question complexity.
""".format(format_rules=_FORMAT_RULES)


# ── Context header ───────────────────────────────────────────────────────────

def _context_header() -> str:
    now = datetime.now()
    return (
        f"[ System context: "
        f"Current date: {now.strftime('%A, %d %B %Y')} | "
        f"Current time: {now.strftime('%I:%M %p')} ]\n\n"
    )


# ── Helpers ───────────────────────────────────────────────────────────────────

def _extract_text(content) -> str:
    """Safely extract string from LLM chunk (Gemini may return a list)."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "".join(
            b.get("text", "") if isinstance(b, dict) else str(b) for b in content
        )
    return str(content) if content else ""


def _format_docs(docs) -> str:
    parts = []
    for i, doc in enumerate(docs, 1):
        source = doc.metadata.get("source", "unknown")
        parts.append(f"[{i}] (source: {source})\n{doc.page_content}")
    return "\n\n---\n\n".join(parts)


def _build_messages(history: List[Dict], question: str, system_content: str):
    messages = [SystemMessage(content=system_content)]
    for turn in history[-10:]:
        messages.append(HumanMessage(content=turn["human"]))
        messages.append(AIMessage(content=turn["ai"]))
    messages.append(HumanMessage(content=question))
    return messages


# ── Main pipeline ─────────────────────────────────────────────────────────────

async def query_stream(
    question: str,
    provider,
    history: List[Dict],
    model: str | None = None,
    temperature: float = 0.3,
) -> AsyncIterator[str]:
    """
    Agentic routing:
      1. Check if question needs real-time data  → web search
      2. Check if knowledge base has relevant docs → RAG
      3. Combine both when available
      4. Fall back to general LLM if neither applies
    """
    doc_results = vs.similarity_search(question, k=6)
    has_docs    = bool(doc_results)

    # Always run web search for factual/current queries regardless of docs
    use_web     = needs_web_search(question)
    search_query = f"{question} {datetime.now().strftime('%d %B %Y')}" if use_web else question
    web_results  = search(search_query, max_results=3) if use_web else []

    has_web  = bool(web_results)

    sources: list[str] = []

    if has_docs and has_web:
        doc_context = _format_docs(doc_results)
        web_context = format_results(web_results)
        system_content = _DOC_AND_WEB.format(
            doc_context=doc_context, web_context=web_context
        )
        sources = (
            [d.metadata.get("source", "") for d in doc_results if d.metadata.get("source")]
            + [r["url"] for r in web_results if r.get("url")]
        )

    elif has_docs:
        system_content = _DOC_ONLY.format(context=_format_docs(doc_results))
        sources = [d.metadata.get("source", "") for d in doc_results if d.metadata.get("source")]

    elif has_web:
        system_content = _WEB_ONLY.format(context=format_results(web_results))
        sources = [r["url"] for r in web_results if r.get("url")]

    else:
        system_content = _GENERAL

    # Prepend current date/time to every system prompt
    system_content = _context_header() + system_content

    # Deduplicate sources
    sources = list(dict.fromkeys(s for s in sources if s))

    llm_kwargs: Dict[str, Any] = {"temperature": temperature}
    if model:
        llm_kwargs["model"] = model

    llm = provider.get_llm(**llm_kwargs)
    messages = _build_messages(history, question, system_content)

    async for chunk in llm.astream(messages):
        token = _extract_text(chunk.content)
        if token:
            yield token

    if sources:
        yield f"__SOURCES__:{','.join(sources)}"


def has_knowledge_base() -> bool:
    return vs.get_store() is not None
