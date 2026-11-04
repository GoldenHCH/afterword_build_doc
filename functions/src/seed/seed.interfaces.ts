import { ItemKind, ItemProvider } from '../shared/item.types';
import { NoteKind } from '../shared/note.types';

export interface ISeedNote {
  key: string;
  kind: NoteKind;
  summary: string;
  detail: string;
  angle: string;
  keywords: string[];
  project: string | null;
}

export interface ISeedSource {
  handle: string;
  displayName: string;
  topics: string[];
  weight: number;
}

export interface ISeedPost {
  externalId: string;
  url: string;
  handle: string;
  authors: string[];
  text: string;
  publishedAt: string;
  provider: ItemProvider;
}

export interface ISeedBriefingEntry {
  kind: ItemKind;
  externalId: string;
  url: string;
  title: string;
  authors: string[];
  publishedAt: string;
  sourceHandle: string | null;
  text: string;
  provider: ItemProvider;
  rank: number;
  score: number;
  whyThis: string;
  readingNote?: string | null;
}

export interface ISeedBriefingSection {
  noteKey: string;
  entries: ISeedBriefingEntry[];
}

export interface ISeedBriefing {
  sections: ISeedBriefingSection[];
}

export interface ISeedResult extends Afterword.Types.ISeedDemoResponse {
  briefingSections: number;
  briefingEntries: number;
  openAlexPapers: number;
}
