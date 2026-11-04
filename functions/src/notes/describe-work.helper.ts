import { trimToWords } from '../brief/explain.helper';
import { noteKinds } from '../shared/note.constants';
import { describeWorkConfig, describeWorkPatterns, describeWorkPrompts } from './notes.constants';
import { IDescribeWorkDraft } from './notes.interfaces';

const validKinds: string[] = Object.values(noteKinds);

export function buildDescribeWorkSystemPrompt(): string {
  return describeWorkPrompts.SYSTEM.replace('{{SUMMARY_MAX_WORDS}}', String(describeWorkConfig.SUMMARY_MAX_WORDS))
    .replace('{{DETAIL_MAX_WORDS}}', String(describeWorkConfig.DETAIL_MAX_WORDS))
    .replace('{{ANGLE_MAX_WORDS}}', String(describeWorkConfig.ANGLE_MAX_WORDS))
    .replace('{{MIN_KEYWORDS}}', String(describeWorkConfig.MIN_KEYWORDS))
    .replace('{{MAX_KEYWORDS}}', String(describeWorkConfig.MAX_KEYWORDS));
}

export function buildDescribeWorkPrompt(text: string): string {
  return describeWorkPrompts.USER_TEMPLATE.replace('{{TEXT}}', () => text.trim());
}

export function parseDescribeWorkResponse(text: string): IDescribeWorkDraft | null {
  const fenced = describeWorkPatterns.FENCE.exec(text);
  const candidate = (fenced ? fenced[1] : text).trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');

  if (start === -1 || end <= start) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return null;
  }

  const { kind, summary, detail, angle, keywords, project } = parsed as Record<string, unknown>;

  if (typeof kind !== 'string' || !validKinds.includes(kind)) {
    return null;
  }

  if (typeof summary !== 'string' || summary.trim().length === 0) {
    return null;
  }

  if (!Array.isArray(keywords) || !keywords.every((keyword) => typeof keyword === 'string')) {
    return null;
  }

  return {
    kind: kind as Afterword.Firestore.Note.NoteKind,
    summary,
    detail: typeof detail === 'string' ? detail : null,
    angle: typeof angle === 'string' ? angle : null,
    keywords: keywords as string[],
    project: typeof project === 'string' ? project : null,
  };
}

export function normalizeDraft(draft: IDescribeWorkDraft): Afterword.Types.IDescribeWorkResponse['note'] {
  const detail = cleanOptional(draft.detail, describeWorkConfig.DETAIL_MAX_WORDS);
  const angle = cleanOptional(draft.angle, describeWorkConfig.ANGLE_MAX_WORDS);
  const project = cleanOptional(draft.project, describeWorkConfig.SUMMARY_MAX_WORDS);

  return {
    kind: draft.kind,
    summary: cleanSentence(draft.summary, describeWorkConfig.SUMMARY_MAX_WORDS),
    ...(detail ? { detail } : {}),
    ...(angle ? { angle } : {}),
    keywords: angle ? normalizeKeywords(draft.keywords) : [],
    ...(project ? { project } : {}),
  };
}

export function normalizeKeywords(keywords: string[]): string[] {
  const unique = new Set<string>();

  for (const keyword of keywords) {
    const cleaned = keyword.trim().replace(/\s+/g, ' ').toLowerCase();

    if (cleaned.length > 0) {
      unique.add(cleaned);
    }
  }

  return Array.from(unique).slice(0, describeWorkConfig.MAX_KEYWORDS);
}

function cleanOptional(text: string | null | undefined, maxWords: number): string | undefined {
  if (typeof text !== 'string') {
    return undefined;
  }

  const cleaned = cleanSentence(text, maxWords);

  return cleaned.length > 0 ? cleaned : undefined;
}

function cleanSentence(text: string, maxWords: number): string {
  return trimToWords(text.replace(describeWorkPatterns.DASH, ' - '), maxWords);
}
