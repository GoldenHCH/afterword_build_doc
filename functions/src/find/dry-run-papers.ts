import notesJson from '../seed/data/notes.json';
import { yearsBefore } from '../seed/services/openalex.helper';
import { findLimits } from './find.constants';
import { createPaperSource } from './services/paper-source.factory';

function print(line: string): void {
  process.stdout.write(`${line}\n`);
}

async function main(): Promise<void> {
  const [firstNote] = notesJson;
  const drafts = await createPaperSource().search({
    angle: firstNote.angle,
    keywords: firstNote.keywords,
    limit: findLimits.PAPERS_PER_NOTE_QUERY,
    publishedAfter: yearsBefore(new Date(), findLimits.PAPER_YEARS_BACK),
  });

  print(`angle: ${firstNote.angle}`);
  print(`${drafts.length} papers`);

  for (const draft of drafts) {
    const date = draft.publishedAt.toDate().toISOString().slice(0, 10);
    print(`${draft.provider.padEnd(9)} ${date}  ${draft.externalId}  ${draft.title}`);
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
