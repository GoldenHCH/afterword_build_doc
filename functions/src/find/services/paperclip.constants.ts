export const paperclipApi = {
  BASE_URL: 'https://paperclip.gxl.ai/api/v1',
  SEARCH_PATH: '/search',
  API_KEY_HEADER: 'X-API-Key',
  SOURCES: ['abstracts'],
  MAX_RESULTS: 200,
  ABSTRACT_WORDS: 60,
  TIMEOUT_MS: 20000,
} as const;
