import { ChatOllama } from '@langchain/ollama';
import axios from 'axios';

const BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

export class LlamaProvider {
  name   = 'llama';
  models = ['llama3.2', 'llama3.1', 'llama3', 'mistral', 'codellama'];

  getLlm({ model = 'llama3.2', temperature = 0.3 } = {}) {
    return new ChatOllama({ model, temperature, baseUrl: BASE_URL });
  }

  async isAvailable() {
    try {
      const res = await axios.get(`${BASE_URL}/api/tags`, { timeout: 2000 });
      return res.status === 200;
    } catch {
      return false;
    }
  }
}
