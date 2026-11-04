import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { LibraryError } from '../library.error';
import { libraryErrors } from '../library.constants';
import { isDocumentId } from '../library.helper';
import { LibraryWriterService } from '../library-writer.service';

export const saveItem = onCall<Afterword.Types.ISaveItemRequest, Promise<Afterword.Types.ISaveItemResponse>>(
  { timeoutSeconds: 30 },
  async (request) => {
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError('unauthenticated', libraryErrors.SIGN_IN);
    }

    const briefingId = request.data?.briefingId;
    const itemId = request.data?.itemId;

    if (!isDocumentId(briefingId)) {
      throw new HttpsError('invalid-argument', libraryErrors.BRIEFING_ID_REQUIRED);
    }

    if (!isDocumentId(itemId)) {
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
