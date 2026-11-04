import * as logger from 'firebase-functions/logger';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import { BriefingBuilderService } from '../../find/services/briefing-builder.service';
import { ANTHROPIC_API_KEY, PAPERCLIP_API_KEY, RESEND_API_KEY, X_BEARER_TOKEN } from '../../secrets.constants';
import { sendBriefingWarnings, weeklyBriefingConfig } from '../send-briefing.constants';
import { SendBriefingService } from '../send-briefing.service';

export const weeklyBriefing = onSchedule(
  {
    schedule: weeklyBriefingConfig.SCHEDULE,
    timeZone: weeklyBriefingConfig.TIME_ZONE,
    secrets: [PAPERCLIP_API_KEY, X_BEARER_TOKEN, ANTHROPIC_API_KEY, RESEND_API_KEY],
    timeoutSeconds: weeklyBriefingConfig.TIMEOUT_SECONDS,
  },
  async (): Promise<void> => {
    const sender = new SendBriefingService();
    const builder = new BriefingBuilderService();
    const summary = { users: 0, built: 0, explained: 0, sent: 0, failed: 0 };

    try {
      const userIds = await sender.listUserIdsWithOpenNotes();
      summary.users = userIds.length;

      for (const userId of userIds) {
        try {
          const briefingId = await builder.build(userId);
          const briefing = await builder.loadBriefing(briefingId);

          if (briefing.status === 'failed') {
            summary.failed += 1;
            logger.warn('weeklyBriefing build failed', { userId, briefingId, error: briefing.error });
            continue;
          }

          summary.built += 1;
          const outcome = await sender.explainAndSend(briefingId);
          summary.explained += outcome.explained ? 1 : 0;
          summary.sent += outcome.sent ? 1 : 0;
        } catch (error) {
          summary.failed += 1;
          logger.error('weeklyBriefing failed for user', { userId, error: error instanceof Error ? error.message : String(error) });
        }
      }
    } catch (error) {
      logger.error('weeklyBriefing could not list users', {
        message: sendBriefingWarnings.UNEXPECTED,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    logger.info('weeklyBriefing finished', summary);
  },
);
