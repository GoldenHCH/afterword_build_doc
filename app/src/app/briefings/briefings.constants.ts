export const briefingsCopy = {
  TITLE: 'Your briefing',
  SUBTITLE_EMPTY: "Papers and posts for what you're stuck on, in reading order",
  SUBTITLE_BUILT: 'Built',
  SUBTITLE_EMAILED: 'A copy is in your inbox.',
  SUBTITLE_BUILDING: 'Building your new briefing now',
  BUILD_LABEL: 'Build my briefing now',
  BUILD_AGAIN_LABEL: 'Build a new briefing',
  BUILD_STAGES: [
    'Finding papers and posts for your notes. About a minute or two.',
    'Putting what we found in reading order.',
    'Writing why each one matters. Almost there.',
  ],
  BUILDING_LABEL: 'Building your briefing',
  NO_BRIEFING: 'No briefing yet. Build one from your open notes.',
  NO_BRIEFING_KICKER: 'No briefing yet',
  NO_BRIEFING_TITLE: 'Build your first briefing',
  NO_BRIEFING_TEXT: 'Afterword reads your open notes, finds the papers and posts that answer them, and puts them in the order to read. It takes a minute or two, and the same briefing arrives by email.',
  NOT_FOUND_KICKER: 'Briefing not found',
  FAILED_KICKER: 'This briefing did not finish',
  FAILED_RETRY: 'Try again',
  FAILED_TEXT: 'Building again starts the search from scratch.',
  LOADING: 'Loading your briefing',
  WHY_THIS: 'Why this',
  SECTION_FOR: 'For your note',
  TO_READ: 'to read',
  INTRO: 'Read each section top to bottom. Save what helps; your assistant can search it later.',
  NOT_FOUND: 'We could not find that briefing. Build a new one from your open notes.',
  BUILDING: 'Your briefing is being built. About a minute or two.',
  FAILED_FALLBACK: 'We could not reach the paper search in time. Your notes and last briefing are safe. Try again.',
  NO_ENTRIES: 'This briefing has no entries. None of your open notes turned up anything to read yet.',
  LOAD_ERROR: 'We could not load your briefing. Refresh the page and try again.',
  BUILD_ERROR: 'We could not build your briefing. Please try again.',
  BUILD_TIMEOUT: 'Building is taking longer than usual. Check this page again in a minute.',
  SAVE_ERROR: 'We could not save that item. Please try again.',
  UNSAVE_ERROR: 'We could not remove that item from your Library. Please try again.',
  SAVE_LINK_MISSING: 'That item is not in this briefing, so it was not saved.',
  SAVE: 'Save',
  SAVED: 'Saved to Library',
  SAVED_NOTICE: 'Saved to your Library. Your assistant can search it now.',
  VIEW_LIBRARY: 'View Library',
  AUTHORS_ET_AL: 'et al.',
  PAPER: 'Paper',
  POST: 'Post',
} as const;

export const briefingsConfig = {
  STAGE_SECONDS: [0, 25, 60],
  BUILD_TIMEOUT_MS: 330000,
  MAX_AUTHORS: 3,
  ENTRY_ID_PREFIX: 'entry-',
  SAVE_QUERY_PARAM: 'save',
} as const;

export const backendErrorCodes = {
  UNAUTHENTICATED: 'functions/unauthenticated',
  INTERNAL: 'functions/internal',
  NOT_FOUND: 'functions/not-found',
  PERMISSION_DENIED: 'functions/permission-denied',
  INVALID_ARGUMENT: 'functions/invalid-argument',
} as const;

export const deadlineExceededCode = 'functions/deadline-exceeded';

export const entryKindIcons = {
  paper: 'article',
  post: 'forum',
} as const;

export const backendCodeOnlyMessage = /^[a-z-]+( \[\d+\])?$/;

export const noNotesBackendMessage = /no open notes/i;
