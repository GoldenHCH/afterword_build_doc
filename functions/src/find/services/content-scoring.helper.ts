import { itemKinds } from '../../shared/item.constants';
import { NoteKind } from '../../shared/note.types';
import { findLimits, foundationalNoteKinds, scoringWeights } from '../find.constants';
import { briefingBuilder, fallbackLines, keywordMatching } from './briefing-builder.constants';
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
    const handle = normaliseHandle(candidate.item.sourceHandle);

    if (candidate.handleTopic) {
      return fallbackLines.RECENT_POST_TEMPLATE.replace('{{HANDLE}}', () => handle).replace(
        '{{TOPIC}}',
        () => candidate.handleTopic ?? '',
      );
    }

    return fallbackLines.RECENT_POST_NO_TOPIC_TEMPLATE.replace('{{HANDLE}}', () => handle).replace(
      '{{ANGLE}}',
      () => describeNoteAngle(note),
    );
  }

  return fallbackLines.PAPER_TEMPLATE.replace('{{ANGLE}}', () => describeNoteAngle(note));
}

export function buildReadingNote(rank: number): string {
  return rank === 1 ? fallbackLines.START_HERE : fallbackLines.THEN_THIS;
}

export function stemWord(word: string): string {
  let stem = word.toLowerCase();

  for (const suffix of keywordMatching.SUFFIXES) {
    const keepsS = suffix === 's' && keywordMatching.KEEP_S_AFTER.some((ending) => stem.endsWith(ending));

    if (!keepsS && stem.endsWith(suffix) && stem.length - suffix.length >= keywordMatching.MIN_STEM_LENGTH) {
      stem = stem.slice(0, stem.length - suffix.length);
      break;
    }
  }

  return stem.length > keywordMatching.MIN_STEM_LENGTH && stem.endsWith('e') ? stem.slice(0, -1) : stem;
}

export function toStems(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/['\u2019]s\b/g, '')
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 0);

  return words.map((word) => stemWord(word));
}

export function matchedKeywords(note: IScorableNote, item: IScorableItem): string[] {
  const haystack = new Set(toStems(`${item.title} ${item.text}`));

  return note.keywords.filter((keyword) => {
    const keywordStems = toStems(keyword);

    return keywordStems.length > 0 && keywordStems.every((stem) => haystack.has(stem));
  });
}

export function matchPostKeywords(note: IScorableNote, item: IScorableItem, handleTopics: string[]): string[] {
  return matchedKeywords(note, { ...item, text: `${item.text} ${handleTopics.join(' ')}` });
}

export function selectPostCandidates(candidates: IScoredCandidate[], limit: number): IScoredCandidate[] {
  const posts = candidates.filter((candidate) => candidate.item.kind === itemKinds.POST);
  const matching = posts
    .filter((candidate) => candidate.matchedKeywords.length > 0)
    .sort((first, second) => second.score - first.score)
    .slice(0, limit);

  if (matching.length > 0) {
    return matching;
  }

  const newestFirst = [...posts].sort(
    (first, second) => second.item.publishedAt.toMillis() - first.item.publishedAt.toMillis(),
  );

  return newestFirst.slice(0, 1);
}

export function sourceRankScore(position: number, total: number): number {
  return total <= 0 ? 0 : (total - position) / total;
}

export function paperYearsBack(noteKind: NoteKind): number {
  return foundationalNoteKinds.includes(noteKind)
    ? findLimits.PAPER_YEARS_BACK_FOUNDATIONAL
    : findLimits.PAPER_YEARS_BACK;
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
  const sourceRank = Math.min(1, Math.max(0, item.sourceRank ?? 0));

  return (
    scoringWeights.RECENCY * recency +
    scoringWeights.KEYWORD_OVERLAP * keywordOverlap +
    scoringWeights.SOURCE * sourceWeight +
    scoringWeights.SOURCE_RANK * sourceRank
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
