import api from './api';

export const uploadFile = (file, sessionId, onProgress) => {
  const form = new FormData();
  form.append('file', file);
  form.append('session_id', sessionId);
  return api.post('/documents/upload', form, {
    onUploadProgress: e => onProgress?.(Math.round((e.loaded * 100) / e.total)),
  }).then(r => r.data);
};

export const ingestURL = (url, sessionId) =>
  api.post('/documents/url', { url, session_id: sessionId }).then(r => r.data);

export const ingestText = (text, sessionId, source = 'paste') =>
  api.post('/documents/text', { text, source, session_id: sessionId }).then(r => r.data);

export const clearKnowledgeBase = (sessionId) =>
  api.delete('/documents', { params: { session_id: sessionId } }).then(r => r.data);
