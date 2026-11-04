import { createHash } from 'node:crypto';

import { IBriefingEntryMatch } from './library.interfaces';

export function findBriefingEntry(
  briefing: Afterword.Firestore.Briefing.IBriefing,
  itemId: string,
): IBriefingEntryMatch | null {
  for (const section of briefing.sections) {
    const entry = section.entries.find((candidate) => candidate.itemId === itemId);

    if (entry) {
      return { section, entry };
    }
  }

  return null;
}

export function libraryDocId(userId: string, itemId: string): string {
  const hash = createHash('sha1').update(`${userId}:${itemId}`).digest('hex');

  return `lib_${hash}`;
}

export function isDocumentId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && !value.includes('/') && value !== '.' && value !== '..';
}
