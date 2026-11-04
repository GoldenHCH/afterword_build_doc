import * as logger from 'firebase-functions/logger';

import { AnthropicClientService } from '../brief/anthropic-client.service';
import { IModelCompletion } from '../brief/brief.interfaces';
import { DescribeWorkError } from './describe-work.error';
import {
  buildDescribeWorkPrompt,
  buildDescribeWorkSystemPrompt,
  normalizeDraft,
  parseDescribeWorkResponse,
} from './describe-work.helper';
import { describeWorkConfig, describeWorkErrors } from './notes.constants';

export class DescribeWorkService {
  private readonly _anthropic = new AnthropicClientService();

  public async describe(text: string, apiKey: string): Promise<Afterword.Types.IDescribeWorkResponse['note']> {
    const system = buildDescribeWorkSystemPrompt();
    const userContent = buildDescribeWorkPrompt(text);
    let lastFailure: DescribeWorkError | null = null;

    for (let attempt = 1; attempt <= describeWorkConfig.MAX_ATTEMPTS; attempt++) {
      let completion: IModelCompletion;

      try {
        completion = await this._anthropic.complete(apiKey, system, userContent, {
          maxTokens: describeWorkConfig.MAX_TOKENS,
          timeoutMs: describeWorkConfig.TIMEOUT_MS,
        });
      } catch (error) {
        logger.warn('describeWork model call failed', { attempt, error: this._messageOf(error) });
        lastFailure = new DescribeWorkError('unavailable', describeWorkErrors.UNAVAILABLE);

        continue;
      }

      logger.info('describeWork model call finished', {
        attempt,
        inputTokens: completion.inputTokens,
        outputTokens: completion.outputTokens,
        latencyMs: completion.latencyMs,
      });

      const draft = parseDescribeWorkResponse(completion.text);

      if (draft) {
        return normalizeDraft(draft);
      }

      logger.warn('describeWork reply was not a valid note', { attempt });
      lastFailure = new DescribeWorkError('not-understood', describeWorkErrors.NOT_UNDERSTOOD);
    }

    throw lastFailure ?? new DescribeWorkError('unavailable', describeWorkErrors.UNAVAILABLE);
  }

  private _messageOf(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
