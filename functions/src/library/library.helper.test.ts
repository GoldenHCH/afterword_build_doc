import assert from 'node:assert/strict';
import { test } from 'node:test';

import { findBriefingEntry, isDocumentId, libraryDocId } from './library.helper';

const buildEntry = (itemId: string): Afterword.Firestore.Briefing.IBriefingEntry =>
  ({ itemId, kind: 'paper', title: itemId, rank: 1, score: 1, whyThis: 'why' }) as Afterword.Firestore.Briefing.IBriefingEntry;

const briefing = {
  userId: 'demo-researcher',
  status: 'ready',
  sections: [
    { noteId: 'note_one', noteSummary: 'One', noteKind: 'stuck', entries: [buildEntry('a')] },
    { noteId: 'note_two', noteSummary: 'Two', noteKind: 'question', entries: [buildEntry('b'), buildEntry('c')] },
  ],
} as unknown as Afterword.Firestore.Briefing.IBriefing;

test('finds an entry with the section it belongs to, or null', () => {
  const match = findBriefingEntry(briefing, 'c');

  assert.equal(match?.entry.itemId, 'c');
  assert.equal(match?.section.noteId, 'note_two');
  assert.equal(findBriefingEntry(briefing, 'missing'), null);
});

test('the library document id is stable per user and item and differs otherwise', () => {
  assert.equal(libraryDocId('user_a', 'paper_1'), libraryDocId('user_a', 'paper_1'));
  assert.notEqual(libraryDocId('user_a', 'paper_1'), libraryDocId('user_b', 'paper_1'));
  assert.notEqual(libraryDocId('user_a', 'paper_1'), libraryDocId('user_a', 'paper_2'));
  assert.match(libraryDocId('user_a', 'paper_1'), /^lib_[0-9a-f]{40}$/);
});

test('document ids must be non-empty strings without slashes', () => {
  assert.equal(isDocumentId('paper_abc123'), true);
  assert.equal(isDocumentId(''), false);
  assert.equal(isDocumentId('  '), false);
  assert.equal(isDocumentId('a/b'), false);
  assert.equal(isDocumentId(42), false);
  assert.equal(isDocumentId(undefined), false);
});
