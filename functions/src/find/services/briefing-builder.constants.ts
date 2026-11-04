export const briefingBuilder = {
  MILLISECONDS_PER_HOUR: 60 * 60 * 1000,
  MILLISECONDS_PER_DAY: 24 * 60 * 60 * 1000,
  MAX_BATCH_WRITES: 400,
} as const;

export const briefingErrors = {
  NO_NOTES: 'You have no open notes yet, so there was nothing to look for. Add a note and try again.',
  NO_ITEMS: 'We could not find any papers or posts for your open notes right now. Please try again in a few minutes.',
} as const;
