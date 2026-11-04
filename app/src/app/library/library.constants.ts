export const libraryCopy = {
  TITLE: 'Library',
  SUBTITLE: 'What you saved, and what your assistant can search',
  EMPTY: 'Save something from your briefing and it shows up here, and in your assistant.',
  EMPTY_KICKER: 'Nothing saved yet',
  EMPTY_TITLE: 'Save what helps from your briefing',
  EMPTY_EXAMPLE: '“What did I save about intercoder reliability?”',
  EMPTY_HINT: 'Then ask your assistant about it:',
  LOADING: 'Loading your library',
  GROUP_KICKER: 'For your note',
  COUNT_ONE: 'saved item. Your assistant can search it.',
  COUNT_MANY: 'saved items. Your assistant can search them.',
  SAVED_ON: 'Saved',
  EMPTY_LINK: 'Go to your briefing',
  LOAD_ERROR: "We couldn't load your library. Check your connection and refresh.",
  REMOVE_ERROR: "We couldn't remove that item. Please try again.",
  REMOVE_BUTTON: 'Remove',
  OTHER_GROUP: 'Other saves',
  ET_AL: 'et al.',
} as const;

export const libraryFilters = [
  { value: 'all', label: 'All' },
  { value: 'paper', label: 'Papers' },
  { value: 'post', label: 'Posts' },
] as const;

export const filteredEmptyCopy = {
  paper: 'No papers saved yet.',
  post: 'No posts saved yet.',
} as const;

export const itemKindIcons = {
  paper: 'article',
  post: 'forum',
} as const;

export const itemKindNames = {
  paper: 'Paper',
  post: 'Post',
} as const;

export const maxListedAuthors = 3;
