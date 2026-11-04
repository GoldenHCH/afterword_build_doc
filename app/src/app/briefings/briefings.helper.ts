import { FirebaseError } from 'firebase/app';

import { backendErrorCodes, briefingsConfig, briefingsCopy, deadlineExceededCode } from './briefings.constants';

type IBriefing = Afterword.Firestore.Briefing.IBriefing;
type IBriefingEntry = Afterword.Firestore.Briefing.IBriefingEntry;
type IBriefingSection = Afterword.Firestore.Briefing.IBriefingSection;

export function formatAuthors(authors: string[]): string {
  const shownAuthors = authors.slice(0, briefingsConfig.MAX_AUTHORS).join(', ');

  return authors.length > briefingsConfig.MAX_AUTHORS ? `${shownAuthors} ${briefingsCopy.AUTHORS_ET_AL}` : shownAuthors;
}

export function formatByline(entry: IBriefingEntry): string {
  if (entry.kind === 'post' && entry.sourceHandle) {
    return `@${entry.sourceHandle.replace(/^@/, '')}`;
  }

  return formatAuthors(entry.authors);
}

export function toSortedSections(briefing: IBriefing | null): IBriefingSection[] {
  if (!briefing) {
    return [];
  }

  return briefing.sections
    .filter((section) => section.entries.length > 0)
    .map((section) => ({ ...section, entries: [...section.entries].sort((first, second) => first.rank - second.rank) }));
}

export function findEntry(briefing: IBriefing, itemId: string): IBriefingEntry | undefined {
  return briefing.sections.flatMap((section) => section.entries).find((entry) => entry.itemId === itemId);
}

export function entryDomId(itemId: string): string {
  return `${briefingsConfig.ENTRY_ID_PREFIX}${itemId}`;
}

export function toErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof FirebaseError)) {
    return fallback;
  }

  if (error.code === deadlineExceededCode) {
    return briefingsCopy.BUILD_TIMEOUT;
  }

  const hasBackendMessage = (Object.values(backendErrorCodes) as string[]).includes(error.code);
  const isReadable = error.message.trim().length > 0 && error.message.trim().toLowerCase() !== 'internal';

  return hasBackendMessage && isReadable ? error.message : fallback;
}
