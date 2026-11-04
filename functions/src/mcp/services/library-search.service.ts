import { getFirestore } from 'firebase-admin/firestore';

import { collections } from '../../constants';
import { rankLibraryItems, toSearchLibraryItem } from '../library-search.helper';
import { IParsedSearchLibrary } from '../mcp.interfaces';

export class LibrarySearchService {
  private readonly _firestore = getFirestore();

  public async search(request: IParsedSearchLibrary): Promise<Afterword.Types.ISearchLibraryItem[]> {
    let libraryQuery = this._firestore.collection(collections.LIBRARY).where('userId', '==', request.userId);

    if (request.noteId) {
      libraryQuery = libraryQuery.where('noteId', '==', request.noteId);
    }

    const snapshot = await libraryQuery.orderBy('savedAt', 'desc').get();

    const items = snapshot.docs.map((document) =>
      toSearchLibraryItem({ ...(document.data() as Afterword.Firestore.Library.ILibraryItem), id: document.id }),
    );

    return rankLibraryItems(items, request.query, request.limit);
  }
}
