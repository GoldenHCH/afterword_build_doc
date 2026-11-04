export const notesCopy = {
  TITLE: 'Notes',
  SUBTITLE: "What you're working on and stuck on, from your assistant and from here",
  DESCRIBE_BUTTON: 'Describe your work',
  RESOLVE_BUTTON: 'Resolve',
  LOADING: 'Loading your notes',
  EMPTY_KICKER: 'No open notes',
  EMPTY_TITLE: 'Tell your assistant what you are stuck on',
  EMPTY: 'Your assistant saves a note while you work. Each open note gets its own section in your next briefing. You can also describe your work here.',
  EMPTY_EXAMPLE: '“Remember that I am stuck on getting a second coder to agree with me on my interview codes.”',
  COUNT_ONE: 'open note. It gets its own section in your next briefing.',
  COUNT_MANY: 'open notes. Each gets its own section in your next briefing.',
  LOAD_ERROR: "We couldn't load your notes. Check your connection and refresh.",
  RESOLVE_ERROR: "We couldn't resolve that note. Please try again.",
} as const;

export const describePanelCopy = {
  TITLE: 'Describe your work',
  TEXT_LABEL: 'What are you working on?',
  TEXT_HINT: "One or two sentences on what you're working on, or where you're stuck.",
  DESCRIBE_INTRO: 'Write it the way you would tell a colleague. Afterword turns it into a note you can check before saving.',
  DRAFT_INTRO: 'Check the note before you save it. Your next briefing gets a section for it.',
  TEXT_REQUIRED: 'Tell us a little about your work.',
  TEXT_TOO_SHORT: 'Add a few more words (at least 10 characters).',
  TEXT_TOO_LONG: 'Keep it under 2000 characters.',
  DESCRIBE_BUTTON: 'Describe',
  CANCEL_BUTTON: 'Cancel',
  BACK_BUTTON: 'Back',
  SAVE_BUTTON: 'Save note',
  KIND_LABEL: 'Kind',
  SUMMARY_LABEL: 'Summary',
  SUMMARY_REQUIRED: 'A note needs a summary.',
  SUMMARY_TOO_LONG: 'Keep the summary under 200 characters.',
  DETAIL_LABEL: 'Detail',
  ANGLE_LABEL: 'Angle',
  KEYWORDS_LABEL: 'Keywords',
  KEYWORDS_HINT: 'Separate with commas. Up to 8.',
  PROJECT_LABEL: 'Project',
  DESCRIBE_ERROR: "We couldn't turn that into a note. Please try again.",
  SAVE_ERROR: "We couldn't save the note. Please try again.",
} as const;

export const describeLimits = {
  MIN_TEXT_CHARS: 10,
  MAX_TEXT_CHARS: 2000,
  MAX_SUMMARY_CHARS: 200,
  MAX_KEYWORDS: 8,
} as const;

export const noteKindOptions = [
  { value: 'stuck', label: 'Stuck' },
  { value: 'working_on', label: 'Working on' },
  { value: 'question', label: 'Question' },
] as const;

export const noteSourceDisplay = {
  mcp: { icon: 'forum', label: 'From your assistant' },
  app: { icon: 'edit_note', label: 'Typed here' },
} as const;

export const humanCallableErrorCodes = [
  'functions/unauthenticated',
  'functions/invalid-argument',
  'functions/unavailable',
  'functions/internal',
  'functions/not-found',
  'functions/permission-denied',
] as const;

export const codeOnlyMessagePattern = /^[a-z-]+( \[\d+\])?$/;
