import { PaperSourceName, PostSourceName } from './find.types';

export const contentSources: { PAPER: PaperSourceName; POST: PostSourceName } = {
  PAPER: 'openalex',
  POST: 'seed',
};

export const findLimits = {
  PAPERS_PER_NOTE_QUERY: 15,
  POSTS_PER_NOTE_QUERY: 30,
  PAPERS_KEPT_PER_NOTE: 5,
  POSTS_KEPT_PER_NOTE: 3,
  PAPER_YEARS_BACK: 3,
  PAPER_YEARS_BACK_FOUNDATIONAL: 8,
  POST_DAYS_BACK: 14,
  FETCH_COOLDOWN_HOURS: 24,
} as const;

export const seededPostWindow = {
  DAYS_BACK: 180,
} as const;

export const foundationalNoteKinds: readonly string[] = ['stuck', 'question'];

export const scoringWeights = {
  RECENCY: 0.15,
  KEYWORD_OVERLAP: 0.35,
  SOURCE: 0.15,
  SOURCE_RANK: 0.35,
  RECENCY_HORIZON_DAYS: 365,
  PAPER_SOURCE_WEIGHT: 0.7,
} as const;
