import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { LibraryError } from '../library.error';
import { libraryErrors } from '../library.constants';
import { LibraryWriterService } from '../library-writer.service';

export const saveItem = onCall<Afterword.Types.ISaveItemRequest, Promise<Afterword.Types.ISaveItemResponse>>(
  { timeoutSeconds: 30 },
  async (request) => {
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError('unauthenticated', libraryErrors.SIGN_IN);
    }

    const briefingId = typeof request.data?.briefingId === 'string' ? request.data.briefingId.trim() : '';
    const itemId = typeof request.data?.itemId === 'string' ? request.data.itemId.trim() : '';

    if (!briefingId) {
      throw new HttpsError('invalid-argument', libraryErrors.BRIEFING_ID_REQUIRED);
    }

    if (!itemId) {
      throw new HttpsError('invalid-argument', libraryErrors.ITEM_ID_REQUIRED);
    }

    try {
      const libraryItemId = await new LibraryWriterService().save(userId, briefingId, itemId);

      return { libraryItemId };
    } catch (error) {
      if (error instanceof LibraryError) {
        throw new HttpsError(error.failure, error.message);
      }

      logger.error('saveItem failed', {
        userId,
        briefingId,
        itemId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new HttpsError('internal', libraryErrors.SAVE_FAILED);
    }
  },
);
