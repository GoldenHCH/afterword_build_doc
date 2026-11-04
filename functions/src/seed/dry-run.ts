import { createHash } from 'node:crypto';

import { collections } from '../constants';
import { MemorySeedWriter } from './services/memory-seed-writer.service';
import { OpenAlexSeedService } from './services/openalex-seed.service';
import { SeedService } from './services/seed.service';

function print(line: string): void {
  process.stdout.write(`${line}\n`);
}

function labelOf(documentId: string, data: Record<string, unknown>): string {
  const label = data['title'] ?? data['summary'] ?? data['displayName'] ?? documentId;

  return String(label);
}

async function main(): Promise<void> {
  const writer = new MemorySeedWriter();
  const result = await new SeedService(writer, new OpenAlexSeedService()).run();
  const allIds: string[] = [];

  print('Dry run: nothing was written to Firestore.');

  for (const collection of Object.values(collections)) {
    const documents = writer.documents(collection);

    if (documents.length === 0) {
      continue;
    }

    documents.forEach(([documentId]) => allIds.push(`${collection}/${documentId}`));

    const [firstId, firstData] = documents[0];
    print(`${collection.padEnd(10)} ${String(documents.length).padStart(3)}   first: ${labelOf(firstId, firstData)}`);
  }

  print(`briefing   ${result.briefingSections} sections, ${result.briefingEntries} entries`);
  print(`items      ${result.items - result.openAlexPapers} cached + ${result.openAlexPapers} live from OpenAlex`);

  const idHash = createHash('sha1').update(allIds.sort().join('\n')).digest('hex');
  print(`ids        ${allIds.length} documents, sorted-id sha1 ${idHash}`);
}

main().catch((error: unknown) => {
  process.stderr.write(`Dry run failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
