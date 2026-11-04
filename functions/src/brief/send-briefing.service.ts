import { getFirestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';

import { collections } from '../constants';
import { ISendBriefingOutcome } from './brief.interfaces';
import { BriefingExplainerService } from './briefing-explainer.service';
import { EmailService } from './email.service';
import { sendBriefingWarnings } from './send-briefing.constants';

export class SendBriefingService {
  public async explainAndSend(briefingId: string): Promise<ISendBriefingOutcome> {
    try {
      const explainOutcome = await new BriefingExplainerService().explain(briefingId);
      const sendOutcome = await new EmailService().sendBriefing(briefingId);
      const warnings = [explainOutcome.warning, sendOutcome.warning].filter((warning): warning is string => !!warning);

      return {
        explained: explainOutcome.explained,
        sent: sendOutcome.sent,
        ...(warnings.length > 0 ? { warning: warnings.join(' ') } : {}),
      };
    } catch (error) {
      logger.error('explainAndSend failed', { briefingId, error: error instanceof Error ? error.message : String(error) });

      return { explained: false, sent: false, warning: sendBriefingWarnings.UNEXPECTED };
    }
  }

  public async listUserIdsWithOpenNotes(): Promise<string[]> {
    const snapshot = await getFirestore().collection(collections.NOTES).where('status', '==', 'open').get();
    const userIds = snapshot.docs.map((document) => document.data().userId as string).filter((userId) => !!userId);

    return Array.from(new Set(userIds));
  }
}
