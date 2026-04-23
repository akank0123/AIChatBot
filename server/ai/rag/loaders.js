import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';
import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
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

export async function loadUrl(url) {
  const loader = new CheerioWebBaseLoader(url);
  const docs   = await loader.load();
  docs.forEach(doc => {
    doc.metadata.source = url;
    doc.metadata.type   = 'web';
  });
  return splitter.splitDocuments(docs);
}
