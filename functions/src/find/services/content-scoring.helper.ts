import { scoringWeights } from '../find.constants';
import { briefingBuilder, fallbackLines } from './briefing-builder.constants';
import {
  IFallbackNote,
  INoteCandidates,
  IScorableItem,
  IScorableNote,
  IScoredCandidate,
} from './briefing-builder.interfaces';

export function normaliseHandle(handle: string): string {
  return handle.replace(/^@/, '').toLowerCase();
}

export function describeNoteAngle(note: IFallbackNote): string {
  const source = note.angle && note.angle.trim().length > 0 ? note.angle : note.summary;
  const words = source.trim().replace(/[?.!]+$/, '').split(/\s+/).filter((word) => word.length > 0);
  const kept = words.slice(0, fallbackLines.ANGLE_MAX_WORDS).join(' ');

  return words.length > fallbackLines.ANGLE_MAX_WORDS ? `${kept}...` : kept;
}

export function buildWhyThis(candidate: IScoredCandidate, note: IFallbackNote): string {
  if (candidate.matchedKeywords.length > 0) {
    return fallbackLines.MATCHES_TEMPLATE.replace('{{ANGLE}}', () => describeNoteAngle(note)).replace(
      '{{KEYWORDS}}',
      () => candidate.matchedKeywords.join(', '),
    );
  }

  if (candidate.item.sourceHandle) {
    return `Recent from @${normaliseHandle(candidate.item.sourceHandle)}`;
  }

  return 'Recent paper';
}

export function buildReadingNote(rank: number): string {
  return rank === 1 ? fallbackLines.START_HERE : fallbackLines.THEN_THIS;
}

export function matchedKeywords(note: IScorableNote, item: IScorableItem): string[] {
  const haystack = `${item.title} ${item.text}`.toLowerCase();

  return note.keywords.filter((keyword) => haystack.includes(keyword.toLowerCase()));
}

export function scoreItem(
  note: IScorableNote,
  item: IScorableItem,
  sourceWeight: number,
  now: Date = new Date(),
): number {
  const ageInDays = (now.getTime() - item.publishedAt.toMillis()) / briefingBuilder.MILLISECONDS_PER_DAY;
  const recency = Math.min(1, Math.max(0, 1 - ageInDays / scoringWeights.RECENCY_HORIZON_DAYS));
  const keywordOverlap =
    note.keywords.length === 0 ? 0 : matchedKeywords(note, item).length / note.keywords.length;

  return (
    scoringWeights.RECENCY * recency +
    scoringWeights.KEYWORD_OVERLAP * keywordOverlap +
    scoringWeights.SOURCE * sourceWeight
  );
}

export function pickSources(
  note: IScorableNote,
  sources: Afterword.Firestore.Source.ISource[],
): Afterword.Firestore.Source.ISource[] {
  const noteKeywords = new Set(note.keywords.map((keyword) => keyword.toLowerCase()));
  const overlapping = sources.filter((source) => source.topics.some((topic) => noteKeywords.has(topic.toLowerCase())));

  return overlapping.length > 0 ? overlapping : sources;
}

export function dedupeAcrossNotes<TCandidate extends { itemId: string; score: number }>(
  groups: INoteCandidates<TCandidate>[],
): INoteCandidates<TCandidate>[] {
  const bestByItemId = new Map<string, { groupIndex: number; score: number }>();

  groups.forEach((group, groupIndex) => {
    for (const candidate of group.candidates) {
      const best = bestByItemId.get(candidate.itemId);

      if (!best || candidate.score > best.score) {
        bestByItemId.set(candidate.itemId, { groupIndex, score: candidate.score });
      }
    }
  });

  return groups.map((group, groupIndex) => ({
    noteId: group.noteId,
    candidates: group.candidates.filter((candidate) => bestByItemId.get(candidate.itemId)?.groupIndex === groupIndex),
  }));
}
