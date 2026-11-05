import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collections } from '../constants';
import { noteKinds, noteSources, noteStatuses } from '../shared/note.constants';
import { mcpAuth, mcpLimits } from './mcp.constants';
import contract from './connector.contract.json';

type NoteField = Exclude<keyof Afterword.Firestore.Note.INote, 'id'>;

const noteFieldIsRequired: Record<NoteField, boolean> = {
  userId: true,
  kind: true,
  summary: true,
  detail: false,
  angle: false,
  keywords: true,
  project: false,
  status: true,
  source: true,
  createdAt: true,
  resolvedAt: false,
  lastFetchedAt: false,
  lastFetchedItemIds: false,
};

const fieldsWhere = (required: boolean): string[] =>
  Object.entries(noteFieldIsRequired)
    .filter(([, isRequired]) => isRequired === required)
    .map(([field]) => field)
    .sort();

test('the connector contract matches the searchPapers and searchLibrary constants', () => {
  assert.equal(contract.keyHeader, mcpAuth.KEY_HEADER);
  assert.deepEqual(contract.searchPapers.angle, {
    minLength: mcpLimits.ANGLE_MIN_LENGTH,
    maxLength: mcpLimits.ANGLE_MAX_LENGTH,
  });
  assert.deepEqual(contract.searchPapers.keywords, {
    maxCount: mcpLimits.KEYWORDS_MAX_COUNT,
    maxLength: mcpLimits.KEYWORD_MAX_LENGTH,
  });
  assert.deepEqual(contract.searchPapers.limit, {
    default: mcpLimits.PAPERS_DEFAULT_LIMIT,
    max: mcpLimits.PAPERS_MAX_LIMIT,
  });
  assert.deepEqual(contract.searchLibrary.query, { maxLength: mcpLimits.QUERY_MAX_LENGTH });
  assert.deepEqual(contract.searchLibrary.limit, {
    default: mcpLimits.LIBRARY_DEFAULT_LIMIT,
    max: mcpLimits.LIBRARY_MAX_LIMIT,
  });
});

test('the connector contract matches the note document', () => {
  assert.equal(contract.notes.collection, collections.NOTES);
  assert.deepEqual(contract.notes.kinds, Object.values(noteKinds));
  assert.deepEqual(contract.notes.statuses, Object.values(noteStatuses));
  assert.deepEqual(contract.notes.sources, Object.values(noteSources));
  assert.deepEqual([...contract.notes.requiredFields].sort(), fieldsWhere(true));
  assert.deepEqual([...contract.notes.optionalFields].sort(), fieldsWhere(false));
});
