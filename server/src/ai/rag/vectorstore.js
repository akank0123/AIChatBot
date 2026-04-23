import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/huggingface_transformers';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, rmSync } from 'fs';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const INDEX_PATH = join(__dirname, '..', '..', '..', 'data', 'hnswlib_index');

let store      = null;
let embeddings = null;

function getEmbeddings() {
  if (!embeddings) {
    embeddings = new HuggingFaceTransformersEmbeddings({
      model: 'Xenova/all-MiniLM-L6-v2',
    });
  }
  return embeddings;
}

export function getStore() { return store; }

export async function loadPersisted() {
  const indexFile = join(INDEX_PATH, 'hnswlib.index');
  if (existsSync(indexFile)) {
    try {
      store = await HNSWLib.load(INDEX_PATH, getEmbeddings());
      console.log('Vector store loaded from disk.');
    } catch {
      store = null;
    }
  }
}

export async function addDocuments(docs) {
  const emb = getEmbeddings();
  if (!store) {
    store = await HNSWLib.fromDocuments(docs, emb);
  } else {
    await store.addDocuments(docs);
  }
  mkdirSync(INDEX_PATH, { recursive: true });
  await store.save(INDEX_PATH);
  return docs.length;
}

// HNSWLib with L2 space returns squared L2 — same scale as Python FAISS
export async function similaritySearch(query, k = 6, threshold = 1.70) {
  if (!store) return [];
  const results = await store.similaritySearchWithScore(query, k);
  return results.filter(([, score]) => score <= threshold).map(([doc]) => doc);
}

export function resetStore() {
  store = null;
  if (existsSync(INDEX_PATH)) {
    rmSync(INDEX_PATH, { recursive: true, force: true });
  }
}
