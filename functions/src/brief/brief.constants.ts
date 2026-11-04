export const explainConfig = {
  MODEL: 'claude-sonnet-5-5',
  MAX_ENTRIES_PER_CALL: 8,
  MAX_TOKENS: 2000,
  API_URL: 'https://api.anthropic.com/v1/messages',
  API_VERSION: '2023-06-01',
  WHY_THIS_MAX_WORDS: 25,
  WHY_THIS_ACCEPT_MAX_WORDS: 40,
  READING_NOTE_MAX_WORDS: 12,
  READING_NOTE_ACCEPT_MAX_WORDS: 20,
  MIN_TRIMMED_WORDS: 5,
  PROMPT_TEXT_MAX_WORDS: 120,
  TIMEOUT_MS: 45_000,
  MAX_ATTEMPTS: 2,
} as const;

export const explainPrompts = {
  SYSTEM: [
    'You write the explanations in a weekly reading briefing for a researcher.',
    'The researcher told their AI assistant what they are working on or stuck on (the note).',
    'A scoring step has already chosen which papers and posts are in the briefing. You only explain each one and put them in reading order. You never add, drop or rename an entry.',
    '',
    'For every entry write:',
    '- whyThis: at most {{WHY_THIS_MAX_WORDS}} words, second person ("you", "your"). Name the researcher\'s concrete bottleneck from the note and say what this entry gives them. Claim only what the entry text supports. No hedging words such as might, may, could, perhaps or possibly when the note kind is stuck or working_on. When the note kind is question, you may use one hedge in the line if the evidence is partial.',
    '- readingNote: at most {{READING_NOTE_MAX_WORDS}} words on why the entry sits at its position, for example "Start here: defines the measure" or "After #1: applies it to interviews".',
    '',
    'Order: papers first, foundational before applied. Each post goes right after the paper it relates to, or last if it relates to none. "order" lists every itemId exactly once.',
    'Copy every itemId exactly as given.',
    'Use plain hyphens or commas. Never use em dashes or en dashes. Never use the word "free".',
    '',
    'Reply with one JSON object and nothing else, no code fence, no commentary:',
    '{"entries":[{"itemId":"...","whyThis":"...","readingNote":"..."}],"order":["itemId","itemId"]}',
  ].join('\n'),
  USER_TEMPLATE: [
    'Note:',
    '{{NOTE_JSON}}',
    '',
    'Entries ({{ENTRY_COUNT}}):',
    '{{ENTRIES_JSON}}',
  ].join('\n'),
} as const;

export const explainWarnings = {
  UNAVAILABLE:
    'Your briefing is ready, but the one-line explanations could not be written this time, so it shows keyword matches instead.',
  PARTIAL:
    'Your briefing is ready, but some notes could not get written explanations this time, so they show keyword matches instead.',
  NOT_FOUND: 'We could not find that briefing, so there was nothing to explain.',
  NOTHING_TO_EXPLAIN: 'This briefing has no papers or posts to explain.',
} as const;

export const explainErrors = {
  MISSING_KEY: 'The Anthropic API key is not available.',
  REQUEST_FAILED: 'The Anthropic request failed',
  TIMED_OUT: 'The Anthropic request timed out',
  EMPTY_REPLY: 'The Anthropic reply had no text',
} as const;

export const explainPatterns = {
  FENCE: /```(?:json)?\s*([\s\S]*?)```/i,
  DASH: /\s*[\u2013\u2014]\s*/g,
  SENTENCE_END: /[.!?]["')\]]*$/,
  CLAUSE_END: /[,;]$/,
  TRAILING_PUNCTUATION: /[,;:\-\s]+$/,
} as const;

export const danglingWords = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'because',
  'both',
  'but',
  'by',
  'for',
  'from',
  'if',
  'in',
  'into',
  'of',
  'on',
  'or',
  'so',
  'than',
  'that',
  'the',
  'then',
  'to',
  'which',
  'while',
  'who',
  'with',
  'yet',
]);
