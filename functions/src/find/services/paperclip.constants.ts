export const paperclipApi = {
  BASE_URL: 'https://paperclip.gxl.ai/api/v1',
  SEARCH_PATH: '/search',
  API_KEY_HEADER: 'X-API-Key',
  SOURCES: ['abstracts'],
  MAX_RESULTS: 200,
  ABSTRACT_WORDS: 60,
  TIMEOUT_MS: 20000,
} as const;

export const paperclipFields = {
  HITS: 'papers',
  ID: 'id',
  TITLE: 'title',
  URL: 'url',
  DOI: 'doi',
  ABSTRACT: 'abstract',
  PUBLISHED_DATE: 'published_date',
  YEAR: 'year',
  AUTHORS: 'authors',
} as const;
