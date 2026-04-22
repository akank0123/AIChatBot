import api from './api';

export const uploadFile = (file, onProgress) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/documents/upload', form, {
    onUploadProgress: e => onProgress?.(Math.round((e.loaded * 100) / e.total)),
  }).then(r => r.data);
};

export const ingestURL = (url) =>
  api.post('/documents/url', { url }).then(r => r.data);

export const ingestText = (text, source = 'paste') =>
  api.post('/documents/text', { text, source }).then(r => r.data);

export const clearKnowledgeBase = () =>
  api.delete('/documents').then(r => r.data);
