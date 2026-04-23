export const HOST    = process.env.HOST || '0.0.0.0';
export const PORT    = parseInt(process.env.PORT || '8000', 10);
export const OLLAMA_BASE_URL   = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
export const ALLOWED_ORIGINS   = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
export const MAX_FILE_SIZE_MB  = parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10);

export const MODEL_DEFAULTS = {
  openai: 'gpt-4o-mini',
  gemini: 'gemini-2.0-flash',
  llama:  'llama3.2',
};
