import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';
import { load as cheerioLoad } from 'cheerio';
import { createRequire } from 'module';

const require   = createRequire(import.meta.url);
const pdfParse  = require('pdf-parse');

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize:    600,
  chunkOverlap: 100,
  separators:   ['\n\n', '\n', '. ', ' ', ''],
});

export async function loadPdf(buffer, filename) {
  const data = await pdfParse(buffer);
  const doc  = new Document({
    pageContent: data.text,
    metadata:    { source: filename, type: 'pdf' },
  });
  return splitter.splitDocuments([doc]);
}

export async function loadText(buffer, filename) {
  const content = buffer.toString('utf-8');
  const doc     = new Document({
    pageContent: content,
    metadata:    { source: filename, type: 'text' },
  });
  return splitter.splitDocuments([doc]);
}

const URL_TIMEOUT_MS  = 30_000;
const URL_MAX_CHARS   = 150_000;
const FETCH_UA        = 'Mozilla/5.0 (compatible; RAGChatBot/1.0; +https://github.com)';

export async function loadUrl(url) {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), URL_TIMEOUT_MS);

  let html;
  try {
    const response = await fetch(url, {
      signal:  controller.signal,
      headers: {
        'User-Agent': FETCH_UA,
        'Accept':     'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    html = await response.text();
  } finally {
    clearTimeout(timer);
  }

  const $    = cheerioLoad(html);
  $('script, style, nav, header, footer, aside, noscript, iframe, [role="navigation"]').remove();
  let text   = $('body').text().replace(/\s+/g, ' ').trim();

  if (text.length > URL_MAX_CHARS) text = text.slice(0, URL_MAX_CHARS);

  const doc = new Document({ pageContent: text, metadata: { source: url, type: 'web' } });
  return splitter.splitDocuments([doc]);
}
