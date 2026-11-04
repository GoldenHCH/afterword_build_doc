export interface IScorableNote {
  keywords: string[];
}

export interface IScorableItem {
  title: string;
  text: string;
  publishedAt: { toMillis(): number };
}

export interface IScoredCandidate {
  itemId: string;
  item: Afterword.Firestore.Item.IItem;
  score: number;
  matchedKeywords: string[];
}

export interface INoteCandidates<TCandidate> {
  noteId: string;
  candidates: TCandidate[];
}

export interface IGatheredItem {
  itemId: string;
  item: Afterword.Firestore.Item.IItem;
}
