import { IItemDraft } from './item-draft.types';

export interface IScorableNote {
  keywords: string[];
}

export interface IScorableItem {
  title: string;
  text: string;
  publishedAt: { toMillis(): number };
  sourceRank?: number;
}

export interface IFallbackNote {
  summary: string;
  angle?: string | null;
}

export interface IScoredCandidate {
  itemId: string;
  item: Afterword.Firestore.Item.IItem;
  score: number;
  matchedKeywords: string[];
  handleTopic?: string;
}

export interface INoteCandidates<TCandidate> {
  noteId: string;
  candidates: TCandidate[];
}

export interface ISourceResult {
  drafts: IItemDraft[];
  succeeded: boolean;
  label: string;
}

export interface IGatheredItem {
  itemId: string;
  item: Afterword.Firestore.Item.IItem;
  sourceRank: number;
}

export interface IGatheredNote {
  items: IGatheredItem[];
  failedSources: string[];
}
