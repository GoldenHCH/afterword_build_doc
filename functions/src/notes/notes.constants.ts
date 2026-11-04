export const describeWorkConfig = {
  MIN_TEXT_CHARS: 10,
  MAX_TEXT_CHARS: 2000,
  SUMMARY_MAX_WORDS: 25,
  DETAIL_MAX_WORDS: 60,
  ANGLE_MAX_WORDS: 30,
  MAX_KEYWORDS: 8,
  MIN_KEYWORDS: 2,
  MAX_ATTEMPTS: 2,
  MAX_TOKENS: 700,
  TIMEOUT_MS: 25_000,
} as const;

export const describeWorkPrompts = {
  SYSTEM: [
    'You turn what one researcher wrote about their work into one structured note.',
    'Use only what the text says. Never invent goals, results or details the text does not state.',
    '',
    'Fields:',
    '- kind: "working_on" (a task in progress), "stuck" (a problem they cannot solve) or "question" (an open question).',
    '- summary: at most {{SUMMARY_MAX_WORDS}} words, in the researcher\'s own terms.',
    '- detail: at most {{DETAIL_MAX_WORDS}} words of useful context from the text, or null when there is none.',
    '- angle: the research question a published paper could help with, at most {{ANGLE_MAX_WORDS}} words. Use null when only code, tooling or admin would help.',
    '- keywords: {{MIN_KEYWORDS}} to {{MAX_KEYWORDS}} terms a paper on that angle would use. An empty array when angle is null.',
    '- project: a short project name from the text, or null.',
    '',
    'Write plain words. Never use em dashes or en dashes. Never use the word "free".',
    '',
    'Reply with one JSON object and nothing else, no code fence, no commentary:',
    '{"kind":"stuck","summary":"...","detail":"...","angle":"...","keywords":["..."],"project":"..."}',
  ].join('\n'),
  USER_TEMPLATE: ['The researcher wrote:', '"""', '{{TEXT}}', '"""'].join('\n'),
} as const;

export const describeWorkErrors = {
  TEXT_REQUIRED: 'Tell us a little about what you are working on or stuck on, at least a sentence.',
  TEXT_TOO_LONG: 'That is a bit long. Please keep it under 2,000 characters.',
  SIGN_IN: 'Please sign in to describe your work.',
  UNAVAILABLE: 'We could not reach the assistant that reads your description. Please try again in a minute.',
  NOT_UNDERSTOOD: 'We could not turn that into a note. Try saying what you are working on or stuck on in one or two plain sentences.',
  MISSING_KEY: 'The Anthropic API key is not available.',
} as const;

export const describeWorkPatterns = {
  FENCE: /```(?:json)?\s*([\s\S]*?)```/i,
  DASH: /\s*[–—]\s*/g,
} as const;
