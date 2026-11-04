import assert from 'node:assert/strict';
import { test } from 'node:test';

import { normalizeDraft, parseDescribeWorkResponse } from './describe-work.helper';

const validReply = {
  kind: 'stuck',
  summary: 'Stuck on intercoder reliability for my interview codes.',
  detail: 'Two coders, kappa of 0.41.',
  angle: 'How should agreement be reported for reflexive thematic analysis?',
  keywords: ['Intercoder Reliability', 'thematic analysis'],
  project: 'Interview study',
};

test('a bare JSON reply parses into a draft', () => {
  const draft = parseDescribeWorkResponse(JSON.stringify(validReply));

  assert.equal(draft?.kind, 'stuck');
  assert.equal(draft?.summary, validReply.summary);
  assert.deepEqual(draft?.keywords, validReply.keywords);
});

test('a fenced reply with chatter around it parses too', () => {
  const draft = parseDescribeWorkResponse(`Here you go:\n\`\`\`json\n${JSON.stringify(validReply)}\n\`\`\`\nDone.`);

  assert.equal(draft?.project, 'Interview study');
});

test('an unknown kind, an empty summary or bad keywords are rejected', () => {
  assert.equal(parseDescribeWorkResponse(JSON.stringify({ ...validReply, kind: 'idea' })), null);
  assert.equal(parseDescribeWorkResponse(JSON.stringify({ ...validReply, summary: '  ' })), null);
  assert.equal(parseDescribeWorkResponse(JSON.stringify({ ...validReply, keywords: 'a, b' })), null);
  assert.equal(parseDescribeWorkResponse(JSON.stringify({ ...validReply, keywords: ['a', 3] })), null);
  assert.equal(parseDescribeWorkResponse('not json at all'), null);
});

test('word caps are trimmed and dashes are replaced', () => {
  const longSummary = Array.from({ length: 40 }, (_, index) => `word${index}`).join(' ');
  const longDetail = Array.from({ length: 90 }, (_, index) => `detail${index}`).join(' ');
  const longAngle = `${Array.from({ length: 50 }, (_, index) => `angle${index}`).join(' ')} — end`;
  const note = normalizeDraft({ ...validReply, kind: 'stuck', summary: longSummary, detail: longDetail, angle: longAngle });

  assert.equal(note.summary.split(' ').length, 25);
  assert.equal(note.detail?.split(' ').length, 60);
  assert.equal(note.angle?.split(' ').length, 30);
  assert.ok(!note.angle?.includes('—'));
});

test('keywords are lowercased, deduplicated and capped at eight', () => {
  const keywords = ['Alpha', 'alpha ', ' Beta  Gamma', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
  const note = normalizeDraft({ ...validReply, kind: 'question', keywords });

  assert.deepEqual(note.keywords, ['alpha', 'beta gamma', 'd', 'e', 'f', 'g', 'h', 'i']);
});

test('null optional fields are left out and keywords are empty without an angle', () => {
  const note = normalizeDraft({
    kind: 'working_on',
    summary: 'Refactoring the build pipeline.',
    detail: null,
    angle: null,
    keywords: ['ignored'],
    project: null,
  });

  assert.deepEqual(note, { kind: 'working_on', summary: 'Refactoring the build pipeline.', keywords: [] });
  assert.ok(!('detail' in note));
  assert.ok(!('project' in note));
});
