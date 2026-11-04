import { getFirestore, Timestamp } from 'firebase-admin/firestore';

import { collections } from '../../constants';
import { itemDocId } from '../../shared/item-id.helper';
import { briefingBuilder } from './briefing-builder.constants';
import { IItemDraft } from './item-draft.types';

export class ItemCacheService {
  private readonly _firestore = getFirestore();

  public async upsert(drafts: IItemDraft[]): Promise<string[]> {
    const fetchedAt = Timestamp.now();
    const itemIds = drafts.map((draft) => itemDocId(draft.kind, draft.externalId));

    for (let start = 0; start < drafts.length; start += briefingBuilder.MAX_BATCH_WRITES) {
      const batch = this._firestore.batch();

      drafts.slice(start, start + briefingBuilder.MAX_BATCH_WRITES).forEach((draft, offset) => {
        const reference = this._firestore.collection(collections.ITEMS).doc(itemIds[start + offset]);
        batch.set(reference, { ...draft, fetchedAt }, { merge: true });
      });

      await batch.commit();
    }

    return itemIds;
  }

  public async loadByIds(itemIds: string[]): Promise<Afterword.Firestore.Item.IItem[]> {
    if (itemIds.length === 0) {
      return [];
    }

    const references = itemIds.map((itemId) => this._firestore.collection(collections.ITEMS).doc(itemId));
    const snapshots = await this._firestore.getAll(...references);

    return snapshots
      .filter((snapshot) => snapshot.exists)
      .map((snapshot) => ({ ...(snapshot.data() as Afterword.Firestore.Item.IItem), id: snapshot.id }));
  }
}
