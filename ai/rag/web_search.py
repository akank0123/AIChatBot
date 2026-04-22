"""Real-time web search via SerpAPI (Google Search)."""
from __future__ import annotations

import os
import re
import requests
from typing import List, Dict

SERPAPI_KEY = os.getenv("SERPAPI_KEY", "")

# Questions that are purely conversational or personal — no web search needed
_NO_SEARCH_PATTERNS = re.compile(
    r"^(hi|hello|hey|thanks|thank you|bye|ok|okay|sure|who are you|what are you|"
    r"what can you do|help me|how are you|good morning|good night|what is your name|"
    r"what is my|who am i|tell me about me|what are my|where am i from|"
    r"my name|my email|my phone|my skills|my experience|my education|summarize my|"
    r"what do i|where do i|who is this|tell me about this document|"
    r"summarize this|summarize the|what does this|explain this document)\b",
    re.IGNORECASE,
)

# Math/logic — no web search needed
_MATH_PATTERNS = re.compile(
    r"^(calculate|compute|solve|what is \d|simplify|convert \d)",
    re.IGNORECASE,
)

# Triggers news-specific search
_NEWS_PATTERNS = re.compile(
    r"\b(news|headline|headlines|breaking|sports news|cricket|football|"
    r"ipl|match|tournament|election|politics|top stories|what happened)\b",
    re.IGNORECASE,
)


def needs_web_search(question: str) -> bool:
    """Search the web for any factual question — skip only greetings and pure math."""
    q = question.strip()
    if _NO_SEARCH_PATTERNS.match(q):
        return False
    if _MATH_PATTERNS.match(q):
        return False
    if re.match(r"^(write|create|generate|fix|debug|explain this code|how to code)", q, re.IGNORECASE):
        return False
    return True


def is_news_query(question: str) -> bool:
    return bool(_NEWS_PATTERNS.search(question))


def search_web(query: str, max_results: int = 5) -> List[Dict]:
    """General web search via SerpAPI Google engine."""
    try:
        resp = requests.get(
            "https://serpapi.com/search",
            params={
                "q": query,
                "api_key": SERPAPI_KEY,
                "engine": "google",
                "num": max_results,
                "hl": "en",
            },
            timeout=10,
        )
        data = resp.json()
        results = []

        # Extract answer box first — covers currency, weather, calculator, sports scores
        ab = data.get("answer_box", {})
        if ab:
            ab_type = ab.get("type", "")
            if ab_type == "currency_converter":
                result_val = ab.get("result", "")
                date_str   = ab.get("date", "")
                results.append({
                    "title": "Live Exchange Rate",
                    "url":   "",
                    "body":  f"1 {ab.get('currency_converter',{}).get('from',{}).get('currency','USD')} = {result_val} (as of {date_str})",
                    "type":  "web",
                })
            elif ab.get("answer") or ab.get("result") or ab.get("snippet"):
                body = ab.get("answer") or ab.get("result") or ab.get("snippet", "")
                results.append({
                    "title": ab.get("title", "Direct Answer"),
                    "url":   ab.get("link", ""),
                    "body":  str(body),
                    "type":  "web",
                })

        for r in data.get("organic_results", [])[:max_results]:
            results.append({
                "title": r.get("title", ""),
                "url":   r.get("link", ""),
                "body":  r.get("snippet", ""),
                "type":  "web",
            })
        return results
    except Exception as e:
        return [{"title": "Search error", "url": "", "body": str(e), "type": "web"}]


def search_news(query: str, max_results: int = 6) -> List[Dict]:
    """News search via SerpAPI Google News engine."""
    try:
        resp = requests.get(
            "https://serpapi.com/search",
            params={
                "q": query,
                "api_key": SERPAPI_KEY,
                "engine": "google",
                "tbm": "nws",
                "num": max_results,
                "hl": "en",
            },
            timeout=10,
        )
        data = resp.json()
        results = []
        for r in data.get("news_results", [])[:max_results]:
            results.append({
                "title":  r.get("title", ""),
                "url":    r.get("link", ""),
                "body":   r.get("snippet", ""),
                "source": r.get("source", ""),
                "date":   r.get("date", ""),
                "type":   "news",
            })
        return results if results else search_web(query, max_results)
    except Exception as e:
        return search_web(query, max_results)


def search(query: str, max_results: int = 5) -> List[Dict]:
    """Smart dispatcher — picks news search or general web search."""
    if is_news_query(query):
        return search_news(query, max_results)
    return search_web(query, max_results)


def format_results(results: List[Dict]) -> str:
    """Format results into a context block the LLM can read."""
    if not results:
        return "No results found."
    parts = []
    for i, r in enumerate(results, 1):
        if r.get("type") == "news":
            date_str = f" | {r['date']}" if r.get("date") else ""
            src_str  = f" | {r['source']}" if r.get("source") else ""
            parts.append(
                f"[News {i}]{date_str}{src_str}\n"
                f"Headline: {r['title']}\n"
                f"{r['body']}\n"
                f"Link: {r['url']}"
            )
        else:
            parts.append(
                f"[Web {i}] {r['title']}\n"
                f"{r['body']}\n"
                f"Source: {r['url']}"
            )
    return "\n\n---\n\n".join(parts)
