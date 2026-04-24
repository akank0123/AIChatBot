// The RAG Pipeline ( The Brain )

import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import * as vs from './vectorstore.js';
import { needsWebSearch, search, formatResults } from './webSearch.js';

// ── System prompts ─────────────────────────────────────────────────────────────

const FORMAT_RULES = `
FORMATTING RULES (always follow):
- NEVER write a long paragraph. Always break into sections.
- Use **bold** for key terms, names, numbers.
- Use bullet points (- item) for lists of facts.
- Use numbered lists (1. item) for steps or rankings.
- Use ### heading for each section if answer has multiple topics.
- Use a markdown table if comparing multiple items.
- Short factual answers (date, name, number) → one line, no bullets needed.
- Code → always wrap in \`\`\`language blocks.
`;

// Tells LLM to answer only from uploaded document context
const DOC_ONLY = (context) => `You are a precise knowledge assistant. The document context below is the user's own uploaded document.
Answer ONLY what the user asks using the document context.
${FORMAT_RULES}
- When the user uses "my", "I", or "me", treat them as referring to the person described in the document.
- Extract the answer directly from the document text.
- If the information is genuinely not in the document, say so in one line.

Document context:
${context}`;

// Tells LLM to answer only from live web search results
const WEB_ONLY = (context) => `You are a precise, up-to-date assistant with access to live web search results.
Answer ONLY what the user asks using the search results below.
${FORMAT_RULES}
- ONLY use facts explicitly stated in the search results. Do NOT guess or infer.
- NEVER mix up dates — only report results matching today's date.
- If results are unclear or conflicting, say so honestly.

Live web search results:
${context}`;

// Uses both; document for personal questions, web for current facts
const DOC_AND_WEB = (docCtx, webCtx) => `You are a precise knowledge assistant with document knowledge and live web data.
Answer ONLY what the user asks.
${FORMAT_RULES}
- For personal, biographical, or document-specific questions: use the Document context.
- For factual, current, or real-time questions: use the Web results and IGNORE the document.
- ONLY state facts explicitly in the sources — never guess.
- Cite web sources inline as (Source: URL).

Document context:
${docCtx}

Live web search results:
${webCtx}`;

// Plain AI assistant when no context found
const GENERAL = `You are a precise, helpful AI assistant. Answer ONLY what the user asks.
${FORMAT_RULES}
- Do not pad, repeat, or add unrequested information.
- Match answer length to question complexity.`;

// ── Helpers ────────────────────────────────────────────────────────────────────

// Prepends current date and time to every system prompt
function contextHeader() {
  const now  = new Date();
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const mons = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const pad  = (n) => String(n).padStart(2, '0');
  const h    = now.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = ((h % 12) || 12);
  return `[ System context: Current date: ${days[now.getDay()]}, ${pad(now.getDate())} ${mons[now.getMonth()]} ${now.getFullYear()} | Current time: ${pad(h12)}:${pad(now.getMinutes())} ${ampm} ]\n\n`;
}

function extractText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map(b => (typeof b === 'object' ? b.text || '' : String(b))).join('');
  return content ? String(content) : '';
}

function formatDocs(docs) {
  return docs.map((doc, i) => `[${i + 1}] (source: ${doc.metadata?.source || 'unknown'})\n${doc.pageContent}`).join('\n\n---\n\n');
}

// Builds the full LLM message list: system prompt + last 10 turns of history + current question
function buildMessages(history, question, systemContent) {
  const msgs = [new SystemMessage(systemContent)];
  for (const turn of history.slice(-10)) {
    msgs.push(new HumanMessage(turn.human));
    msgs.push(new AIMessage(turn.ai));
  }
  msgs.push(new HumanMessage(question));
  return msgs;
}

// ── Main pipeline ──────────────────────────────────────────────────────────────

export async function* queryStream(question, provider, history, model = null, temperature = 0.3, sessionId) {
  const docResults = await vs.similaritySearch(question, 6, 1.70, sessionId); //  Searches the vector store for document chunks related to the question (max 6 results)
  const hasDocs    = docResults.length > 0;

  const useWeb   = needsWebSearch(question);
  const now      = new Date();
  const dateStr  = `${now.getDate()} ${['January','February','March','April','May','June','July','August','September','October','November','December'][now.getMonth()]} ${now.getFullYear()}`;
  const webQuery = useWeb ? `${question} ${dateStr}` : question;
  const webResults = useWeb ? await search(webQuery, 3) : [];
  const hasWeb   = webResults.length > 0;

  let systemContent;
  let sources = [];

  // Picks the right system prompt based on what was found: DOC_ONLY, WEB_ONLY, DOC_AND_WEB, or GENERAL
  if (hasDocs && hasWeb) {
    systemContent = DOC_AND_WEB(formatDocs(docResults), formatResults(webResults));
    sources = [
      ...docResults.map(d => d.metadata?.source).filter(Boolean),
      ...webResults.map(r => r.url).filter(Boolean),
    ];
  } else if (hasDocs) {
    systemContent = DOC_ONLY(formatDocs(docResults));
    sources = docResults.map(d => d.metadata?.source).filter(Boolean);
  } else if (hasWeb) {
    systemContent = WEB_ONLY(formatResults(webResults));
    sources = webResults.map(r => r.url).filter(Boolean);
  } else {
    systemContent = GENERAL;
  }

  systemContent = contextHeader() + systemContent;
  sources = [...new Set(sources)];

  const llmOpts = { temperature };
  if (model) llmOpts.model = model;

  const llm      = provider.getLlm(llmOpts);
  const messages = buildMessages(history, question, systemContent);
  
  // Calls llm.stream(messages) — gets a token-by-token stream from OpenAI/Gemini/Llama, yields each token up to the controller
  const stream = await llm.stream(messages);
  for await (const chunk of stream) {
    const token = extractText(chunk.content);
    if (token) yield token;
  }

  if (sources.length) yield `__SOURCES__:${sources.join(',')}`; // After all tokens, yields __SOURCES__:url1,url2 as a single special token
}

export function hasKnowledgeBase(sessionId) {
  return vs.getStore(sessionId) !== null;
}
