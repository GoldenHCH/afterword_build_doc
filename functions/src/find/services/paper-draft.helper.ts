import { IItemDraft } from './item-draft.types';
import { IPaperQuery } from './paper-source.interfaces';

export function keepWithinQuery(drafts: IItemDraft[], query: IPaperQuery): IItemDraft[] {
  return drafts.filter((draft) => draft.publishedAt.toDate() >= query.publishedAfter).slice(0, query.limit);
}
