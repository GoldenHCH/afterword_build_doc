import assert from 'node:assert/strict';
import { test } from 'node:test';

import { findBriefingEntry } from './library.helper';

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
