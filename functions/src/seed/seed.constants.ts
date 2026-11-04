export const seedConfig = {
  BRIEFING_ID: 'briefing_demo_seed',
  NOTE_ID_PREFIX: 'note_',
  OPENALEX_PAPERS_PER_NOTE: 5,
  NOTE_AGE_DAYS: [1, 3, 6],
  MILLISECONDS_PER_DAY: 24 * 60 * 60 * 1000,
  MAX_BATCH_WRITES: 400,
} as const;
