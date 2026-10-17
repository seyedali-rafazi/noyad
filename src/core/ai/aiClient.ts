import { groqClient } from './groqClient';
import { AiResponse } from './aiUtils';

export { AiResponse } from './aiUtils';

export class AiClient {
  /**
   * Sends user message to Groq high-speed engine (GPT 20B).
   */
  async generateResponse(
    userMessage: string,
    history: { role: 'user' | 'assistant'; content: string }[] = []
  ): Promise<AiResponse> {
    return groqClient.generateResponse(userMessage, history);
  }
}

export const aiClient = new AiClient();
