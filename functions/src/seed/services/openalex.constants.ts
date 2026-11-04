export const openAlexQuery = {
  BASE_URL: 'https://api.openalex.org/works',
  MAILTO: 'hello@afterword.fyi',
  PER_PAGE: 10,
  YEARS_BACK: 3,
  MAX_SEARCH_WORDS: 10,
  ABSTRACT_WORDS: 60,
  WORK_TYPES: ['article', 'conference-paper', 'preprint', 'book-chapter', 'book', 'review', 'dissertation', 'report'],
  SELECT_FIELDS: ['id', 'doi', 'title', 'publication_year', 'publication_date', 'authorships', 'abstract_inverted_index'],
  STOP_WORDS: [
    'a', 'about', 'acts', 'after', 'all', 'also', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'been', 'but', 'by',
    'can', 'could', 'did', 'do', 'does', 'for', 'from', 'had', 'has', 'have', 'how', 'if', 'in', 'including', 'into',
    'is', 'it', 'its', 'make', 'makes', 'may', 'more', 'most', 'of', 'on', 'or', 'our', 'should', 'than', 'that',
    'the', 'their', 'them', 'then', 'there', 'these', 'this', 'to', 'use', 'used', 'using', 'was', 'we', 'what',
    'when', 'where', 'which', 'while', 'who', 'why', 'will', 'with', 'within', 'without', 'would',
  ],
} as const;
