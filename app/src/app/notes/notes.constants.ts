export const notesCopy = {
  TITLE: 'Notes',
  SUBTITLE: "What you're working on and stuck on, from your assistant and from here",
  DESCRIBE_BUTTON: 'Describe instead',
  RESOLVE_BUTTON: 'Resolve',
  EMPTY: "Nothing here yet. Tell your assistant what you're stuck on, or describe it here.",
  LOAD_ERROR: "We couldn't load your notes. Check your connection and refresh.",
  RESOLVE_ERROR: "We couldn't resolve that note. Please try again.",
} as const;

export const describePanelCopy = {
  TITLE: 'Describe instead',
  TEXT_LABEL: 'What are you working on?',
  TEXT_HINT: "One or two sentences on what you're working on, or where you're stuck.",
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
  mcp: { icon: 'chat_bubble_outline', tooltip: 'From your assistant' },
  app: { icon: 'edit_note', tooltip: 'Typed here' },
} as const;

export const humanCallableErrorCodes = [
  'functions/unauthenticated',
  'functions/invalid-argument',
  'functions/unavailable',
  'functions/internal',
  'functions/not-found',
  'functions/permission-denied',
] as const;
