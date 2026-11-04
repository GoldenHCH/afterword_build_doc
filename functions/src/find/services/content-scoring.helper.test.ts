import assert from 'node:assert/strict';
import { test } from 'node:test';

import notesJson from '../../seed/data/notes.json';
import postsJson from '../../seed/data/posts.json';
import sourcesJson from '../../seed/data/sources.json';
import {
  buildReadingNote,
  buildWhyThis,
  dedupeAcrossNotes,
  matchedKeywords,
  matchPostKeywords,
  normaliseHandle,
  paperYearsBack,
  pickSources,
  scoreItem,
  selectPostCandidates,
  sourceRankScore,
  stemWord,
} from './content-scoring.helper';

const now = new Date('2026-06-01T00:00:00Z');
const daysAgo = (days: number): { toMillis(): number } => ({ toMillis: () => now.getTime() - days * 86_400_000 });
const note = { keywords: ['transformer', 'attention'] };

test('scoreItem gives the maximum to a fresh item matching every keyword', () => {
  const item = { title: 'Transformer attention', text: '', publishedAt: daysAgo(0), sourceRank: 1 };

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

test('scoreItem combines all four weights', () => {
  const item = { title: 'Transformer', text: '', publishedAt: daysAgo(182.5), sourceRank: 0.5 };

  assert.ok(Math.abs(scoreItem(note, item, 0.7, now) - 0.53) < 1e-9);
});

test('scoreItem clamps recency to 1 for future items and to 0 beyond the horizon', () => {
  const future = { title: 'Unrelated', text: '', publishedAt: daysAgo(-30) };
  const ancient = { title: 'Unrelated', text: '', publishedAt: daysAgo(500) };

  assert.ok(Math.abs(scoreItem(note, future, 0, now) - 0.15) < 1e-9);
  assert.equal(scoreItem(note, ancient, 0, now), 0);
});

test('scoreItem ranks a better source position above a fresher but lower-ranked item', () => {
  const relevant = { title: 'Unrelated', text: '', publishedAt: daysAgo(300), sourceRank: 1 };
  const fresh = { title: 'Unrelated', text: '', publishedAt: daysAgo(0), sourceRank: 0.2 };

  assert.ok(scoreItem(note, relevant, 0.7, now) > scoreItem(note, fresh, 0.7, now));
});

test('scoreItem lets a fresh keyword match beat an old unrelated item ranked first by the source', () => {
  const sevenKeywords = { keywords: ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta'] };
  const oldTopRanked = { title: 'Unrelated', text: '', publishedAt: daysAgo(900), sourceRank: 1 };
  const freshMatch = { title: 'Alpha and beta', text: '', publishedAt: daysAgo(3), sourceRank: 0.25 };

  assert.ok(scoreItem(sevenKeywords, freshMatch, 0.7, now) > scoreItem(sevenKeywords, oldTopRanked, 0.7, now));
});

test('scoreItem treats a missing or out-of-range source rank as zero or one', () => {
  const base = { title: 'Unrelated', text: '', publishedAt: daysAgo(365) };

  assert.equal(scoreItem(note, base, 0, now), 0);
  assert.ok(Math.abs(scoreItem(note, { ...base, sourceRank: 3 }, 0, now) - 0.3) < 1e-9);
});

test('sourceRankScore gives the first result 1 and falls toward 0', () => {
  assert.equal(sourceRankScore(0, 4), 1);
  assert.equal(sourceRankScore(2, 4), 0.5);
  assert.equal(sourceRankScore(0, 0), 0);
});

test('stemWord folds common inflections together', () => {
  assert.equal(stemWord('coding'), stemWord('coded'));
  assert.equal(stemWord('codes'), stemWord('code'));
  assert.equal(stemWord('models'), stemWord('model'));
  assert.equal(stemWord('analysis'), 'analysis');
});

test('matchedKeywords matches multi-word keywords on word stems regardless of order, case or punctuation', () => {
  const keywordNote = { keywords: ["cohen's kappa", 'llm-assisted coding', 'state space models', 'codebook'] };
  const item = {
    title: 'Kappa reporting',
    text: 'Cohen proposed it. LLMs assist the coding of interviews with state-space model variants.',
    publishedAt: daysAgo(0),
  };

  assert.deepEqual(matchedKeywords(keywordNote, item), ["cohen's kappa", 'llm-assisted coding', 'state space models']);
});

test('matchedKeywords needs every word of a multi-word keyword', () => {
  const keywordNote = { keywords: ['reflexive thematic analysis'] };
  const item = { title: 'Thematic analysis', text: 'A guide', publishedAt: daysAgo(0) };

  assert.deepEqual(matchedKeywords(keywordNote, item), []);
});

test('paperYearsBack widens the window for stuck and question notes only', () => {
  assert.equal(paperYearsBack('stuck'), 8);
  assert.equal(paperYearsBack('question'), 8);
  assert.equal(paperYearsBack('working_on'), 3);
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

test('buildWhyThis names the note angle and the shared keywords without a model', () => {
  const candidate = {
    itemId: 'paper_1',
    item: {} as Afterword.Firestore.Item.IItem,
    score: 1,
    matchedKeywords: ['codebook', 'kappa'],
  };
  const noteWithAngle = { summary: 'Stuck on coding', angle: 'How to report intercoder reliability for reflexive analysis of interviews today?' };

  assert.equal(
    buildWhyThis(candidate, noteWithAngle),
    'Matches your note on How to report intercoder reliability for reflexive analysis of interviews...: shares codebook, kappa',
  );
  assert.equal(
    buildWhyThis({ ...candidate, matchedKeywords: [] }, noteWithAngle),
    'Paper for your note on How to report intercoder reliability for reflexive analysis of interviews...',
  );
  assert.equal(
    buildWhyThis(
      { ...candidate, matchedKeywords: [], item: { sourceHandle: '@Some_Handle' } as Afterword.Firestore.Item.IItem },
      { summary: 'Stuck on coding' },
    ),
    'Recent from @some_handle, for your note on Stuck on coding',
  );
  assert.equal(
    buildWhyThis(
      {
        ...candidate,
        matchedKeywords: [],
        handleTopic: 'ai in research',
        item: { sourceHandle: '@Some_Handle' } as Afterword.Firestore.Item.IItem,
      },
      { summary: 'Stuck on coding' },
    ),
    'Recent from @some_handle, who posts about ai in research',
  );
});

test('buildReadingNote puts rank one first and the rest after it', () => {
  assert.equal(buildReadingNote(1), 'Start here');
  assert.equal(buildReadingNote(2), 'Then this');
});

test('selectPostCandidates admits posts only by keyword or handle topic, per seeded note', () => {
  const sources = sourcesJson as unknown as Afterword.Firestore.Source.ISource[];
  const admittedByNote = new Map<string, number>();

  for (const seedNote of notesJson) {
    const chosenHandles = new Set(pickSources(seedNote, sources).map((source) => normaliseHandle(source.handle)));
    const candidates = postsJson
      .filter((post) => chosenHandles.has(normaliseHandle(post.handle)))
      .map((post) => {
        const topics = sources.find((source) => normaliseHandle(source.handle) === normaliseHandle(post.handle))?.topics ?? [];
        const item = {
          kind: 'post',
          title: '',
          text: post.text,
          sourceHandle: post.handle,
          publishedAt: { toMillis: () => new Date(post.publishedAt).getTime() },
        };

        return {
          itemId: post.externalId,
          item: item as unknown as Afterword.Firestore.Item.IItem,
          score: scoreItem(seedNote, { ...item, text: `${post.text} ${topics.join(' ')}` }, 0.7, now),
          matchedKeywords: matchPostKeywords(seedNote, item, topics),
        };
      });

    const admitted = selectPostCandidates(candidates, 3);

    assert.ok(
      admitted.every((candidate) => candidate.matchedKeywords.length > 0),
      `note ${seedNote.key} admits a post with no keyword or topic match`,
    );
    admittedByNote.set(seedNote.key, admitted.length);
  }

  assert.ok([...admittedByNote.values()].some((count) => count > 0), 'no seeded note admits any post');
});

test('selectPostCandidates keeps only matching posts and returns none when nothing matches', () => {
  const post = (itemId: string, matched: string[], daysOld: number): Parameters<typeof selectPostCandidates>[0][number] => ({
    itemId,
    item: { kind: 'post', publishedAt: daysAgo(daysOld) } as unknown as Afterword.Firestore.Item.IItem,
    score: matched.length / 10,
    matchedKeywords: matched,
  });

  assert.deepEqual(
    selectPostCandidates([post('old-match', ['a'], 30), post('new-miss', [], 1)], 3).map((candidate) => candidate.itemId),
    ['old-match'],
  );
  assert.deepEqual(selectPostCandidates([post('older', [], 9), post('newest', [], 2), post('oldest', [], 40)], 3), []);
  assert.deepEqual(selectPostCandidates([], 3), []);
});
