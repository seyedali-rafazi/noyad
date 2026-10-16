import { groqClient } from './groqClient';
import { AiResponse } from './aiUtils';

export { AiResponse } from './aiUtils';

export class AiClient {
  /**
   * Sends user message to Groq high-speed LPU engine (Llama 3.1 8B Instant).
   */
  async generateResponse(
    userMessage: string,
    history: { role: 'user' | 'assistant'; content: string }[] = []
  ): Promise<AiResponse> {
    return groqClient.generateResponse(userMessage, history);
  }
}

export const aiClient = new AiClient();
