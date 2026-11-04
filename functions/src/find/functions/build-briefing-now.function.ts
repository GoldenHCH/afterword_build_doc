import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { PAPERCLIP_API_KEY, X_BEARER_TOKEN } from '../../secrets.constants';
import { BriefingBuilderService } from '../services/briefing-builder.service';

export const buildBriefingNow = onCall<
  Afterword.Types.IBuildBriefingNowRequest,
  Promise<Afterword.Types.IBuildBriefingNowResponse>
>({ secrets: [PAPERCLIP_API_KEY, X_BEARER_TOKEN], timeoutSeconds: 180 }, async (request) => {
  const userId = request.auth?.uid;

  if (!userId) {
    throw new HttpsError('unauthenticated', 'Please sign in to build your briefing.');
  }

  try {
    const builder = new BriefingBuilderService();
    const briefingId = await builder.build(userId);
    const briefing = await builder.loadBriefing(briefingId);

    if (briefing.status === 'failed') {
      return { briefingId, warning: briefing.error };
    }

    return { briefingId };
  } catch (error) {
    logger.error('buildBriefingNow failed', { userId, error: error instanceof Error ? error.message : String(error) });
    throw new HttpsError('internal', 'We could not build your briefing. Please try again in a minute.');
  }
});
