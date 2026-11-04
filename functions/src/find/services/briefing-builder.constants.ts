export const briefingBuilder = {
  MILLISECONDS_PER_HOUR: 60 * 60 * 1000,
  MILLISECONDS_PER_DAY: 24 * 60 * 60 * 1000,
  MAX_BATCH_WRITES: 400,
} as const;

export const keywordMatching = {
  MIN_STEM_LENGTH: 3,
  SUFFIXES: ['ations', 'ation', 'ing', 'ers', 'er', 'ed', 'es', 'ly', 's'],
  KEEP_S_AFTER: ['ss', 'is', 'us'],
} as const;

export const sourceLabels = {
  PAPERS: 'papers',
  POSTS: 'X posts',
} as const;

export const briefingWarnings = {
  SOURCES_UNAVAILABLE_PREFIX: 'Some sources could not be reached, so this briefing may be thinner than usual: ',
  SOURCES_UNAVAILABLE_SUFFIX: '. Try again in a few minutes.',
} as const;

export const fallbackLines = {
  ANGLE_MAX_WORDS: 10,
  MATCHES_TEMPLATE: 'Matches your note on {{ANGLE}}: shares {{KEYWORDS}}',
  RECENT_POST_TEMPLATE: 'Recent from @{{HANDLE}}, who posts about {{TOPIC}}',
  RECENT_POST_NO_TOPIC_TEMPLATE: 'Recent from @{{HANDLE}}, for your note on {{ANGLE}}',
  PAPER_TEMPLATE: 'Paper for your note on {{ANGLE}}',
  START_HERE: 'Start here',
  THEN_THIS: 'Then this',
} as const;

export const briefingErrors = {
  NO_NOTES: 'You have no open notes yet, so there was nothing to look for. Add a note and try again.',
  NO_ITEMS: 'We could not find any papers or posts for your open notes right now. Please try again in a few minutes.',
} as const;
