import { Timestamp } from 'firebase-admin/firestore';

import { IItemDraft } from '../../find/services/item-draft.types';
import { itemKinds, itemProviders } from '../../shared/item.constants';
import { openAlexQuery } from './openalex.constants';
import { IOpenAlexWork } from './openalex.interfaces';

export function extractContentWords(text: string, maxWords: number): string[] {
  const stopWords = new Set<string>(openAlexQuery.STOP_WORDS);
  const tokens = text.toLowerCase().split(/[^a-z0-9-]+/);
  const contentWords: string[] = [];

  for (const rawToken of tokens) {
    const token = rawToken.replace(/^-+|-+$/g, '');

    if (token.length > 2 && !stopWords.has(token) && !contentWords.includes(token)) {
      contentWords.push(token);
    }

    if (contentWords.length === maxWords) {
      break;
    }
  }

  return contentWords;
}

export function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function yearsBefore(date: Date, years: number): Date {
  const earlier = new Date(date.getTime());
  earlier.setUTCFullYear(earlier.getUTCFullYear() - years);

  return earlier;
}

export function buildOpenAlexWorksUrl(
  angle: string,
  fromPublicationDate: Date,
  perPage: number = openAlexQuery.PER_PAGE,
  apiKey: string = '',
): string {
  const searchText = extractContentWords(angle, openAlexQuery.MAX_SEARCH_WORDS).join(' ');
  const filter = [
    `from_publication_date:${formatIsoDate(fromPublicationDate)}`,
    'has_doi:true',
    'has_abstract:true',
    `type:${openAlexQuery.WORK_TYPES.join('|')}`,
  ].join(',');

  return (
    `${openAlexQuery.BASE_URL}?search=${encodeURIComponent(searchText)}` +
    `&filter=${filter}` +
    `&per-page=${perPage}` +
    `&select=${openAlexQuery.SELECT_FIELDS.join(',')}` +
    `&mailto=${openAlexQuery.MAILTO}` +
    (apiKey ? `&${openAlexQuery.API_KEY_PARAMETER}=${encodeURIComponent(apiKey)}` : '')
  );
}

export function rebuildAbstract(invertedIndex: Record<string, number[]> | null | undefined): string {
  if (!invertedIndex) {
    return '';
  }

  const wordsByPosition: string[] = [];

  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const position of positions) {
      wordsByPosition[position] = word;
    }
  }

  return wordsByPosition.filter((word) => word !== undefined).join(' ');
}

export function firstWords(text: string, wordCount: number): string {
  const words = text.split(/\s+/).filter((word) => word.length > 0);

  if (words.length <= wordCount) {
    return words.join(' ');
  }

  return `${words.slice(0, wordCount).join(' ')}…`;
}

export function normalizeDoi(doi: string | null | undefined): string | null {
  if (!doi) {
    return null;
  }

  const bareDoi = doi
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:/i, '')
    .toLowerCase();

  return bareDoi.startsWith('10.') ? bareDoi : null;
}

export function toPaperDraft(work: IOpenAlexWork): IItemDraft | null {
  const title = work.title?.trim();
  const doi = normalizeDoi(work.doi);
  const publishedAt = work.publication_date ?? (work.publication_year ? `${work.publication_year}-01-01` : null);

  if (!title || !doi || !publishedAt) {
    return null;
  }

  const authors = (work.authorships ?? [])
    .map((authorship) => authorship.author?.display_name?.trim() ?? '')
    .filter((name) => name.length > 0);

  return {
    kind: itemKinds.PAPER,
    externalId: doi,
    url: `https://doi.org/${doi}`,
    title,
    text: firstWords(rebuildAbstract(work.abstract_inverted_index), openAlexQuery.ABSTRACT_WORDS),
    authors,
    publishedAt: Timestamp.fromDate(new Date(publishedAt)),
    provider: itemProviders.OPENALEX,
  };
}
