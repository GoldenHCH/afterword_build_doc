import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { SendBriefingService } from '../../brief/send-briefing.service';
import { ANTHROPIC_API_KEY, OPENALEX_API_KEY, RESEND_API_KEY, optionalSourceSecrets } from '../../secrets.constants';
import { BriefingBuilderService } from '../services/briefing-builder.service';

export const buildBriefingNow = onCall<
  Afterword.Types.IBuildBriefingNowRequest,
  Promise<Afterword.Types.IBuildBriefingNowResponse>
>({ secrets: [ANTHROPIC_API_KEY, OPENALEX_API_KEY, RESEND_API_KEY, ...optionalSourceSecrets], timeoutSeconds: 300 }, async (request) => {
  const userId = request.auth?.uid;

  if (!userId) {
    throw new HttpsError('unauthenticated', 'Please sign in to build your briefing.');
  }

  let briefingId: string;
  let sourceWarning: string | undefined;

  try {
    const builder = new BriefingBuilderService();
    briefingId = await builder.build(userId);
    const briefing = await builder.loadBriefing(briefingId);

    if (briefing.status === 'failed') {
      return { briefingId, warning: briefing.error };
    }

    sourceWarning = briefing.warning;
  } catch (error) {
    logger.error('buildBriefingNow failed', { userId, error: error instanceof Error ? error.message : String(error) });
    throw new HttpsError('internal', 'We could not build your briefing. Please try again in a minute.');
  }

  const outcome = await new SendBriefingService().explainAndSend(briefingId);

  const warning = [sourceWarning, outcome.warning].filter((message): message is string => !!message).join(' ');

  return warning ? { briefingId, warning } : { briefingId };
});
