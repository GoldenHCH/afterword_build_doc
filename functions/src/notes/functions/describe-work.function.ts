import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { ANTHROPIC_API_KEY } from '../../secrets.constants';
import { DescribeWorkError } from '../describe-work.error';
import { DescribeWorkService } from '../describe-work.service';
import { describeWorkConfig, describeWorkErrors } from '../notes.constants';

export const describeWork = onCall<
  Afterword.Types.IDescribeWorkRequest,
  Promise<Afterword.Types.IDescribeWorkResponse>
>({ secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 60 }, async (request) => {
  const userId = request.auth?.uid;

  if (!userId) {
    throw new HttpsError('unauthenticated', describeWorkErrors.SIGN_IN);
  }

  const text = typeof request.data?.text === 'string' ? request.data.text.trim() : '';

  if (text.length < describeWorkConfig.MIN_TEXT_CHARS) {
    throw new HttpsError('invalid-argument', describeWorkErrors.TEXT_REQUIRED);
  }

  if (text.length > describeWorkConfig.MAX_TEXT_CHARS) {
    throw new HttpsError('invalid-argument', describeWorkErrors.TEXT_TOO_LONG);
  }

  const apiKey = ANTHROPIC_API_KEY.value();

  if (!apiKey) {
    logger.error('describeWork has no Anthropic key', { userId, reason: describeWorkErrors.MISSING_KEY });
    throw new HttpsError('unavailable', describeWorkErrors.UNAVAILABLE);
  }

  try {
    const note = await new DescribeWorkService().describe(text, apiKey);

    return { note };
  } catch (error) {
    logger.error('describeWork failed', { userId, error: error instanceof Error ? error.message : String(error) });

    if (error instanceof DescribeWorkError) {
      throw new HttpsError(
        error.failure === 'not-understood' ? 'invalid-argument' : 'unavailable',
        error.message,
      );
    }

    throw new HttpsError('internal', describeWorkErrors.UNAVAILABLE);
  }
});
