import api from './api';

export const getProviders = () =>
  api.get('/chat/providers').then(r => r.data);
