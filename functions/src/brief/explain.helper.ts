import { danglingWords, explainConfig, explainPatterns, explainPrompts } from './brief.constants';
import {
  IEntryWithText,
  IExplainNoteContext,
  IExplainPromptEntry,
  IExplainResponse,
  IExplainedEntry,
} from './brief.interfaces';

export function buildSystemPrompt(): string {
  return explainPrompts.SYSTEM.replace('{{WHY_THIS_MAX_WORDS}}', String(explainConfig.WHY_THIS_MAX_WORDS)).replace(
    '{{READING_NOTE_MAX_WORDS}}',
    String(explainConfig.READING_NOTE_MAX_WORDS),
  );
}

export function trimToWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter((word) => word.length > 0);

  return words.slice(0, maxWords).join(' ');
}

export function trimToSentence(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter((word) => word.length > 0);

  if (words.length <= maxWords) {
    return words.join(' ');
  }

  const minWords = Math.min(explainConfig.MIN_TRIMMED_WORDS, maxWords);

  for (let count = maxWords; count >= minWords; count -= 1) {
    if (explainPatterns.SENTENCE_END.test(words[count - 1])) {
      return words.slice(0, count).join(' ');
    }
  }

  for (let count = maxWords; count >= minWords; count -= 1) {
    if (explainPatterns.CLAUSE_END.test(words[count - 1])) {
      return endWithPeriod(words.slice(0, count));
    }
  }

  return endWithPeriod(words.slice(0, maxWords));
}

function endWithPeriod(words: string[]): string {
  const kept = [...words];

  while (kept.length > 1) {
    const last = kept[kept.length - 1].replace(explainPatterns.TRAILING_PUNCTUATION, '').toLowerCase();

    if (!danglingWords.has(last) && last.length > 0) {
      break;
    }

    kept.pop();
  }

  return `${kept.join(' ').replace(explainPatterns.TRAILING_PUNCTUATION, '')}.`;
}

export function buildExplainPrompt(note: IExplainNoteContext, entriesWithText: IEntryWithText[]): string {
  const noteContext = {
    kind: note.kind,
    summary: note.summary,
    detail: note.detail ?? null,
    angle: note.angle ?? null,
    keywords: note.keywords,
  };

  const promptEntries: IExplainPromptEntry[] = entriesWithText.map(({ entry, text }) => ({
    itemId: entry.itemId,
    kind: entry.kind,
    title: entry.title,
    authors: entry.authors,
    publishedAt: entry.publishedAt.toDate().toISOString().slice(0, 10),
    text: trimToWords(text, explainConfig.PROMPT_TEXT_MAX_WORDS),
  }));

  return explainPrompts.USER_TEMPLATE.replace('{{NOTE_JSON}}', () => JSON.stringify(noteContext, null, 2))
    .replace('{{ENTRY_COUNT}}', () => String(promptEntries.length))
    .replace('{{ENTRIES_JSON}}', () => JSON.stringify(promptEntries, null, 2));
}

export function parseExplainResponse(text: string): IExplainResponse | null {
  const fenced = explainPatterns.FENCE.exec(text);
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

  const { entries, order } = parsed as Record<string, unknown>;

  if (!Array.isArray(entries) || !Array.isArray(order)) {
    return null;
  }

  const entriesAreObjects = entries.every((entry) => typeof entry === 'object' && entry !== null);
  const orderIsStrings = order.every((itemId) => typeof itemId === 'string');

  if (!entriesAreObjects || !orderIsStrings) {
    return null;
  }

  return { entries: entries as IExplainedEntry[], order: order as string[] };
}

export function validateExplainResponse(
  response: IExplainResponse,
  section: Afterword.Firestore.Briefing.IBriefingSection,
): string | null {
  const sectionItemIds = new Set(section.entries.map((entry) => entry.itemId));
  const explainedItemIds = new Set<string>();

  for (const entry of response.entries) {
    if (typeof entry.itemId !== 'string' || !sectionItemIds.has(entry.itemId)) {
      return `unknown itemId in entries: ${String(entry.itemId)}`;
    }

    if (explainedItemIds.has(entry.itemId)) {
      return `duplicate itemId in entries: ${entry.itemId}`;
    }

    if (typeof entry.whyThis !== 'string' || entry.whyThis.trim().length === 0) {
      return `empty whyThis for ${entry.itemId}`;
    }

    if (typeof entry.readingNote !== 'string' || entry.readingNote.trim().length === 0) {
      return `empty readingNote for ${entry.itemId}`;
    }

    explainedItemIds.add(entry.itemId);
  }

  for (const itemId of sectionItemIds) {
    if (!explainedItemIds.has(itemId)) {
      return `missing itemId in entries: ${itemId}`;
    }
  }

  const orderedItemIds = new Set<string>();

  for (const itemId of response.order) {
    if (!sectionItemIds.has(itemId)) {
      return `unknown itemId in order: ${itemId}`;
    }

    if (orderedItemIds.has(itemId)) {
      return `duplicate itemId in order: ${itemId}`;
    }

    orderedItemIds.add(itemId);
  }

  if (orderedItemIds.size !== sectionItemIds.size) {
    return 'order does not list every itemId';
  }

  return null;
}

export function applyExplanation(
  section: Afterword.Firestore.Briefing.IBriefingSection,
  response: IExplainResponse,
): Afterword.Firestore.Briefing.IBriefingSection {
  const entriesById = new Map(section.entries.map((entry) => [entry.itemId, entry]));
  const explanationsById = new Map(response.entries.map((entry) => [entry.itemId, entry]));

  const entries = response.order.map((itemId, index): Afterword.Firestore.Briefing.IBriefingEntry => {
    const entry = entriesById.get(itemId) as Afterword.Firestore.Briefing.IBriefingEntry;
    const explanation = explanationsById.get(itemId) as IExplainedEntry;

    return {
      ...entry,
      rank: index + 1,
      whyThis: cleanSentence(explanation.whyThis, explainConfig.WHY_THIS_ACCEPT_MAX_WORDS),
      readingNote: cleanSentence(explanation.readingNote, explainConfig.READING_NOTE_ACCEPT_MAX_WORDS),
    };
  });

  return { ...section, entries };
}

function cleanSentence(text: string, maxWords: number): string {
  return trimToSentence(text.replace(explainPatterns.DASH, ' - '), maxWords);
}
