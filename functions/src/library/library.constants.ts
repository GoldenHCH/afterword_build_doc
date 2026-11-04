export const libraryErrors = {
  SIGN_IN: 'Please sign in to save items.',
  BRIEFING_ID_REQUIRED: 'Open a briefing and choose an item to save.',
  ITEM_ID_REQUIRED: 'Choose an item to save.',
  LIBRARY_ITEM_ID_REQUIRED: 'Choose a saved item to remove.',
  BRIEFING_NOT_FOUND: 'We could not find that briefing. Please refresh and try again.',
  ITEM_NOT_FOUND: 'That item is no longer in the briefing. Please refresh and try again.',
  ID_CONFLICT: 'That saved item could not be created because of an id conflict. Please try again in a minute.',
  NOT_YOURS: 'That belongs to a different account.',
  SAVE_FAILED: 'We could not save that item. Please try again in a minute.',
  UNSAVE_FAILED: 'We could not remove that item. Please try again in a minute.',
} as const;
