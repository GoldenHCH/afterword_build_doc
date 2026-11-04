import { IItemDraft } from './item-draft.types';

export interface IPaperQuery {
  angle: string;
  keywords: string[];
  limit: number;
  publishedAfter: Date;
}

export interface IPaperSource {
  search(query: IPaperQuery): Promise<IItemDraft[]>;
}
