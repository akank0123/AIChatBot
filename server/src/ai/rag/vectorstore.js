// Vector Search ( Your Uploaded Documents)

import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/huggingface_transformers';

const stores = new Map(); // sessionId -> HNSWLib instance
let embeddings = null;

// Loads the all-MiniLM-L6-v2 model (runs locally, no API needed) to convert text into vectors
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

// When we upload a file, its chunks are embedded and stored here
export async function addDocuments(docs, sessionId) {
  const emb = getEmbeddings();
  if (!stores.has(sessionId)) {
    stores.set(sessionId, await HNSWLib.fromDocuments(docs, emb));
  } else {
    await stores.get(sessionId).addDocuments(docs);
  }
  return docs.length;
}

// Converts your question to a vector, finds the closest document chunks (threshold 1.70), returns matching text
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

// Clears a session's vector index when session is deleted
export function resetStore(sessionId) {
  if (sessionId) {
    stores.delete(sessionId);
  } else {
    stores.clear();
  }
}
