import { ChatOpenAI } from '@langchain/openai';

export class OpenAIProvider {
  name   = 'openai';
  models = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];

  getLlm({ model = 'gpt-4o-mini', temperature = 0.3 } = {}) {
    return new ChatOpenAI({ model, temperature, streaming: true, apiKey: process.env.OPENAI_API_KEY });
  }

  isAvailable() {
    return Boolean(process.env.OPENAI_API_KEY);
  }
}
