import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';

import { collections } from '../constants';
import { LibraryError } from './library.error';
import { libraryErrors } from './library.constants';
import { findBriefingEntry } from './library.helper';

export class LibraryWriterService {
  private readonly _firestore = getFirestore();

  public async save(userId: string, briefingId: string, itemId: string): Promise<string> {
    const briefingSnapshot = await this._firestore.collection(collections.BRIEFINGS).doc(briefingId).get();

    if (!briefingSnapshot.exists) {
      throw new LibraryError('not-found', libraryErrors.BRIEFING_NOT_FOUND);
    }

    const briefing = briefingSnapshot.data() as Afterword.Firestore.Briefing.IBriefing;

    if (briefing.userId !== userId) {
      throw new LibraryError('permission-denied', libraryErrors.NOT_YOURS);
    }

    const match = findBriefingEntry(briefing, itemId);

    if (!match) {
      throw new LibraryError('not-found', libraryErrors.ITEM_NOT_FOUND);
    }

    const existing = await this._firestore
      .collection(collections.LIBRARY)
      .where('userId', '==', userId)
      .where('itemId', '==', itemId)
      .limit(1)
      .get();

    if (!existing.empty) {
      return existing.docs[0].id;
    }

    const { section, entry } = match;
    const keywords = await this._loadKeywords(section.noteId);

    const libraryItem: Afterword.Firestore.Library.ILibraryItem = {
      kind: entry.kind,
      title: entry.title,
      url: entry.url,
      authors: entry.authors,
      publishedAt: entry.publishedAt,
      ...(entry.sourceHandle ? { sourceHandle: entry.sourceHandle } : {}),
      userId,
      itemId,
      noteId: section.noteId,
      noteSummary: section.noteSummary,
      briefingId,
      keywords,
      whyThis: entry.whyThis,
      savedAt: Timestamp.now(),
    };

    const reference = await this._firestore.collection(collections.LIBRARY).add(libraryItem);

    logger.info('Saved item to library', { userId, briefingId, itemId, libraryItemId: reference.id });

    return reference.id;
  }

  public async unsave(userId: string, libraryItemId: string): Promise<void> {
    const reference = this._firestore.collection(collections.LIBRARY).doc(libraryItemId);
    const snapshot = await reference.get();

    if (!snapshot.exists) {
      return;
    }

    const libraryItem = snapshot.data() as Afterword.Firestore.Library.ILibraryItem;

    if (libraryItem.userId !== userId) {
      throw new LibraryError('permission-denied', libraryErrors.NOT_YOURS);
    }

    await reference.delete();

    logger.info('Removed item from library', { userId, libraryItemId });
  }

  private async _loadKeywords(noteId: string): Promise<string[]> {
    const snapshot = await this._firestore.collection(collections.NOTES).doc(noteId).get();

    if (!snapshot.exists) {
      return [];
    }

    const { keywords } = snapshot.data() as Afterword.Firestore.Note.INote;

    return Array.isArray(keywords) ? keywords : [];
  }
}
