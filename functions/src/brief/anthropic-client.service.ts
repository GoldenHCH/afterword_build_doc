import { explainConfig, explainErrors } from './brief.constants';
import { IAnthropicMessagesResponse, IModelCompletion } from './brief.interfaces';

export class AnthropicClientService {
  public async complete(apiKey: string, system: string, userContent: string): Promise<IModelCompletion> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), explainConfig.TIMEOUT_MS);
    const startedAt = Date.now();

    try {
      const response = await fetch(explainConfig.API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': explainConfig.API_VERSION,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: explainConfig.MODEL,
          max_tokens: explainConfig.MAX_TOKENS,
          system,
          messages: [{ role: 'user', content: userContent }],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const detail = (await response.text()).slice(0, 300);

        throw new Error(`${explainErrors.REQUEST_FAILED} (${response.status}): ${detail}`);
      }

      const payload = (await response.json()) as IAnthropicMessagesResponse;
      const text = payload.content?.find((block) => block.type === 'text')?.text;

      if (!text) {
        throw new Error(explainErrors.EMPTY_REPLY);
      }

      return {
        text,
        inputTokens: payload.usage?.input_tokens ?? 0,
        outputTokens: payload.usage?.output_tokens ?? 0,
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      if (controller.signal.aborted) {
        throw new Error(`${explainErrors.TIMED_OUT} after ${explainConfig.TIMEOUT_MS} ms`);
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
