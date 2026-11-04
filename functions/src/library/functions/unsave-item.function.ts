import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { LibraryError } from '../library.error';
import { libraryErrors } from '../library.constants';
import { isDocumentId } from '../library.helper';
import { LibraryWriterService } from '../library-writer.service';

export const unsaveItem = onCall<Afterword.Types.IUnsaveItemRequest, Promise<Afterword.Types.IUnsaveItemResponse>>(
  { timeoutSeconds: 30 },
  async (request) => {
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError('unauthenticated', libraryErrors.SIGN_IN);
    }

    const libraryItemId = request.data?.libraryItemId;

    if (!isDocumentId(libraryItemId)) {
      throw new HttpsError('invalid-argument', libraryErrors.LIBRARY_ITEM_ID_REQUIRED);
    }

    try {
      await new LibraryWriterService().unsave(userId, libraryItemId);

      return {};
    } catch (error) {
      if (error instanceof LibraryError) {
        throw new HttpsError(error.failure, error.message);
      }

      logger.error('unsaveItem failed', {
        userId,
        libraryItemId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new HttpsError('internal', libraryErrors.UNSAVE_FAILED);
    }
  },
);
