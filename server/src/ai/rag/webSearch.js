// Web Search Decision

import axios from 'axios';

const SERPAPI_KEY = process.env.SERPAPI_KEY || '';

// Skips web search for greetings, personal document questions, "who am I" type questions
const NO_SEARCH = /^(hi|hello|hey|thanks|thank you|bye|ok|okay|sure|who are you|what are you|what can you do|help me|how are you|good morning|good night|what is your name|what is my|who am i|tell me about me|what are my|where am i from|my name|my email|my phone|my skills|my experience|my education|summarize my|what do i|where do i|who is this|tell me about this document|summarize this|summarize the|what does this|explain this document)\b/i;
// Skips web search for math/calculation questions
const MATH_PAT  = /^(calculate|compute|solve|what is \d|simplify|convert \d)/i;
// news/sports/election keywords
const NEWS_PAT  = /\b(news|headline|headlines|breaking|sports news|cricket|football|ipl|match|tournament|election|politics|top stories|what happened)\b/i;

// Returns true if the question needs live data, false for anything local/personal/math
export function needsWebSearch(question) {
  const q = question.trim();
  if (NO_SEARCH.test(q)) return false;
  if (MATH_PAT.test(q))  return false;
  if (/^(write|create|generate|fix|debug|explain this code|how to code)/i.test(q)) return false;
  return true;
}

// Detects news/sports/election keywords to route to Google News instead of regular searc
function isNewsQuery(question) {
  return NEWS_PAT.test(question);
}

// Calls SerpAPI Google search, extracts answer box + organic results
async function searchWeb(query, maxResults = 5) {
  try {
    const { data } = await axios.get('https://serpapi.com/search', {
      params: { q: query, api_key: SERPAPI_KEY, engine: 'google', num: maxResults, hl: 'en' },
      timeout: 10000,
    });

    const results = [];
    const ab = data.answer_box || {};
    if (ab.type === 'currency_converter') {
      const cc = ab.currency_converter || {};
      results.push({ title: 'Live Exchange Rate', url: '', body: `1 ${cc.from?.currency || 'USD'} = ${ab.result} (as of ${ab.date || ''})`, type: 'web' });
    } else if (ab.answer || ab.result || ab.snippet) {
      results.push({ title: ab.title || 'Direct Answer', url: ab.link || '', body: String(ab.answer || ab.result || ab.snippet), type: 'web' });
    }

    for (const r of (data.organic_results || []).slice(0, maxResults)) {
      results.push({ title: r.title || '', url: r.link || '', body: r.snippet || '', type: 'web' });
    }
    return results;
  } catch (e) {
    return [{ title: 'Search error', url: '', body: String(e.message), type: 'web' }];
  }
}

// Calls SerpAPI Google News specifically for news queries
async function searchNews(query, maxResults = 6) {
  try {
    const { data } = await axios.get('https://serpapi.com/search', {
      params: { q: query, api_key: SERPAPI_KEY, engine: 'google', tbm: 'nws', num: maxResults, hl: 'en' },
      timeout: 10000,
    });
    const results = (data.news_results || []).slice(0, maxResults).map(r => ({
      title: r.title || '', url: r.link || '', body: r.snippet || '',
      source: r.source || '', date: r.date || '', type: 'news',
    }));
    return results.length ? results : searchWeb(query, maxResults);
  } catch {
    return searchWeb(query, maxResults);
  }
}

// Entry point: picks news or web search based on query type 
export async function search(query, maxResults = 5) {
  return isNewsQuery(query) ? searchNews(query, maxResults) : searchWeb(query, maxResults);
}

export function formatResults(results) {
  if (!results.length) return 'No results found.';
  return results.map((r, i) => {
    if (r.type === 'news') {
      const date = r.date ? ` | ${r.date}` : '';
      const src  = r.source ? ` | ${r.source}` : '';
      return `[News ${i + 1}]${date}${src}\nHeadline: ${r.title}\n${r.body}\nLink: ${r.url}`;
    }
    return `[Web ${i + 1}] ${r.title}\n${r.body}\nSource: ${r.url}`;
  }).join('\n\n---\n\n');
}
