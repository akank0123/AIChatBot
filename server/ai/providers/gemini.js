import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

export class GeminiProvider {
  name   = 'gemini';
  models = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash-lite'];

  getLlm({ model = 'gemini-2.0-flash', temperature = 0.3 } = {}) {
    return new ChatGoogleGenerativeAI({ model, temperature, streaming: true, apiKey: process.env.GOOGLE_API_KEY });
  }

  isAvailable() {
    return Boolean(process.env.GOOGLE_API_KEY);
  }
}
