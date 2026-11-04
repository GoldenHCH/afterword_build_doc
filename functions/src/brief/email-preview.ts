import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { Timestamp } from 'firebase-admin/firestore';

import { demoUser } from '../constants';
import briefingJson from '../seed/data/briefing.json';
import notesJson from '../seed/data/notes.json';
import { ISeedBriefing, ISeedBriefingEntry, ISeedNote } from '../seed/seed.interfaces';
import { itemDocId } from '../shared/item-id.helper';
import { renderBriefingEmail } from './briefing-email.helper';
import { emailConfig } from './email.constants';

const seedBriefing = briefingJson as unknown as ISeedBriefing;
const seedNotes = notesJson as unknown as ISeedNote[];

function buildEntry(entry: ISeedBriefingEntry): Afterword.Firestore.Briefing.IBriefingEntry {
  return {
    itemId: itemDocId(entry.kind, entry.externalId),
    kind: entry.kind,
    title: entry.title,
    url: entry.url,
    authors: entry.authors,
    publishedAt: Timestamp.fromDate(new Date(entry.publishedAt)),
    ...(entry.sourceHandle ? { sourceHandle: entry.sourceHandle } : {}),
    rank: entry.rank,
    score: entry.score,
    whyThis: entry.whyThis,
    ...(entry.readingNote ? { readingNote: entry.readingNote } : {}),
  };
}

function buildBriefing(): Afterword.Firestore.Briefing.IBriefing {
  const sections = seedBriefing.sections.map((section): Afterword.Firestore.Briefing.IBriefingSection => {
    const note = seedNotes.find((candidate) => candidate.key === section.noteKey) as ISeedNote;

    return {
      noteId: `note_${note.key}`,
      noteSummary: note.summary,
      noteKind: note.kind,
      entries: section.entries.map(buildEntry),
    };
  });

  return { id: 'briefing_demo_seed', userId: demoUser.UID, status: 'ready', builtAt: Timestamp.now(), sections };
}

function main(): void {
  const rendered = renderBriefingEmail(
    buildBriefing(),
    { email: demoUser.EMAIL, displayName: demoUser.DISPLAY_NAME },
    emailConfig.APP_URL,
  );
  const outputDirectory = join(__dirname, '..', '..', 'tmp');
  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(join(outputDirectory, 'briefing.html'), rendered.html);
  writeFileSync(join(outputDirectory, 'briefing.txt'), rendered.text);

  process.stdout.write(`Subject: ${rendered.subject}\n`);
  process.stdout.write(`HTML: ${Buffer.byteLength(rendered.html, 'utf8')} bytes (limit ${emailConfig.MAX_HTML_BYTES})\n`);
  process.stdout.write(`Wrote ${join(outputDirectory, 'briefing.html')} and briefing.txt\n`);
}

main();
