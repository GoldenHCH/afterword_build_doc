import { IItemDraft } from './item-draft.types';

export interface IPostQuery {
  handles: string[];
  since: Date;
  limit: number;
}

export interface IPostSource {
  recent(query: IPostQuery): Promise<IItemDraft[]>;
}
