import assert from 'node:assert/strict';
import { test } from 'node:test';

import { applyExplanation, parseExplainResponse, trimToSentence, validateExplainResponse } from './explain.helper';

const buildEntry = (itemId: string, rank: number): Afterword.Firestore.Briefing.IBriefingEntry =>
  ({
    itemId,
    kind: 'paper',
    title: `Title ${itemId}`,
    url: `https://example.com/${itemId}`,
    authors: ['A. Author'],
    publishedAt: { toDate: () => new Date('2025-01-01T00:00:00Z') },
    rank,
    score: 1 - rank / 10,
    whyThis: `Matches: ${itemId}`,
  }) as unknown as Afterword.Firestore.Briefing.IBriefingEntry;

const section: Afterword.Firestore.Briefing.IBriefingSection = {
  noteId: 'note_one',
  noteSummary: 'Stuck on intercoder reliability',
  noteKind: 'stuck',
  entries: [buildEntry('a', 1), buildEntry('b', 2), buildEntry('c', 3)],
};

const explained = (itemId: string): { itemId: string; whyThis: string; readingNote: string } => ({
  itemId,
  whyThis: `Why ${itemId}`,
  readingNote: `Note ${itemId}`,
});

test('a valid response reorders the entries, reranks them and keeps every entry', () => {
  const response = { entries: [explained('a'), explained('b'), explained('c')], order: ['c', 'a', 'b'] };

  assert.equal(validateExplainResponse(response, section), null);

  const result = applyExplanation(section, response);

  assert.deepEqual(
    result.entries.map((entry) => [entry.itemId, entry.rank, entry.whyThis, entry.readingNote]),
    [
      ['c', 1, 'Why c', 'Note c'],
      ['a', 2, 'Why a', 'Note a'],
      ['b', 3, 'Why b', 'Note b'],
    ],
  );
  assert.equal(result.entries[0].score, section.entries[2].score);
  assert.equal(result.noteId, section.noteId);
});

test('an unknown itemId is rejected', () => {
  const response = { entries: [explained('a'), explained('b'), explained('z')], order: ['a', 'b', 'z'] };

  assert.match(validateExplainResponse(response, section) ?? '', /unknown itemId/);
});

test('an order that misses an itemId is rejected', () => {
  const response = { entries: [explained('a'), explained('b'), explained('c')], order: ['a', 'b'] };

  assert.match(validateExplainResponse(response, section) ?? '', /order/);
});

test('long lines are trimmed to the word limits instead of rejected', () => {
  const longLine = Array.from({ length: 60 }, (_, index) => `word${index}`).join(' ');
  const response = {
    entries: [{ ...explained('a'), whyThis: longLine, readingNote: `Start here — ${longLine}` }, explained('b'), explained('c')],
    order: ['a', 'b', 'c'],
  };

  assert.equal(validateExplainResponse(response, section), null);

  const [first] = applyExplanation(section, response).entries;
  const readingNote = first.readingNote ?? '';

  assert.equal(first.whyThis.split(' ').length, 40);
  assert.ok(first.whyThis.endsWith('.'));
  assert.equal(readingNote.split(' ').length, 20);
  assert.ok(!readingNote.includes('—'));
});

test('a fenced json block parses and prose without json does not', () => {
  const body = '{"entries":[{"itemId":"a","whyThis":"w","readingNote":"r"}],"order":["a"]}';

  assert.deepEqual(parseExplainResponse(`Here you go:\n\`\`\`json\n${body}\n\`\`\``), JSON.parse(body));
  assert.deepEqual(parseExplainResponse(body), JSON.parse(body));
  assert.equal(parseExplainResponse('Sorry, I cannot do that.'), null);
  assert.equal(parseExplainResponse('{"entries": "nope", "order": []}'), null);
});

test('trimToSentence keeps a short line, cuts at the last sentence end, then the last clause, and never ends on a conjunction', () => {
  assert.equal(trimToSentence('Gives you a codebook template.', 10), 'Gives you a codebook template.');
  assert.equal(
    trimToSentence('Shows how to report kappa for interviews. It also covers sampling and the rest of the story', 12),
    'Shows how to report kappa for interviews.',
  );
  assert.equal(
    trimToSentence('Shows how to report kappa for interviews, so you can anticipate reviewer pushback and then', 14),
    'Shows how to report kappa for interviews.',
  );
  assert.equal(
    trimToSentence('Defines the measure you need so you can anticipate and plan the next round of coding', 9),
    'Defines the measure you need so you can anticipate.',
  );
});
