import { loadPdf, loadText, loadUrl } from '../ai/rag/loaders.js';
import { addDocuments, resetStore } from '../ai/rag/vectorstore.js';

const ALLOWED_EXTS = new Set(['.pdf', '.txt', '.md', '.csv']);

export async function uploadDocument(req, res) {
  try {
    const filename = req.file?.originalname || 'upload';
    const ext      = filename.includes('.') ? '.' + filename.split('.').pop().toLowerCase() : '';

    if (!ALLOWED_EXTS.has(ext)) {
      return res.status(400).json({ detail: `Unsupported file type '${ext}'. Allowed: ${[...ALLOWED_EXTS].join(', ')}` });
    }

    const docs  = ext === '.pdf'
      ? await loadPdf(req.file.buffer, filename)
      : await loadText(req.file.buffer, filename);

    const count = await addDocuments(docs);
    res.json({ message: `Ingested ${count} chunks from '${filename}'`, chunks: count });
  } catch (e) {
    res.status(500).json({ detail: String(e.message || e) });
  }
}

export async function addUrl(req, res) {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ detail: 'url is required' });
    const docs  = await loadUrl(url);
    const count = await addDocuments(docs);
    res.json({ message: `Ingested ${count} chunks from '${url}'`, chunks: count });
  } catch (e) {
    res.status(400).json({ detail: `Failed to load URL: ${e.message || e}` });
  }
}

export async function addText(req, res) {
  try {
    const { text, source = 'pasted-text' } = req.body;
    if (!text) return res.status(400).json({ detail: 'text is required' });
    const docs  = await loadText(Buffer.from(text, 'utf-8'), source);
    const count = await addDocuments(docs);
    res.json({ message: `Ingested ${count} chunks`, chunks: count });
  } catch (e) {
    res.status(500).json({ detail: String(e.message || e) });
  }
}

export async function clearDocuments(req, res) {
  resetStore();
  res.json({ message: 'Knowledge base cleared' });
}
