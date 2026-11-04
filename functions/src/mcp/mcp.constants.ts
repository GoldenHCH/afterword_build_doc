export const mcpAuth = {
  KEY_HEADER: 'x-afterword-key',
} as const;

export const mcpLimits = {
  ANGLE_MIN_LENGTH: 3,
  ANGLE_MAX_LENGTH: 500,
  KEYWORDS_MAX_COUNT: 8,
  KEYWORD_MAX_LENGTH: 60,
  PAPERS_DEFAULT_LIMIT: 5,
  PAPERS_MAX_LIMIT: 10,
  QUERY_MAX_LENGTH: 300,
  LIBRARY_DEFAULT_LIMIT: 10,
  LIBRARY_MAX_LIMIT: 50,
  LIBRARY_SCAN_LIMIT: 200,
  QUERY_WORD_MIN_LENGTH: 2,
} as const;

export const mcpErrors = {
  METHOD_NOT_ALLOWED: 'Send a POST request with a JSON body.',
  UNAUTHORIZED: 'Unauthorized',
  BODY_REQUIRED: 'Send a JSON object as the request body.',
  ANGLE_REQUIRED: 'Describe what to search for in "angle", between 3 and 500 characters.',
  KEYWORDS_INVALID: 'Send "keywords" as up to 8 short words or phrases, 60 characters each at most.',
  PAPERS_LIMIT_INVALID: 'Send "limit" as a whole number from 1 to 10.',
  USER_ID_REQUIRED: 'Send the "userId" of the account whose Library to search.',
  NOTE_ID_INVALID: 'Send "noteId" as the id of one of the account\'s notes.',
  QUERY_INVALID: 'Send "query" as plain words, 300 characters at most.',
  LIBRARY_LIMIT_INVALID: 'Send "limit" as a whole number from 1 to 50.',
  PAPER_SEARCH_FAILED: 'The paper search did not answer. Try again in a minute.',
  LIBRARY_SEARCH_FAILED: 'The Library search did not answer. Try again in a minute.',
} as const;
