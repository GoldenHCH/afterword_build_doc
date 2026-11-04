import assert from 'node:assert/strict';
import { test } from 'node:test';

import { rankLibraryItems } from './library-search.helper';

const buildItem = (
  id: string,
  title: string,
  savedAt: string,
  overrides: Partial<Afterword.Types.ISearchLibraryItem> = {},
): Afterword.Types.ISearchLibraryItem => ({
  id,
  itemId: `paper_${id}`,
  kind: 'paper',
  title,
  url: `https://example.org/${id}`,
  authors: [],
  publishedAt: '2025-01-01T00:00:00.000Z',
  keywords: [],
  whyThis: 'A short reason.',
  savedAt,
  ...overrides,
});

const items = [
  buildItem('old', 'Intercoder reliability in thematic analysis', '2026-01-01T00:00:00.000Z'),
  buildItem('new', 'Mamba recall limits', '2026-03-01T00:00:00.000Z'),
  buildItem('mid', 'Agreement statistics', '2026-02-01T00:00:00.000Z', {
    keywords: ['intercoder', 'kappa'],
    noteSummary: 'Stuck on reliability for interview coding',
  }),
];

test('ranks by how many query words match, then newest first', () => {
  const ranked = rankLibraryItems(items, 'intercoder reliability', 10);

  assert.deepEqual(
    ranked.map((item) => item.id),
    ['mid', 'old'],
  );
});

test('drops zero-match items when a query is given', () => {
  const ranked = rankLibraryItems(items, 'transformers', 10);

  assert.equal(ranked.length, 0);
});

test('without query words keeps every item newest first', () => {
  const ranked = rankLibraryItems(items, ' a ', 10);

  assert.deepEqual(
    ranked.map((item) => item.id),
    ['new', 'mid', 'old'],
  );
});

test('slices to the limit after ranking', () => {
  const ranked = rankLibraryItems(items, '', 2);

  assert.deepEqual(
    ranked.map((item) => item.id),
    ['new', 'mid'],
  );
});
