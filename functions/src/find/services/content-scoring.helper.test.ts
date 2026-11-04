import assert from 'node:assert/strict';
import { test } from 'node:test';

import { dedupeAcrossNotes, scoreItem } from './content-scoring.helper';

const now = new Date('2026-06-01T00:00:00Z');
const daysAgo = (days: number): { toMillis(): number } => ({ toMillis: () => now.getTime() - days * 86_400_000 });
const note = { keywords: ['transformer', 'attention'] };

test('scoreItem gives the maximum to a fresh item matching every keyword', () => {
  const item = { title: 'Transformer attention', text: '', publishedAt: daysAgo(0) };

  assert.ok(Math.abs(scoreItem(note, item, 1, now) - 1) < 1e-9);
});

test('scoreItem drops recency to zero for a year-old item', () => {
  const item = { title: 'Unrelated', text: '', publishedAt: daysAgo(365) };

  assert.equal(scoreItem(note, item, 0, now), 0);
});

test('scoreItem counts keyword overlap case-insensitively across title and text', () => {
  const full = { title: 'TRANSFORMER', text: 'about Attention', publishedAt: daysAgo(365) };
  const none = { title: 'Cooking', text: 'pasta', publishedAt: daysAgo(365) };

  assert.ok(Math.abs(scoreItem(note, full, 0, now) - 0.4) < 1e-9);
  assert.equal(scoreItem(note, none, 0, now), 0);
});

test('dedupeAcrossNotes keeps an item under the note where it scores highest, first note on ties', () => {
  const result = dedupeAcrossNotes([
    {
      noteId: 'a',
      candidates: [
        { itemId: 'shared', score: 0.5 },
        { itemId: 'tied', score: 0.4 },
        { itemId: 'only-a', score: 0.1 },
      ],
    },
    {
      noteId: 'b',
      candidates: [
        { itemId: 'shared', score: 0.9 },
        { itemId: 'tied', score: 0.4 },
      ],
    },
  ]);

  assert.deepEqual(
    result.map((group) => group.candidates.map((candidate) => candidate.itemId)),
    [['tied', 'only-a'], ['shared']],
  );
});
