import { OpenAIProvider } from './openai.js';
import { GeminiProvider } from './gemini.js';
import { LlamaProvider  } from './llama.js';

export const PROVIDERS = {
  openai: OpenAIProvider,
  gemini: GeminiProvider,
  llama:  LlamaProvider,
};

export function getProvider(name) {
  const Provider = PROVIDERS[name?.toLowerCase()];
  if (!Provider) throw new Error(`Unknown provider '${name}'. Choose from: ${Object.keys(PROVIDERS).join(', ')}`);
  return new Provider();
}
