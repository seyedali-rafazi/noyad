import { groqClient, GroqClient } from './groqClient';
import { AiResponse } from './aiUtils';

export type GeminiResponse = AiResponse;
export const GeminiClient = GroqClient;
export const geminiClient = groqClient;
