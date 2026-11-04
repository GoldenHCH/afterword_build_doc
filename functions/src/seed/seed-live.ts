import { getApps, initializeApp } from 'firebase-admin/app';

import { FirestoreSeedWriter } from './services/firestore-seed-writer.service';
import { OpenAlexSeedService } from './services/openalex-seed.service';
import { SeedService } from './services/seed.service';

async function main(): Promise<void> {
  if (getApps().length === 0) {
    initializeApp();
  }

  const counts = await new SeedService(new FirestoreSeedWriter(), new OpenAlexSeedService()).run();

  process.stdout.write(`Seeded the live project: ${JSON.stringify(counts)}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
