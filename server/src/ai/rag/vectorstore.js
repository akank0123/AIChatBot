import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/huggingface_transformers';

const stores = new Map(); // sessionId -> HNSWLib instance
let embeddings = null;

function getEmbeddings() {
  if (!embeddings) {
    embeddings = new HuggingFaceTransformersEmbeddings({
      model:     'Xenova/all-MiniLM-L6-v2',
      batchSize: 32,
    });
  }
  return embeddings;
}

export function getStore(sessionId) {
  return stores.get(sessionId) ?? null;
}

export async function addDocuments(docs, sessionId) {
  const emb = getEmbeddings();
  if (!stores.has(sessionId)) {
    stores.set(sessionId, await HNSWLib.fromDocuments(docs, emb));
  } else {
    await stores.get(sessionId).addDocuments(docs);
  }
  return docs.length;
}

export async function similaritySearch(query, k = 6, threshold = 1.70, sessionId) {
  const store = stores.get(sessionId);
  if (!store) return [];
  try {
    const results = await store.similaritySearchWithScore(query, k);
    return results.filter(([, score]) => score <= threshold).map(([doc]) => doc);
  } catch (e) {
    console.error('[vectorstore] similaritySearch error:', e.message || e);
    return [];
  }
}

export function resetStore(sessionId) {
  if (sessionId) {
    stores.delete(sessionId);
  } else {
    stores.clear();
  }
}
