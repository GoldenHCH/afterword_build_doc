import { getFirestore } from 'firebase-admin/firestore';

import { collections } from '../../constants';
import { seededPostCutoff } from '../find.constants';
import { itemKinds, itemProviders } from '../../shared/item.constants';
import { IItemDraft } from './item-draft.types';
import { IPostQuery, IPostSource } from './post-source.interfaces';

export class SeededPostSource implements IPostSource {
  private readonly _firestore = getFirestore();

  public async recent(query: IPostQuery): Promise<IItemDraft[]> {
    const snapshot = await this._firestore
      .collection(collections.ITEMS)
      .where('kind', '==', itemKinds.POST)
      .where('provider', 'in', [itemProviders.X, itemProviders.SEED])
      .get();

    const allowedHandles = new Set(query.handles);
    const cutoffMillis = Date.now() - seededPostCutoff.DAYS_BACK * seededPostCutoff.MILLISECONDS_PER_DAY;
    const items = snapshot.docs.map((document) => document.data() as Afterword.Firestore.Item.IItem);

    return items
      .filter((item) => item.publishedAt.toMillis() >= cutoffMillis)
      .filter((item) => allowedHandles.size === 0 || (item.sourceHandle !== undefined && allowedHandles.has(item.sourceHandle)))
      .sort((first, second) => second.publishedAt.toMillis() - first.publishedAt.toMillis())
      .slice(0, query.limit)
      .map((item) => this._toDraft(item));
  }

  private _toDraft(item: Afterword.Firestore.Item.IItem): IItemDraft {
    const { id, fetchedAt, ...draft } = item;

    return draft;
  }
}
