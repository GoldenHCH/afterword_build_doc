import { mcpLimits } from './mcp.constants';

const wordSeparator = /[^\p{L}\p{N}]+/u;

export function extractQueryWords(query: string): string[] {
  const words = query
    .toLowerCase()
    .split(wordSeparator)
    .filter((word) => word.length >= mcpLimits.QUERY_WORD_MIN_LENGTH);

  return [...new Set(words)];
}

export function toSearchLibraryItem(
  libraryItem: Afterword.Firestore.Library.ILibraryItem,
): Afterword.Types.ISearchLibraryItem {
  const item: Afterword.Types.ISearchLibraryItem = {
    id: libraryItem.id ?? '',
    itemId: libraryItem.itemId,
    kind: libraryItem.kind,
    title: libraryItem.title,
    url: libraryItem.url,
    authors: libraryItem.authors,
    publishedAt: libraryItem.publishedAt.toDate().toISOString(),
    keywords: libraryItem.keywords ?? [],
    whyThis: libraryItem.whyThis,
    savedAt: libraryItem.savedAt.toDate().toISOString(),
  };

  if (libraryItem.sourceHandle) {
    item.sourceHandle = libraryItem.sourceHandle;
  }

  if (libraryItem.noteId) {
    item.noteId = libraryItem.noteId;
  }

  if (libraryItem.noteSummary) {
    item.noteSummary = libraryItem.noteSummary;
  }

  if (libraryItem.briefingId) {
    item.briefingId = libraryItem.briefingId;
  }

  return item;
}

export function rankLibraryItems(
  items: Afterword.Types.ISearchLibraryItem[],
  query: string,
  limit: number,
): Afterword.Types.ISearchLibraryItem[] {
  const queryWords = extractQueryWords(query);

  if (query.trim().length > 0 && queryWords.length === 0) {
    return [];
  }

  const scored = items.map((item) => {
    const haystack = [item.title, item.whyThis, item.noteSummary ?? '', item.keywords.join(' ')].join(' ').toLowerCase();
    const matches = queryWords.filter((word) => haystack.includes(word)).length;

    return { item, matches, savedAtTime: Date.parse(item.savedAt) };
  });

  const candidates = queryWords.length > 0 ? scored.filter((entry) => entry.matches > 0) : scored;

  return candidates
    .sort((first, second) => second.matches - first.matches || second.savedAtTime - first.savedAtTime)
    .slice(0, limit)
    .map((entry) => entry.item);
}
