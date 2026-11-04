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
