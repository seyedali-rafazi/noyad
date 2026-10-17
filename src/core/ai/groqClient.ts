import { useAiSettingsStore, GROQ_MODEL_ID } from './aiSettingsStore';
import {
  getAiSystemPrompt,
  extractActionFromText,
  extractFromFailedGeneration,
  AiResponse,
} from './aiUtils';

export class GroqClient {
  /**
   * Sends user message to GroqCloud API using configured API keys with automatic failover.
   * Model: GPT 20B (OpenAI GPT-OSS 20B parameter model).
   */
  async generateResponse(
    userMessage: string,
    history: { role: 'user' | 'assistant'; content: string }[] = []
  ): Promise<AiResponse> {
    const aiStore = useAiSettingsStore.getState();
    const activeKeys = aiStore.getActiveKeys();

    if (activeKeys.length === 0) {
      return {
        success: false,
        reason: 'NO_KEYS',
        provider: 'groq',
        reply:
          'کلید API گرواک (Groq) ثبت نشده است.\n\n' +
          'برای گفت‌وگو با دستیار هوشمند، لطفاً از بخش «تنظیمات» یک یا چند کلید رایگان از console.groq.com دریافت و ثبت فرمایید.',
      };
    }

    const systemPrompt = getAiSystemPrompt();

    // Build OpenAI-compatible chat messages
    const recentHistory = history.slice(-6);
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];

    for (const h of recentHistory) {
      messages.push({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: h.content,
      });
    }

    messages.push({
      role: 'user',
      content: userMessage,
    });

    let failoverOccurred = false;
    let lastErrorDetails = '';
    const targetModel = aiStore.selectedModel || GROQ_MODEL_ID;

    // Failover loop through available active Groq keys
    for (let i = 0; i < activeKeys.length; i++) {
      const currentKey = activeKeys[i];
      let model = targetModel;

      try {
        let response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentKey.apiKey.trim()}`,
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.6,
          }),
        });

        // 1. Success
        if (response.ok) {
          const data = await response.json();
          const rawText: string = data?.choices?.[0]?.message?.content || '';

          if (!rawText) {
            continue;
          }

          const { cleanReply, proposedAction } = extractActionFromText(rawText);

          return {
            success: true,
            reply: cleanReply,
            proposedAction,
            usedKeyId: currentKey.id,
            failoverOccurred,
            provider: 'groq',
          };
        }

        // Parse error details
        const errJson = await response.json().catch(() => null);
        const errMsg = errJson?.error?.message || response.statusText || '';
        lastErrorDetails = `(HTTP ${response.status}): ${errMsg}`;
        console.warn(`Groq API responded with error [${response.status}]:`, errMsg);

        // 1.1 Recover generated output if Groq returned failed_generation
        // (common when models emit special tokens or Groq reports "Tool choice is none, but model called a tool")
        const failedGen = errJson?.error?.failed_generation;
        if (failedGen) {
          const rescuedText = extractFromFailedGeneration(failedGen);
          if (rescuedText) {
            const { cleanReply, proposedAction } = extractActionFromText(rescuedText);
            if (cleanReply || proposedAction) {
              return {
                success: true,
                reply: cleanReply,
                proposedAction,
                usedKeyId: currentKey.id,
                failoverOccurred,
                provider: 'groq',
              };
            }
          }
        }

        // 2. Model not found or deprecated (404) -> auto-fallback to GROQ_MODEL_ID
        if (response.status === 404 && model !== GROQ_MODEL_ID) {
          console.warn(`Groq model [${model}] returned 404. Falling back to ${GROQ_MODEL_ID}...`);
          model = GROQ_MODEL_ID;
          aiStore.setSelectedModel(GROQ_MODEL_ID);

          response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${currentKey.apiKey.trim()}`,
            },
            body: JSON.stringify({
              model,
              messages,
              temperature: 0.6,
            }),
          });
          failoverOccurred = true;

          if (response.ok) {
            const data = await response.json();
            const rawText: string = data?.choices?.[0]?.message?.content || '';
            const { cleanReply, proposedAction } = extractActionFromText(rawText);
            return {
              success: true,
              reply: cleanReply,
              proposedAction,
              usedKeyId: currentKey.id,
              failoverOccurred,
              provider: 'groq',
            };
          } else {
            const fallbackErr = await response.json().catch(() => null);
            const fallbackFailedGen = fallbackErr?.error?.failed_generation;
            if (fallbackFailedGen) {
              const rescuedText = extractFromFailedGeneration(fallbackFailedGen);
              if (rescuedText) {
                const { cleanReply, proposedAction } = extractActionFromText(rescuedText);
                if (cleanReply || proposedAction) {
                  return {
                    success: true,
                    reply: cleanReply,
                    proposedAction,
                    usedKeyId: currentKey.id,
                    failoverOccurred,
                    provider: 'groq',
                  };
                }
              }
            }
            lastErrorDetails = `(HTTP ${response.status}): ${fallbackErr?.error?.message || response.statusText}`;
          }
        }

        // 3. Quota / Rate limit (429)
        if (response.status === 429) {
          console.warn(
            `Groq API Key [${currentKey.id}] rate limited (HTTP 429). Rotating to next key...`
          );
          await aiStore.markKeyExhausted(currentKey.apiKey);
          failoverOccurred = true;
          continue;
        }

        // 4. Unauthorized / Invalid API Key (401)
        if (response.status === 401) {
          console.warn(`Groq API Key [${currentKey.id}] is invalid (HTTP 401). Marking invalid.`);
          await aiStore.markKeyInvalid(currentKey.apiKey);
          failoverOccurred = true;
          continue;
        }

        // Other HTTP error
        failoverOccurred = true;
        continue;
      } catch (networkError: unknown) {
        const msg = networkError instanceof Error ? networkError.message : String(networkError);
        lastErrorDetails = msg;
        console.warn(`Network error with Groq key [${currentKey.id}]:`, networkError);
        failoverOccurred = true;
        continue;
      }
    }

    return {
      success: false,
      reason: 'ALL_KEYS_EXHAUSTED',
      provider: 'groq',
      reply:
        `پاسخ از سرویس Groq دریافت نشد ${lastErrorDetails ? `\n\nعلت خطا: ${lastErrorDetails}` : ''}\n\n` +
        'لطفاً در بخش «تنظیمات» کلید API خود را بررسی فرمایید یا کلید جدیدی از console.groq.com/keys وارد کنید.',
    };
  }
}

export const groqClient = new GroqClient();
