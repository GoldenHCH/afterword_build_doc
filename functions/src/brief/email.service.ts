import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';

import { collections } from '../constants';
import { RESEND_API_KEY } from '../secrets.constants';
import { describeProviderError, renderBriefingEmail } from './briefing-email.helper';
import { emailConfig, emailErrors } from './email.constants';
import { IRenderedEmail, IResendErrorResponse, IResendSuccessResponse, ISendOutcome } from './email.interfaces';

export class EmailService {
  private readonly _firestore = getFirestore();

  public async sendBriefing(briefingId: string): Promise<ISendOutcome> {
    try {
      const briefingSnapshot = await this._firestore.collection(collections.BRIEFINGS).doc(briefingId).get();

      if (!briefingSnapshot.exists) {
        return this._fail(briefingId, emailErrors.BRIEFING_NOT_FOUND);
      }

      const briefing = { ...(briefingSnapshot.data() as Afterword.Firestore.Briefing.IBriefing), id: briefingSnapshot.id };
      const userSnapshot = await this._firestore.collection(collections.USERS).doc(briefing.userId).get();
      const user = userSnapshot.data() as Afterword.Firestore.User.IUser | undefined;

      const recipientEmail = await this._resolveRecipientEmail(briefing.userId, user?.email);

      if (!recipientEmail) {
        return this._fail(briefingId, emailErrors.NO_RECIPIENT);
      }

      const apiKey = this._readApiKey();

      if (!apiKey) {
        return this._fail(briefingId, emailErrors.MISSING_KEY);
      }

      const rendered = renderBriefingEmail(
        briefing,
        { email: recipientEmail, displayName: user?.displayName ?? '' },
        emailConfig.APP_URL,
      );
      const htmlBytes = Buffer.byteLength(rendered.html, 'utf8');

      if (htmlBytes > emailConfig.MAX_HTML_BYTES) {
        logger.warn('Briefing email is large and may be clipped by inboxes', { briefingId, htmlBytes });
      }

      return await this._post(briefingId, apiKey, recipientEmail, rendered);
    } catch (error) {
      logger.error('Briefing email failed unexpectedly', { briefingId, error: this._messageOf(error) });

      return { sent: false, warning: emailErrors.UNKNOWN };
    }
  }

  private async _post(briefingId: string, apiKey: string, to: string, rendered: IRenderedEmail): Promise<ISendOutcome> {
    let response: Response;

    try {
      response = await fetch(emailConfig.RESEND_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: emailConfig.FROM,
          to: [to],
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
        }),
        signal: AbortSignal.timeout(emailConfig.TIMEOUT_MS),
      });
    } catch (error) {
      logger.error('Resend request failed', { briefingId, error: this._messageOf(error) });

      return { sent: false, warning: emailErrors.NETWORK };
    }

    const body = await this._readJson(response);

    if (!response.ok) {
      const providerError = body as IResendErrorResponse;
      const warning = describeProviderError(response.status, providerError.message);
      logger.error('Resend rejected the briefing email', {
        briefingId,
        status: response.status,
        name: providerError.name,
        message: providerError.message,
      });

      return { sent: false, warning };
    }

    const messageId = (body as Partial<IResendSuccessResponse>).id;

    if (typeof messageId !== 'string' || messageId.trim() === '') {
      logger.error('Resend did not confirm the briefing email', {
        briefingId,
        status: response.status,
        bodyKeys: Object.keys(body),
      });

      return { sent: false, warning: emailErrors.PROVIDER_UNCONFIRMED };
    }

    logger.info('Briefing email sent', { briefingId, messageId });
    await this._recordSend(briefingId, messageId);

    return { sent: true, messageId };
  }

  private async _recordSend(briefingId: string, messageId: string): Promise<void> {
    try {
      await this._firestore
        .collection(collections.BRIEFINGS)
        .doc(briefingId)
        .update({ sentAt: Timestamp.now(), providerMessageId: messageId });
    } catch (error) {
      logger.error('Briefing was sent but sentAt could not be saved', { briefingId, error: this._messageOf(error) });
    }
  }

  private async _resolveRecipientEmail(userId: string, profileEmail: string | undefined): Promise<string> {
    try {
      const authUser = await getAuth().getUser(userId);

      if (authUser.email) {
        return authUser.email;
      }
    } catch (error) {
      logger.warn('Could not read the Auth email, using the profile email', { userId, error: this._messageOf(error) });
    }

    return profileEmail ?? '';
  }

  private _readApiKey(): string {
    try {
      return RESEND_API_KEY.value().trim();
    } catch (error) {
      logger.warn('RESEND_API_KEY is not available', { error: this._messageOf(error) });

      return '';
    }
  }

  private async _readJson(response: Response): Promise<object> {
    try {
      const parsed: unknown = await response.json();

      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  private _fail(briefingId: string, warning: string): ISendOutcome {
    logger.error('Briefing email not sent', { briefingId, warning });

    return { sent: false, warning };
  }

  private _messageOf(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
